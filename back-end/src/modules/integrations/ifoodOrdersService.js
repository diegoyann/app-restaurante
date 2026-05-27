import {
  ensureOk,
  getTenantRowBySlug,
  maybeSingle,
  normalizeMoney,
  supabaseAdmin
} from '../shared/db.js';
import { saveOrder } from '../orders/repository.js';

function normalizeIfoodStatus(value) {
  const status = String(value || '').trim().toLowerCase();
  const statusMap = {
    placed: 'placed',
    confirmed: 'accepted',
    accepted: 'accepted',
    preparing: 'preparing',
    ready: 'ready',
    dispatched: 'dispatched',
    delivered: 'delivered',
    concluded: 'delivered',
    cancelled: 'cancelled',
    canceled: 'cancelled'
  };

  return statusMap[status] || 'placed';
}

function normalizeIfoodItems(order) {
  const items = Array.isArray(order.items) ? order.items : [];

  return items.map((item, index) => {
    const quantity = Number(item.quantity || 1);
    const total = normalizeMoney(item.totalPrice ?? item.total ?? item.price);
    const unitPrice = normalizeMoney(item.unitPrice ?? (quantity > 0 ? total / quantity : total));

    return {
      name: String(item.name || item.description || `Item ${index + 1}`).trim(),
      section: item.section || 'food',
      category: String(item.category || 'iFood').trim(),
      quantity,
      unitPrice,
      totalPrice: total || normalizeMoney(unitPrice * quantity),
      notes: String(item.notes || item.observations || '').trim(),
      sortOrder: Number.isInteger(item.sortOrder) ? item.sortOrder : index
    };
  });
}

function buildIfoodOrderNumber(externalId) {
  const suffix = String(externalId || '').trim().slice(-8).toUpperCase();
  return suffix ? `IFOOD-${suffix}` : `IFOOD-${Date.now()}`;
}

async function getExistingExternalOrder(tenantId, source, externalId) {
  return maybeSingle(
    await supabaseAdmin
      .from('orders')
      .select('id, customer_id')
      .eq('tenant_id', tenantId)
      .eq('external_source', source)
      .eq('external_id', externalId)
      .maybeSingle(),
    'Falha ao localizar pedido externo.'
  );
}

async function findOrCreatePaymentMethod(tenantId, paymentName) {
  const name = String(paymentName || 'iFood').trim() || 'iFood';
  const existing = maybeSingle(
    await supabaseAdmin
      .from('payment_methods')
      .select('*')
      .eq('tenant_id', tenantId)
      .ilike('name', name)
      .maybeSingle(),
    'Falha ao localizar forma de pagamento.'
  );

  if (existing) return existing;

  return ensureOk(
    await supabaseAdmin
      .from('payment_methods')
      .insert({
        tenant_id: tenantId,
        name,
        kind: 'other',
        status: 'active'
      })
      .select('*')
      .single(),
    'Falha ao criar forma de pagamento externa.'
  );
}

async function findOrCreateCustomer(tenantId, customer = {}) {
  const phone = String(customer.phone || '').trim();
  const name = String(customer.name || customer.fullName || '').trim() || 'Cliente iFood';

  if (phone) {
    const existing = maybeSingle(
      await supabaseAdmin
        .from('customers')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('phone', phone)
        .maybeSingle(),
      'Falha ao localizar cliente externo.'
    );

    if (existing) return existing;
  }

  return ensureOk(
    await supabaseAdmin
      .from('customers')
      .insert({
        tenant_id: tenantId,
        full_name: name,
        phone,
        email: String(customer.email || '').trim(),
        document: String(customer.document || '').trim(),
        address_line: String(customer.addressLine || customer.street || '').trim(),
        address_number: String(customer.addressNumber || customer.number || '').trim(),
        address_complement: String(customer.addressComplement || customer.complement || '').trim(),
        district: String(customer.district || customer.neighborhood || '').trim(),
        city: String(customer.city || '').trim(),
        state: String(customer.state || '').trim(),
        postal_code: String(customer.postalCode || customer.zipCode || '').trim(),
        notes: String(customer.notes || '').trim(),
        status: 'active'
      })
      .select('*')
      .single(),
    'Falha ao criar cliente externo.'
  );
}

export async function importIfoodOrders(tenantSlug, payload = {}) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const settings = maybeSingle(
    await supabaseAdmin
      .from('tenant_settings')
      .select('ifood_tax')
      .eq('tenant_id', tenant.id)
      .maybeSingle(),
    'Falha ao carregar configuração do iFood.'
  );
  const orders = Array.isArray(payload.orders) ? payload.orders : [];
  const results = [];

  if (orders.length === 0) throw new Error('Informe pelo menos um pedido em orders.');

  for (const externalOrder of orders) {
    const externalId = String(externalOrder.externalId || externalOrder.id || externalOrder.orderId || '').trim();

    if (!externalId) {
      results.push({ externalId: '', status: 'failed', error: 'externalId é obrigatório.' });
      continue;
    }

    try {
      const source = 'ifood';
      const existing = await getExistingExternalOrder(tenant.id, source, externalId);
      const customer = existing?.customer_id
        ? { id: existing.customer_id }
        : await findOrCreateCustomer(tenant.id, externalOrder.customer || {});
      const paymentMethod = await findOrCreatePaymentMethod(tenant.id, externalOrder.payment?.method || externalOrder.paymentMethod || 'iFood');
      const items = normalizeIfoodItems(externalOrder);
      const subtotal = normalizeMoney(externalOrder.subtotal ?? items.reduce((sum, item) => sum + item.totalPrice, 0));
      const deliveryFee = normalizeMoney(externalOrder.deliveryFee);
      const discount = normalizeMoney(externalOrder.discount);
      const total = normalizeMoney(externalOrder.total ?? subtotal + deliveryFee - discount);
      const explicitPlatformFee = externalOrder.platformFee ?? externalOrder.ifoodFee ?? externalOrder.commissionAmount;
      const platformFee = explicitPlatformFee === undefined || explicitPlatformFee === null
        ? normalizeMoney(total * (Number(settings?.ifood_tax || 0) / 100))
        : normalizeMoney(explicitPlatformFee);
      const status = normalizeIfoodStatus(externalOrder.status);
      const deliveredAt = externalOrder.deliveredAt || (status === 'delivered' ? externalOrder.updatedAt || externalOrder.createdAt || new Date().toISOString() : null);

      const order = await saveOrder(tenantSlug, {
        id: existing?.id,
        customerId: customer.id,
        paymentMethodId: paymentMethod.id,
        orderNumber: String(externalOrder.orderNumber || buildIfoodOrderNumber(externalId)).trim(),
        channel: 'ifood',
        externalSource: source,
        externalId,
        externalPayload: externalOrder,
        orderType: externalOrder.orderType || 'delivery',
        status,
        deliveryStatus: status === 'delivered' ? 'delivered' : status === 'cancelled' ? 'cancelled' : 'waiting',
        deliveredAt,
        subtotal,
        deliveryFee,
        discount,
        total,
        platformFee,
        paidAmount: normalizeMoney(externalOrder.paidAmount ?? total),
        notes: String(externalOrder.notes || '').trim(),
        items
      });

      ensureOk(
        await supabaseAdmin
          .from('external_order_imports')
          .upsert({
            tenant_id: tenant.id,
            source,
            external_id: externalId,
            order_id: order.id,
            status: existing ? 'updated' : 'imported',
            raw_payload: externalOrder
          }, { onConflict: 'tenant_id,source,external_id' }),
        'Falha ao registrar importação externa.'
      );

      results.push({ externalId, status: existing ? 'updated' : 'imported', order });
    } catch (error) {
      ensureOk(
        await supabaseAdmin
          .from('external_order_imports')
          .upsert({
            tenant_id: tenant.id,
            source: 'ifood',
            external_id: externalId,
            status: 'failed',
            raw_payload: {
              ...externalOrder,
              importError: error.message
            }
          }, { onConflict: 'tenant_id,source,external_id' }),
        'Falha ao registrar erro de importação externa.'
      );

      results.push({ externalId, status: 'failed', error: error.message });
    }
  }

  return {
    source: 'ifood',
    imported: results.filter((item) => item.status === 'imported').length,
    updated: results.filter((item) => item.status === 'updated').length,
    failed: results.filter((item) => item.status === 'failed').length,
    results
  };
}
