import {
  ensureOk,
  getTenantRowBySlug,
  maybeSingle,
  normalizeMoney,
  sanitizeJsonArray,
  supabaseAdmin
} from '../shared/db.js';
import { mapOrder } from '../shared/mappers.js';
import {
  deleteTransactionBySource,
  syncOrderFinancialTransaction
} from '../finance/repository.js';

function normalizeOrderItems(items) {
  return sanitizeJsonArray(items).map((item, index) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = normalizeMoney(item.unitPrice);
    const totalPrice = normalizeMoney(item.totalPrice || quantity * unitPrice);
    const name = String(item.name || item.itemName || '').trim();
    const section = ['food', 'beverage', 'other'].includes(item.section) ? item.section : 'food';

    if (!name) throw new Error('Nome do item do pedido é obrigatório.');
    if (quantity <= 0) throw new Error('Quantidade do item do pedido precisa ser maior que zero.');

    return {
      menu_item_id: item.menuItemId || null,
      product_id: item.productId || null,
      item_name: name,
      item_category: String(item.category || '').trim(),
      item_section: section,
      quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      notes: String(item.notes || '').trim(),
      sort_order: Number.isInteger(item.sortOrder) ? item.sortOrder : index
    };
  });
}

export async function saveOrder(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const existingOrder = payload.id
    ? maybeSingle(
        await supabaseAdmin
          .from('orders')
          .select('external_source, external_id, external_payload, platform_fee_amount')
          .eq('tenant_id', tenant.id)
          .eq('id', payload.id)
          .maybeSingle(),
        'Falha ao carregar pedido existente.'
      )
    : null;
  const items = normalizeOrderItems(payload.items);
  const subtotal = normalizeMoney(payload.subtotal || items.reduce((sum, item) => sum + Number(item.total_price || 0), 0));
  const deliveryFee = normalizeMoney(payload.deliveryFee);
  const discount = normalizeMoney(payload.discount);
  const total = normalizeMoney(payload.total || subtotal + deliveryFee - discount);
  const paidAmount = normalizeMoney(payload.paidAmount);
  const changeAmount = normalizeMoney(payload.changeAmount);
  const deliveryCost = normalizeMoney(payload.deliveryCost);
  const platformFee = payload.platformFee === undefined
    ? normalizeMoney(existingOrder?.platform_fee_amount)
    : normalizeMoney(payload.platformFee);
  const driverDailyAmount = normalizeMoney(payload.driverDailyAmount);
  const driverDeliveryAmount = normalizeMoney(payload.driverDeliveryAmount);
  const cashChangeRequired = normalizeMoney(payload.cashChangeRequired);
  const allowedTypes = ['delivery', 'pickup', 'dine_in'];
  const allowedStatuses = ['draft', 'placed', 'accepted', 'preparing', 'ready', 'dispatched', 'delivered', 'cancelled'];
  const allowedDeliveryStatuses = ['waiting', 'assigned', 'out_for_delivery', 'delivered', 'cancelled'];

  const orderPayload = {
    tenant_id: tenant.id,
    customer_id: payload.customerId || null,
    payment_method_id: payload.paymentMethodId || null,
    order_number: String(payload.orderNumber || '').trim(),
    channel: String(payload.channel || 'manual').trim(),
    external_source: payload.externalSource === undefined ? existingOrder?.external_source || '' : String(payload.externalSource || '').trim(),
    external_id: payload.externalId === undefined ? existingOrder?.external_id || '' : String(payload.externalId || '').trim(),
    external_payload: payload.externalPayload === undefined
      ? existingOrder?.external_payload || {}
      : payload.externalPayload && typeof payload.externalPayload === 'object' ? payload.externalPayload : {},
    order_type: allowedTypes.includes(payload.orderType) ? payload.orderType : 'delivery',
    status: allowedStatuses.includes(payload.status) ? payload.status : 'draft',
    delivery_driver_id: payload.deliveryDriverId || null,
    delivery_status: allowedDeliveryStatuses.includes(payload.deliveryStatus) ? payload.deliveryStatus : 'waiting',
    dispatched_at: payload.dispatchedAt || null,
    delivered_at: payload.deliveredAt || null,
    delivery_cost: deliveryCost,
    driver_daily_amount: driverDailyAmount,
    driver_delivery_amount: driverDeliveryAmount,
    cash_change_required: cashChangeRequired,
    card_machine_code: String(payload.cardMachineCode || '').trim(),
    subtotal_amount: subtotal,
    delivery_fee: deliveryFee,
    discount_amount: discount,
    total_amount: total,
    platform_fee_amount: platformFee,
    paid_amount: paidAmount,
    change_amount: changeAmount,
    notes: String(payload.notes || '').trim()
  };

  const row = ensureOk(
    payload.id
      ? await supabaseAdmin
          .from('orders')
          .update(orderPayload)
          .eq('tenant_id', tenant.id)
          .eq('id', payload.id)
          .select('*')
          .single()
      : await supabaseAdmin
          .from('orders')
          .insert(orderPayload)
          .select('*')
          .single(),
    'Falha ao salvar pedido.'
  );

  ensureOk(
    await supabaseAdmin
      .from('order_items')
      .delete()
      .eq('tenant_id', tenant.id)
      .eq('order_id', row.id),
    'Falha ao limpar itens do pedido.'
  );

  if (items.length > 0) {
    ensureOk(
      await supabaseAdmin
        .from('order_items')
        .insert(items.map((item) => ({
          ...item,
          tenant_id: tenant.id,
          order_id: row.id
        }))),
      'Falha ao salvar itens do pedido.'
    );
  }

  const savedOrder = await getOrderById(tenant.id, row.id);
  await syncOrderFinancialTransaction(tenant.id, savedOrder);
  return mapOrder(savedOrder);
}

async function getOrderById(tenantId, orderId) {
  return maybeSingle(
    await supabaseAdmin
      .from('orders')
      .select(`
        *,
        customers!orders_customer_id_fkey ( * ),
        payment_methods!orders_payment_method_id_fkey ( * ),
        delivery_drivers!orders_delivery_driver_id_fkey ( * ),
        order_items!order_items_order_id_fkey ( * )
      `)
      .eq('tenant_id', tenantId)
      .eq('id', orderId)
      .maybeSingle(),
    'Falha ao carregar pedido.'
  );
}

export async function deleteOrderById(tenantSlug, orderId) {
  const tenant = await getTenantRowBySlug(tenantSlug);

  await deleteTransactionBySource(tenant.id, 'order', orderId);

  ensureOk(
    await supabaseAdmin
      .from('orders')
      .delete()
      .eq('tenant_id', tenant.id)
      .eq('id', orderId),
    'Falha ao remover pedido.'
  );

  return true;
}
