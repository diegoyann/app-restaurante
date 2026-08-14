import { ensureOk, getTenantRowBySlug, maybeSingle, normalizeMoney, supabaseAdmin } from '../shared/db.js';
import { supplierDeletionMode } from './supplierDeletionPolicy.js';
import { purchaseObligationAmounts, purchaseOrderCanBeEdited } from './purchaseOrderFinanceModel.js';

const number = (value) => Number(value || 0);
const money = (value) => normalizeMoney(Number(value || 0));
const monthOf = (value) => String(value || '').slice(0, 7);
const today = () => new Date().toISOString().slice(0, 10);

function addMonths(month, offset) {
  const [year, monthNumber] = String(month).split('-').map(Number);
  const date = new Date(year, monthNumber - 1 + offset, 1, 12);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function addDays(dateValue, days) {
  const date = new Date(`${dateValue}T12:00:00`);
  date.setDate(date.getDate() + Number(days || 0));
  return date.toISOString().slice(0, 10);
}

function dueDateFor(receivedAt, termType, termDays) {
  if (termType === 'ON_RECEIPT') return receivedAt;
  return addDays(receivedAt, termDays);
}

async function synchronizePurchaseOrderObligation(tenant, orderId) {
  const order = ensureOk(await supabaseAdmin.from('purchase_orders').select('*,suppliers(*),purchase_order_items(*),purchase_receipts(*,purchase_receipt_items(*))').eq('tenant_id', tenant.id).eq('id', orderId).single(), 'Falha ao sincronizar pedido com Contas a Pagar.');
  const activeReceipts = (order.purchase_receipts || []).filter((receipt) => receipt.status === 'ACTIVE');
  let obligation = maybeSingle(await supabaseAdmin.from('financial_obligations').select('*').eq('tenant_id', tenant.id).eq('purchase_order_id', order.id).maybeSingle(), 'Falha ao localizar obrigação do pedido.');

  if (!obligation) {
    obligation = maybeSingle(await supabaseAdmin.from('financial_obligations').select('*').eq('tenant_id', tenant.id).eq('source_type', 'PURCHASE_ORDER').eq('source_id', order.id).maybeSingle(), 'Falha ao localizar previsão do pedido.');
  }

  if (!obligation) {
    const legacyIds = [...new Set(activeReceipts.map((receipt) => receipt.financial_obligation_id).filter(Boolean))];
    if (legacyIds.length) {
      const legacyObligations = ensureOk(await supabaseAdmin.from('financial_obligations').select('*').eq('tenant_id', tenant.id).in('id', legacyIds), 'Falha ao reconciliar obrigações antigas do recebimento.');
      obligation = legacyObligations.sort((a, b) => Number(b.paid_amount || 0) - Number(a.paid_amount || 0))[0] || null;
      const duplicates = legacyObligations.filter((item) => item.id !== obligation?.id);
      if (duplicates.some((item) => Number(item.paid_amount || 0) > 0)) throw new Error('Há mais de uma obrigação paga vinculada ao pedido. Reconcile os pagamentos antes de continuar.');
      if (duplicates.length) {
        ensureOk(await supabaseAdmin.from('financial_obligations').update({ status: 'CANCELLED', final_amount: 0, note: `Duplicidade antiga consolidada no pedido ${order.id}.` }).eq('tenant_id', tenant.id).in('id', duplicates.map((item) => item.id)), 'Falha ao inativar obrigações antigas duplicadas.');
      }
    }
  }

  if (order.status === 'DRAFT') return obligation;
  if (order.status === 'CANCELLED') {
    if (!obligation) return null;
    if (Number(obligation.paid_amount || 0) > 0) throw new Error('O pedido possui pagamento registrado e não pode ter sua obrigação cancelada automaticamente.');
    return ensureOk(await supabaseAdmin.from('financial_obligations').update({ status: 'CANCELLED', final_amount: 0, note: `CANCELADO COM O PEDIDO: ${order.cancellation_reason || 'sem motivo informado'}` }).eq('tenant_id', tenant.id).eq('id', obligation.id).select('*').single(), 'Falha ao cancelar obrigação prevista.');
  }

  const amounts = purchaseObligationAmounts({ orderStatus: order.status, items: order.purchase_order_items, receipts: activeReceipts });
  const expectedReceiptDate = addDays(order.order_date, Number(order.suppliers?.delivery_lead_days || 0));
  const referenceDate = activeReceipts[0]?.received_at || expectedReceiptDate;
  const dueDate = dueDateFor(referenceDate, order.payment_term_type, order.payment_term_days);
  const status = Number(obligation?.paid_amount || 0) > 0
    ? Number(obligation.paid_amount || 0) >= amounts.currentAmount ? 'PAID' : 'PARTIAL'
    : dueDate < today() ? 'OVERDUE' : 'EXPECTED';
  if (Number(obligation?.paid_amount || 0) > amounts.currentAmount) throw new Error('O valor atualizado do pedido não pode ficar abaixo do total já pago.');
  const values = {
    tenant_id: tenant.id,
    purchase_order_id: order.id,
    purchase_receipt_id: activeReceipts.at(-1)?.id || null,
    description: `${order.suppliers?.name || 'Fornecedor'} — Pedido ${order.order_date}`,
    economic_category: 'INSUMO',
    source_type: 'PURCHASE_ORDER',
    source_id: order.id,
    competence_month: monthOf(referenceDate),
    forecast_type: 'ESTIMATED',
    forecast_amount: amounts.forecastAmount,
    final_amount: amounts.finalAmount,
    due_date: dueDate,
    status,
    paid_amount: Number(obligation?.paid_amount || 0),
    suggested_payment_method: order.default_payment_method,
    suggested_financial_origin: order.default_financial_origin,
    note: `Fornecedor: ${order.suppliers?.name || ''}. Pedido ${order.id}. Recebido até agora: ${amounts.receivedAmount.toFixed(2)}.`
  };
  const synchronized = ensureOk(await (obligation
    ? supabaseAdmin.from('financial_obligations').update(values).eq('tenant_id', tenant.id).eq('id', obligation.id)
    : supabaseAdmin.from('financial_obligations').insert(values)).select('*').single(), 'Falha ao criar ou atualizar a Conta a Pagar do pedido.');
  if (activeReceipts.length) {
    ensureOk(await supabaseAdmin.from('purchase_receipts').update({ financial_obligation_id: synchronized.id }).eq('tenant_id', tenant.id).in('id', activeReceipts.map((receipt) => receipt.id)), 'Falha ao preservar o vínculo financeiro dos recebimentos.');
  }
  return synchronized;
}

async function audit(tenantId, actorId, entityType, entityId, action, previousValue, newValue, observation = '') {
  ensureOk(await supabaseAdmin.from('operation_audit_events').insert({
    tenant_id: tenantId,
    entity_type: entityType,
    entity_id: String(entityId),
    action,
    previous_value: previousValue ?? null,
    new_value: newValue ?? null,
    observation: String(observation || '').trim(),
    created_by: actorId || null
  }), 'Falha ao registrar auditoria.');
}

function mapSupplier(row, links = []) {
  return {
    id: row.id, name: row.name, document: row.document || '', phone: row.phone || '', whatsapp: row.whatsapp || '',
    email: row.email || '', notes: row.notes || '', orderWeekday: row.order_weekday,
    deliveryLeadDays: number(row.delivery_lead_days), paymentTermType: row.payment_term_type,
    paymentTermDays: number(row.payment_term_days), defaultPaymentMethod: row.default_payment_method,
    defaultFinancialOrigin: row.default_financial_origin, active: row.active !== false,
    ingredientLinks: links.map((link) => ({ id: link.id, ingredientId: link.ingredient_id, supplierSku: link.supplier_sku || '', defaultUnit: link.default_unit || '', lastPrice: link.last_price == null ? null : number(link.last_price), active: link.active !== false }))
  };
}

function mapOrder(row) {
  return {
    id: row.id, supplierId: row.supplier_id, orderDate: row.order_date, status: row.status, notes: row.notes || '',
    paymentTermType: row.payment_term_type, paymentTermDays: number(row.payment_term_days),
    defaultPaymentMethod: row.default_payment_method, defaultFinancialOrigin: row.default_financial_origin,
    cancellationReason: row.cancellation_reason || '', createdAt: row.created_at,
    items: (row.purchase_order_items || []).map((item) => ({
      id: item.id, ingredientId: item.ingredient_id, orderedQuantity: number(item.ordered_quantity), unit: item.unit,
      estimatedUnitPrice: item.estimated_unit_price == null ? null : number(item.estimated_unit_price), observation: item.observation || ''
    })),
    receipts: (row.purchase_receipts || []).map((receipt) => ({
      id: receipt.id, receivedAt: receipt.received_at, status: receipt.status, totalAmount: number(receipt.total_amount),
      financialObligationId: receipt.financial_obligation_id || '', observation: receipt.observation || '', reversalReason: receipt.reversal_reason || '',
      items: (receipt.purchase_receipt_items || []).map((item) => ({
        id: item.id, purchaseOrderItemId: item.purchase_order_item_id, ingredientId: item.ingredient_id,
        receivedQuantity: number(item.received_quantity), unit: item.unit, actualUnitPrice: number(item.actual_unit_price),
        totalAmount: number(item.total_amount), observation: item.observation || ''
      }))
    }))
  };
}

function mapInventoryCount(row) {
  return {
    id: row.id, competenceMonth: row.competence_month, countType: row.count_type, countDate: row.count_date,
    status: row.status, totalValue: number(row.total_value), sourceInventoryCountId: row.source_inventory_count_id || '',
    observation: row.observation || '', items: (row.inventory_count_items || []).map((item) => ({
      id: item.id, ingredientId: item.ingredient_id, quantity: number(item.quantity), unit: item.unit,
      unitCost: number(item.unit_cost), totalValue: number(item.total_value), observation: item.observation || ''
    }))
  };
}

async function loadOrders(tenantId) {
  return ensureOk(await supabaseAdmin.from('purchase_orders').select(`
    *, purchase_order_items(*), purchase_receipts(*,purchase_receipt_items(*))
  `).eq('tenant_id', tenantId).order('order_date', { ascending: false }), 'Falha ao carregar compras.');
}

async function buildInventoryView(tenantId, ingredients, counts, movements, orders) {
  const activeMovements = movements.filter((movement) => movement.movement_date <= today());
  const stock = ingredients.map((ingredient) => {
    const latestCount = counts.filter((count) => count.status === 'CLOSED' && count.inventory_count_items?.some((item) => item.ingredient_id === ingredient.id))
      .sort((a, b) => String(b.count_date).localeCompare(String(a.count_date)))[0];
    const countItem = latestCount?.inventory_count_items?.find((item) => item.ingredient_id === ingredient.id);
    const afterDate = latestCount?.count_date || '';
    const laterMovements = activeMovements.filter((movement) => movement.ingredient_id === ingredient.id && (
      !afterDate
      || movement.movement_date > afterDate
      || (latestCount?.count_type === 'OPENING' && movement.movement_date === afterDate)
    ));
    const quantity = number(countItem?.quantity) + laterMovements.reduce((sum, movement) => sum + number(movement.quantity), 0);
    const unitCost = number(ingredient.unit_cost || countItem?.unit_cost);
    return { ingredientId: ingredient.id, quantity, unit: ingredient.unit, unitCost, totalValue: money(quantity * unitCost), belowMinimum: ingredient.stock_minimum != null && quantity < number(ingredient.stock_minimum) };
  });
  const receivedOrders = orders.flatMap((order) => order.purchase_receipts || []).filter((receipt) => receipt.status === 'ACTIVE');
  return {
    stock,
    totalValue: money(stock.reduce((sum, item) => sum + item.totalValue, 0)),
    ingredientCount: stock.filter((item) => item.quantity > 0).length,
    belowMinimumCount: stock.filter((item) => item.belowMinimum).length,
    lastInventory: counts.filter((count) => count.status === 'CLOSED').sort((a, b) => String(b.count_date).localeCompare(String(a.count_date)))[0]?.count_date || '',
    receivedPurchaseCount: receivedOrders.length
  };
}

function buildMonthlyInventorySummaries(counts, orders) {
  const months = new Set([
    ...counts.map((count) => count.competence_month),
    ...orders.flatMap((order) => (order.purchase_receipts || []).map((receipt) => monthOf(receipt.received_at)))
  ]);
  return [...months].sort().map((month) => {
    const opening = counts.find((count) => count.competence_month === month && count.count_type === 'OPENING' && count.status === 'CLOSED');
    const closing = counts.find((count) => count.competence_month === month && count.count_type === 'CLOSING' && count.status === 'CLOSED');
    const receipts = orders.flatMap((order) => (order.purchase_receipts || []).filter((receipt) => receipt.status === 'ACTIVE' && monthOf(receipt.received_at) === month));
    const purchasesReceived = money(receipts.reduce((sum, receipt) => sum + number(receipt.total_amount), 0));
    const openingValue = number(opening?.total_value);
    const closingValue = closing ? number(closing.total_value) : null;
    return {
      month, openingValue, purchasesReceived, closingValue,
      realCmv: closingValue == null ? null : money(openingValue + purchasesReceived - closingValue),
      status: closingValue == null ? 'OPEN' : 'CLOSED', receiptCount: receipts.length
    };
  });
}

export async function getSupplyChainData(tenantSlug) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const [suppliers, links, ingredients, orderRows, countRows, movements, prices, auditEvents] = await Promise.all([
    ensureOk(await supabaseAdmin.from('suppliers').select('*').eq('tenant_id', tenant.id).order('name'), 'Falha ao carregar fornecedores.'),
    ensureOk(await supabaseAdmin.from('supplier_ingredients').select('*').eq('tenant_id', tenant.id), 'Falha ao carregar vínculos de fornecedores.'),
    ensureOk(await supabaseAdmin.from('ingredients').select('*').eq('tenant_id', tenant.id).order('name'), 'Falha ao carregar insumos.'),
    loadOrders(tenant.id),
    ensureOk(await supabaseAdmin.from('inventory_counts').select('*,inventory_count_items(*)').eq('tenant_id', tenant.id).order('count_date', { ascending: false }), 'Falha ao carregar inventários.'),
    ensureOk(await supabaseAdmin.from('inventory_movements').select('*').eq('tenant_id', tenant.id).order('movement_date'), 'Falha ao carregar movimentos de estoque.'),
    ensureOk(await supabaseAdmin.from('ingredient_price_history').select('*').eq('tenant_id', tenant.id).order('price_date', { ascending: false }), 'Falha ao carregar histórico de preços.'),
    ensureOk(await supabaseAdmin.from('operation_audit_events').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: false }).limit(300), 'Falha ao carregar auditoria.')
  ]);
  const orders = orderRows.map(mapOrder);
  const counts = countRows.map(mapInventoryCount);
  return {
    suppliers: suppliers.map((supplier) => mapSupplier(supplier, links.filter((link) => link.supplier_id === supplier.id))),
    orders, inventoryCounts: counts,
    inventory: await buildInventoryView(tenant.id, ingredients, countRows, movements, orderRows),
    monthlyInventorySummaries: buildMonthlyInventorySummaries(countRows, orderRows),
    priceHistory: prices.map((row) => ({ id: row.id, ingredientId: row.ingredient_id, supplierId: row.supplier_id, receiptItemId: row.purchase_receipt_item_id, priceDate: row.price_date, unit: row.unit, unitPrice: number(row.unit_price) })),
    auditEvents: auditEvents.map((row) => ({ id: row.id, entityType: row.entity_type, entityId: row.entity_id, action: row.action, previousValue: row.previous_value, newValue: row.new_value, observation: row.observation || '', createdBy: row.created_by || '', createdAt: row.created_at }))
  };
}

export async function saveSupplier(tenantSlug, payload, actorId) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const name = String(payload.name || '').trim();
  if (!name) throw new Error('Nome do fornecedor é obrigatório.');
  const previous = payload.id ? maybeSingle(await supabaseAdmin.from('suppliers').select('*').eq('tenant_id', tenant.id).eq('id', payload.id).maybeSingle(), 'Falha ao carregar fornecedor.') : null;
  const values = {
    tenant_id: tenant.id, name, document: String(payload.document || '').trim(), phone: String(payload.phone || '').trim(),
    whatsapp: String(payload.whatsapp || '').trim(), email: String(payload.email || '').trim(), notes: String(payload.notes || '').trim(),
    order_weekday: payload.orderWeekday === '' || payload.orderWeekday == null ? null : Number(payload.orderWeekday),
    delivery_lead_days: Math.max(Number(payload.deliveryLeadDays) || 0, 0),
    payment_term_type: ['ON_RECEIPT', 'DAYS_AFTER_RECEIPT', 'FIXED_DATE'].includes(payload.paymentTermType) ? payload.paymentTermType : 'DAYS_AFTER_RECEIPT',
    payment_term_days: Math.max(Number(payload.paymentTermDays) || 0, 0),
    default_payment_method: ['PIX', 'TRANSFER', 'BOLETO', 'CARD', 'CASH', 'OTHER'].includes(payload.defaultPaymentMethod) ? payload.defaultPaymentMethod : 'BOLETO',
    default_financial_origin: payload.defaultFinancialOrigin === 'CASH' ? 'CASH' : 'BANK', active: payload.active !== false
  };
  const row = ensureOk(await (payload.id ? supabaseAdmin.from('suppliers').update(values).eq('tenant_id', tenant.id).eq('id', payload.id) : supabaseAdmin.from('suppliers').insert(values)).select('*').single(), 'Já existe um fornecedor com este nome.');
  const ingredientIds = [...new Set((payload.ingredientIds || []).map(String).filter(Boolean))];
  const existingLinks = ensureOk(await supabaseAdmin.from('supplier_ingredients').select('*').eq('tenant_id', tenant.id).eq('supplier_id', row.id), 'Falha ao carregar vínculos atuais.');
  for (const link of existingLinks) {
    if (!ingredientIds.includes(String(link.ingredient_id)) && link.active) ensureOk(await supabaseAdmin.from('supplier_ingredients').update({ active: false }).eq('id', link.id), 'Falha ao desativar vínculo.');
  }
  for (const ingredientId of ingredientIds) {
    const ingredient = maybeSingle(await supabaseAdmin.from('ingredients').select('id,unit').eq('tenant_id', tenant.id).eq('id', ingredientId).maybeSingle(), 'Falha ao validar insumo.');
    if (!ingredient) throw new Error('Um dos insumos selecionados não pertence a esta filial.');
    ensureOk(await supabaseAdmin.from('supplier_ingredients').upsert({ tenant_id: tenant.id, supplier_id: row.id, ingredient_id: ingredient.id, default_unit: ingredient.unit, active: true }, { onConflict: 'tenant_id,supplier_id,ingredient_id' }), 'Falha ao vincular insumo ao fornecedor.');
  }
  await audit(tenant.id, actorId, 'SUPPLIER', row.id, previous ? 'UPDATED' : 'CREATED', previous, row, payload.auditObservation);
  const links = ensureOk(await supabaseAdmin.from('supplier_ingredients').select('*').eq('tenant_id', tenant.id).eq('supplier_id', row.id), 'Falha ao recarregar vínculos.');
  return mapSupplier(row, links);
}

export async function deleteSupplier(tenantSlug, supplierId, actorId) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  if (!supplierId) throw new Error('Informe o fornecedor que será excluído.');

  const supplier = maybeSingle(await supabaseAdmin.from('suppliers').select('*').eq('tenant_id', tenant.id).eq('id', supplierId).maybeSingle(), 'Falha ao carregar fornecedor.');
  if (!supplier) throw new Error('Fornecedor não encontrado nesta filial. Atualize a página e tente novamente.');

  const [ordersResult, priceHistoryResult] = await Promise.all([
    supabaseAdmin.from('purchase_orders').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id).eq('supplier_id', supplierId),
    supabaseAdmin.from('ingredient_price_history').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id).eq('supplier_id', supplierId)
  ]);
  if (ordersResult.error) throw new Error(ordersResult.error.message || 'Falha ao validar pedidos do fornecedor.');
  if (priceHistoryResult.error) throw new Error(priceHistoryResult.error.message || 'Falha ao validar histórico de preços do fornecedor.');
  const deletionMode = supplierDeletionMode({ orderCount: ordersResult.count, priceHistoryCount: priceHistoryResult.count });

  if (deletionMode === 'ARCHIVE') {
    const archived = ensureOk(
      await supabaseAdmin
        .from('suppliers')
        .update({ active: false })
        .eq('tenant_id', tenant.id)
        .eq('id', supplierId)
        .select('*')
        .single(),
      'Falha ao arquivar fornecedor.'
    );
    ensureOk(
      await supabaseAdmin
        .from('supplier_ingredients')
        .update({ active: false })
        .eq('tenant_id', tenant.id)
        .eq('supplier_id', supplierId),
      'Falha ao desativar vínculos do fornecedor.'
    );
    await audit(tenant.id, actorId, 'SUPPLIER', supplierId, 'ARCHIVED', supplier, archived, 'Fornecedor removido da operação; histórico de compras preservado.');
    return { id: supplierId, archived: true, active: false };
  }

  ensureOk(await supabaseAdmin.from('supplier_ingredients').delete().eq('tenant_id', tenant.id).eq('supplier_id', supplierId), 'Falha ao remover vínculos do fornecedor.');
  const deleted = ensureOk(await supabaseAdmin.from('suppliers').delete().eq('tenant_id', tenant.id).eq('id', supplierId).select('id').single(), 'Falha ao excluir fornecedor.');
  await audit(tenant.id, actorId, 'SUPPLIER', supplierId, 'DELETED', supplier, null, 'Exclusão manual de fornecedor sem histórico de compras.');
  return { ...deleted, archived: false };
}

export async function savePurchaseOrder(tenantSlug, payload, actorId) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const supplier = maybeSingle(await supabaseAdmin.from('suppliers').select('*').eq('tenant_id', tenant.id).eq('id', payload.supplierId).eq('active', true).maybeSingle(), 'Falha ao validar fornecedor.');
  if (!supplier) throw new Error('Fornecedor ativo é obrigatório.');
  const items = Array.isArray(payload.items) ? payload.items : [];
  if (!items.length) throw new Error('Adicione ao menos um insumo à compra.');
  const duplicateIngredient = items.find((item, index) => items.findIndex((other) => String(other.ingredientId) === String(item.ingredientId)) !== index);
  if (duplicateIngredient) throw new Error('O mesmo insumo não pode aparecer duas vezes no pedido.');
  const previous = payload.id ? maybeSingle(await supabaseAdmin.from('purchase_orders').select('*,purchase_order_items(*),purchase_receipts(id,status)').eq('tenant_id', tenant.id).eq('id', payload.id).maybeSingle(), 'Falha ao carregar pedido.') : null;
  if (previous && !purchaseOrderCanBeEdited(previous)) throw new Error('Pedido com recebimento ou encerrado não pode ser editado. Use o fluxo de recebimento ou estorno para preservar o histórico.');
  const values = {
    tenant_id: tenant.id, supplier_id: supplier.id, order_date: payload.orderDate || today(),
    status: previous?.status || (['DRAFT', 'ORDERED', 'AWAITING_DELIVERY'].includes(payload.status) ? payload.status : 'DRAFT'), notes: String(payload.notes || '').trim(),
    payment_term_type: payload.paymentTermType || supplier.payment_term_type, payment_term_days: Number(payload.paymentTermDays ?? supplier.payment_term_days) || 0,
    default_payment_method: payload.defaultPaymentMethod || supplier.default_payment_method,
    default_financial_origin: payload.defaultFinancialOrigin || supplier.default_financial_origin, created_by: previous?.created_by || actorId || null
  };
  const linkedIds = ensureOk(await supabaseAdmin.from('supplier_ingredients').select('ingredient_id').eq('tenant_id', tenant.id).eq('supplier_id', supplier.id).eq('active', true), 'Falha ao validar itens do fornecedor.');
  const allowed = new Set(linkedIds.map((link) => String(link.ingredient_id)));
  const ingredientRows = ensureOk(await supabaseAdmin.from('ingredients').select('id,unit').eq('tenant_id', tenant.id).in('id', items.map((item) => item.ingredientId)), 'Falha ao carregar insumos.');
  const validatedItems = items.map((item) => {
    if (!allowed.has(String(item.ingredientId))) throw new Error('O pedido contém insumo não vinculado ao fornecedor.');
    const ingredient = ingredientRows.find((row) => String(row.id) === String(item.ingredientId));
    const quantity = number(item.orderedQuantity);
    if (!ingredient || quantity <= 0) throw new Error('Quantidade e insumo do pedido são obrigatórios.');
    const estimatedUnitPrice = item.estimatedUnitPrice === '' || item.estimatedUnitPrice == null ? null : number(item.estimatedUnitPrice);
    if (estimatedUnitPrice != null && estimatedUnitPrice < 0) throw new Error('Preço unitário previsto não pode ser negativo.');
    return { ingredient_id: ingredient.id, ordered_quantity: quantity, unit: ingredient.unit, estimated_unit_price: estimatedUnitPrice, observation: String(item.observation || '').trim() };
  });
  const order = ensureOk(await (payload.id ? supabaseAdmin.from('purchase_orders').update(values).eq('tenant_id', tenant.id).eq('id', payload.id) : supabaseAdmin.from('purchase_orders').insert(values)).select('*').single(), 'Falha ao salvar pedido.');
  if (payload.id) ensureOk(await supabaseAdmin.from('purchase_order_items').delete().eq('tenant_id', tenant.id).eq('purchase_order_id', order.id), 'Falha ao atualizar itens do pedido.');
  const rows = validatedItems.map((item) => ({ ...item, tenant_id: tenant.id, purchase_order_id: order.id }));
  ensureOk(await supabaseAdmin.from('purchase_order_items').insert(rows), 'Falha ao salvar itens do pedido.');
  if (order.status !== 'DRAFT') await synchronizePurchaseOrderObligation(tenant, order.id);
  await audit(tenant.id, actorId, 'PURCHASE_ORDER', order.id, previous ? 'UPDATED' : 'CREATED', previous, { ...order, items: rows }, payload.auditObservation);
  return mapOrder(ensureOk(await supabaseAdmin.from('purchase_orders').select('*,purchase_order_items(*),purchase_receipts(*,purchase_receipt_items(*))').eq('id', order.id).single(), 'Falha ao recarregar pedido.'));
}

async function recalculateOrderStatus(tenantId, orderId) {
  const order = ensureOk(await supabaseAdmin.from('purchase_orders').select('*,purchase_order_items(*),purchase_receipts(*,purchase_receipt_items(*))').eq('tenant_id', tenantId).eq('id', orderId).single(), 'Falha ao recalcular pedido.');
  if (order.status === 'CANCELLED') return order;
  const activeReceiptItems = (order.purchase_receipts || []).filter((receipt) => receipt.status === 'ACTIVE').flatMap((receipt) => receipt.purchase_receipt_items || []);
  const allReceived = (order.purchase_order_items || []).every((item) => activeReceiptItems.filter((received) => received.purchase_order_item_id === item.id).reduce((sum, received) => sum + number(received.received_quantity), 0) >= number(item.ordered_quantity));
  const anyReceived = activeReceiptItems.length > 0;
  const status = allReceived ? 'RECEIVED' : anyReceived ? 'PARTIALLY_RECEIVED' : 'AWAITING_DELIVERY';
  ensureOk(await supabaseAdmin.from('purchase_orders').update({ status }).eq('tenant_id', tenantId).eq('id', orderId), 'Falha ao atualizar status do pedido.');
  return { ...order, status };
}

export async function receivePurchaseOrder(tenantSlug, payload, actorId) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const order = maybeSingle(await supabaseAdmin.from('purchase_orders').select('*,suppliers(*),purchase_order_items(*),purchase_receipts(*,purchase_receipt_items(*))').eq('tenant_id', tenant.id).eq('id', payload.purchaseOrderId).maybeSingle(), 'Falha ao carregar pedido.');
  if (!order || ['DRAFT', 'CANCELLED', 'RECEIVED'].includes(order.status)) throw new Error('Pedido não está disponível para recebimento.');
  const receivedAt = payload.receivedAt || today();
  const closedInventory = maybeSingle(await supabaseAdmin.from('inventory_counts').select('id').eq('tenant_id', tenant.id).eq('competence_month', monthOf(receivedAt)).eq('count_type', 'CLOSING').eq('status', 'CLOSED').maybeSingle(), 'Falha ao verificar fechamento de estoque.');
  if (closedInventory) throw new Error('O estoque desta competência está fechado. Reabra o inventário antes de receber a compra.');
  const activeReceiptItems = (order.purchase_receipts || []).filter((receipt) => receipt.status === 'ACTIVE').flatMap((receipt) => receipt.purchase_receipt_items || []);
  const requestedItems = Array.isArray(payload.items) ? payload.items.filter((item) => number(item.receivedQuantity) > 0) : [];
  if (!requestedItems.length) throw new Error('Informe ao menos uma quantidade recebida.');
  const receiptRows = requestedItems.map((item) => {
    const orderItem = order.purchase_order_items.find((row) => String(row.id) === String(item.purchaseOrderItemId));
    if (!orderItem) throw new Error('Item recebido não pertence ao pedido.');
    const already = activeReceiptItems.filter((row) => row.purchase_order_item_id === orderItem.id).reduce((sum, row) => sum + number(row.received_quantity), 0);
    const quantity = number(item.receivedQuantity);
    if (quantity > number(orderItem.ordered_quantity) - already + 0.0001) throw new Error('Quantidade recebida supera o saldo pedido.');
    const unitPrice = number(item.actualUnitPrice);
    if (unitPrice < 0) throw new Error('Preço real inválido.');
    return { orderItem, quantity, unitPrice, total: money(quantity * unitPrice), observation: String(item.observation || '').trim() };
  });
  const total = money(receiptRows.reduce((sum, row) => sum + row.total, 0));
  let receipt;
  try {
    receipt = ensureOk(await supabaseAdmin.from('purchase_receipts').insert({ tenant_id: tenant.id, purchase_order_id: order.id, received_at: receivedAt, total_amount: total, observation: String(payload.observation || '').trim(), received_by: actorId || null }).select('*').single(), 'Falha ao registrar recebimento.');
    const insertedItems = ensureOk(await supabaseAdmin.from('purchase_receipt_items').insert(receiptRows.map((row) => ({ tenant_id: tenant.id, purchase_receipt_id: receipt.id, purchase_order_item_id: row.orderItem.id, ingredient_id: row.orderItem.ingredient_id, received_quantity: row.quantity, unit: row.orderItem.unit, actual_unit_price: row.unitPrice, total_amount: row.total, observation: row.observation }))).select('*'), 'Falha ao registrar itens recebidos.');
    for (const item of insertedItems) {
      ensureOk(await supabaseAdmin.from('inventory_movements').insert({ tenant_id: tenant.id, ingredient_id: item.ingredient_id, movement_date: receivedAt, movement_type: 'RECEIPT', quantity: item.received_quantity, unit_cost: item.actual_unit_price, total_value: item.total_amount, source_type: 'PURCHASE_RECEIPT_ITEM', source_id: item.id, observation: receipt.observation, created_by: actorId || null }), 'Falha ao atualizar estoque.');
      ensureOk(await supabaseAdmin.from('ingredient_price_history').insert({ tenant_id: tenant.id, ingredient_id: item.ingredient_id, supplier_id: order.supplier_id, purchase_receipt_item_id: item.id, price_date: receivedAt, unit: item.unit, unit_price: item.actual_unit_price }), 'Falha ao salvar histórico de preço.');
      ensureOk(await supabaseAdmin.from('ingredients').update({ unit_cost: item.actual_unit_price }).eq('tenant_id', tenant.id).eq('id', item.ingredient_id), 'Falha ao atualizar custo atual do insumo.');
      ensureOk(await supabaseAdmin.from('supplier_ingredients').update({ last_price: item.actual_unit_price }).eq('tenant_id', tenant.id).eq('supplier_id', order.supplier_id).eq('ingredient_id', item.ingredient_id), 'Falha ao atualizar último preço do fornecedor.');
    }
    await recalculateOrderStatus(tenant.id, order.id);
    const obligation = await synchronizePurchaseOrderObligation(tenant, order.id);
    receipt = ensureOk(await supabaseAdmin.from('purchase_receipts').update({ financial_obligation_id: obligation.id }).eq('id', receipt.id).select('*').single(), 'Falha ao vincular Conta a Pagar existente.');
    await audit(tenant.id, actorId, 'PURCHASE_RECEIPT', receipt.id, 'RECEIVED', null, { ...receipt, items: insertedItems, obligationId: obligation.id }, payload.auditObservation);
    return { receiptId: receipt.id, obligationId: obligation.id, order: mapOrder(ensureOk(await supabaseAdmin.from('purchase_orders').select('*,purchase_order_items(*),purchase_receipts(*,purchase_receipt_items(*))').eq('id', order.id).single(), 'Falha ao recarregar pedido.')) };
  } catch (error) {
    if (receipt?.id) {
      await supabaseAdmin.from('purchase_receipts').update({ financial_obligation_id: null }).eq('id', receipt.id);
      await supabaseAdmin.from('inventory_movements').delete().eq('tenant_id', tenant.id).eq('source_type', 'PURCHASE_RECEIPT_ITEM').in('source_id', (await supabaseAdmin.from('purchase_receipt_items').select('id').eq('purchase_receipt_id', receipt.id)).data?.map((item) => item.id) || []);
      await supabaseAdmin.from('ingredient_price_history').delete().eq('tenant_id', tenant.id).in('purchase_receipt_item_id', (await supabaseAdmin.from('purchase_receipt_items').select('id').eq('purchase_receipt_id', receipt.id)).data?.map((item) => item.id) || []);
      await supabaseAdmin.from('purchase_receipt_items').delete().eq('purchase_receipt_id', receipt.id);
      await supabaseAdmin.from('purchase_receipts').delete().eq('id', receipt.id);
    }
    throw error;
  }
}

export async function changePurchaseOrderStatus(tenantSlug, payload, actorId) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const order = maybeSingle(await supabaseAdmin.from('purchase_orders').select('*,purchase_receipts(id,status)').eq('tenant_id', tenant.id).eq('id', payload.id).maybeSingle(), 'Falha ao carregar pedido.');
  if (!order) throw new Error('Pedido não encontrado.');
  if (payload.action === 'CANCEL') {
    if ((order.purchase_receipts || []).some((receipt) => receipt.status === 'ACTIVE')) throw new Error('Estorne os recebimentos antes de cancelar o pedido.');
    const reason = String(payload.reason || '').trim();
    if (!reason) throw new Error('Informe o motivo do cancelamento.');
    let linkedObligation = maybeSingle(await supabaseAdmin.from('financial_obligations').select('id,paid_amount').eq('tenant_id', tenant.id).eq('purchase_order_id', order.id).maybeSingle(), 'Falha ao verificar pagamentos do pedido.');
    if (!linkedObligation) linkedObligation = maybeSingle(await supabaseAdmin.from('financial_obligations').select('id,paid_amount').eq('tenant_id', tenant.id).eq('source_type', 'PURCHASE_ORDER').eq('source_id', order.id).maybeSingle(), 'Falha ao verificar previsão financeira do pedido.');
    if (Number(linkedObligation?.paid_amount || 0) > 0) throw new Error('O pedido possui pagamento registrado. Estorne o pagamento antes de cancelar o pedido.');
    const updated = ensureOk(await supabaseAdmin.from('purchase_orders').update({ status: 'CANCELLED', cancelled_at: new Date().toISOString(), cancellation_reason: reason }).eq('id', order.id).select('*').single(), 'Falha ao cancelar pedido.');
    try {
      await synchronizePurchaseOrderObligation(tenant, order.id);
    } catch (error) {
      await supabaseAdmin.from('purchase_orders').update({ status: order.status, cancelled_at: order.cancelled_at, cancellation_reason: order.cancellation_reason }).eq('tenant_id', tenant.id).eq('id', order.id);
      throw error;
    }
    await audit(tenant.id, actorId, 'PURCHASE_ORDER', order.id, 'CANCELLED', order, updated, reason);
  } else {
    const status = payload.status === 'ORDERED' ? 'ORDERED' : 'AWAITING_DELIVERY';
    if (!['DRAFT', 'ORDERED', 'AWAITING_DELIVERY'].includes(order.status)) throw new Error('Status deste pedido não pode ser alterado manualmente.');
    const updated = ensureOk(await supabaseAdmin.from('purchase_orders').update({ status }).eq('id', order.id).select('*').single(), 'Falha ao atualizar status.');
    try {
      await synchronizePurchaseOrderObligation(tenant, order.id);
    } catch (error) {
      await supabaseAdmin.from('purchase_orders').update({ status: order.status }).eq('tenant_id', tenant.id).eq('id', order.id);
      throw error;
    }
    await audit(tenant.id, actorId, 'PURCHASE_ORDER', order.id, 'STATUS_CHANGED', order, updated, payload.reason);
  }
  return mapOrder(ensureOk(await supabaseAdmin.from('purchase_orders').select('*,purchase_order_items(*),purchase_receipts(*,purchase_receipt_items(*))').eq('id', order.id).single(), 'Falha ao recarregar pedido.'));
}

export async function reversePurchaseReceipt(tenantSlug, payload, actorId) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const receipt = maybeSingle(await supabaseAdmin.from('purchase_receipts').select('*,purchase_receipt_items(*)').eq('tenant_id', tenant.id).eq('id', payload.id).maybeSingle(), 'Falha ao carregar recebimento.');
  if (!receipt || receipt.status !== 'ACTIVE') throw new Error('Recebimento ativo não encontrado.');
  const reason = String(payload.reason || '').trim();
  if (!reason) throw new Error('Informe o motivo do estorno.');
  const payments = receipt.financial_obligation_id ? ensureOk(await supabaseAdmin.from('financial_payments').select('id').eq('tenant_id', tenant.id).eq('obligation_id', receipt.financial_obligation_id), 'Falha ao verificar pagamentos.') : [];
  if (payments.length) throw new Error('Este recebimento possui pagamentos. Estorne os pagamentos antes do recebimento.');
  for (const item of receipt.purchase_receipt_items || []) {
    ensureOk(await supabaseAdmin.from('inventory_movements').insert({ tenant_id: tenant.id, ingredient_id: item.ingredient_id, movement_date: payload.reversalDate || today(), movement_type: 'RECEIPT_REVERSAL', quantity: -number(item.received_quantity), unit_cost: item.actual_unit_price, total_value: -number(item.total_amount), source_type: 'PURCHASE_RECEIPT_REVERSAL', source_id: receipt.id, observation: reason, created_by: actorId || null }), 'Falha ao estornar estoque.');
  }
  const updated = ensureOk(await supabaseAdmin.from('purchase_receipts').update({ status: 'REVERSED', reversed_at: new Date().toISOString(), reversed_by: actorId || null, reversal_reason: reason }).eq('id', receipt.id).select('*').single(), 'Falha ao estornar recebimento.');
  await recalculateOrderStatus(tenant.id, receipt.purchase_order_id);
  await synchronizePurchaseOrderObligation(tenant, receipt.purchase_order_id);
  await audit(tenant.id, actorId, 'PURCHASE_RECEIPT', receipt.id, 'REVERSED', receipt, updated, reason);
  return { id: receipt.id, status: 'REVERSED' };
}

export async function saveInventoryCount(tenantSlug, payload, actorId) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  if (!/^\d{4}-\d{2}$/.test(String(payload.competenceMonth || ''))) throw new Error('Competência inválida.');
  if (!['OPENING', 'CLOSING'].includes(payload.countType)) throw new Error('Tipo de inventário inválido.');
  const previous = maybeSingle(await supabaseAdmin.from('inventory_counts').select('*,inventory_count_items(*)').eq('tenant_id', tenant.id).eq('competence_month', payload.competenceMonth).eq('count_type', payload.countType).maybeSingle(), 'Falha ao carregar inventário.');
  if (previous && previous.status === 'CLOSED') throw new Error('Inventário fechado. Reabra antes de editar.');
  const items = Array.isArray(payload.items) ? payload.items : [];
  if (!items.length) throw new Error('Informe os itens do inventário.');
  const ingredientRows = ensureOk(await supabaseAdmin.from('ingredients').select('id,unit,unit_cost').eq('tenant_id', tenant.id).eq('active', true), 'Falha ao carregar insumos.');
  const itemRows = items.map((item) => {
    const ingredient = ingredientRows.find((row) => String(row.id) === String(item.ingredientId));
    if (!ingredient) throw new Error('Inventário contém insumo inválido.');
    const quantity = Math.max(number(item.quantity), 0);
    const unitCost = Math.max(number(item.unitCost ?? ingredient.unit_cost), 0);
    return { tenant_id: tenant.id, ingredient_id: ingredient.id, quantity, unit: ingredient.unit, unit_cost: unitCost, total_value: money(quantity * unitCost), observation: String(item.observation || '').trim() };
  });
  const totalValue = money(itemRows.reduce((sum, item) => sum + item.total_value, 0));
  const count = ensureOk(await supabaseAdmin.from('inventory_counts').upsert({ id: previous?.id || undefined, tenant_id: tenant.id, competence_month: payload.competenceMonth, count_type: payload.countType, count_date: payload.countDate || (payload.countType === 'OPENING' ? `${payload.competenceMonth}-01` : today()), status: 'DRAFT', total_value: totalValue, observation: String(payload.observation || '').trim(), created_by: previous?.created_by || actorId || null }, { onConflict: 'tenant_id,competence_month,count_type' }).select('*').single(), 'Falha ao salvar inventário.');
  if (previous) ensureOk(await supabaseAdmin.from('inventory_count_items').delete().eq('inventory_count_id', count.id), 'Falha ao atualizar inventário.');
  ensureOk(await supabaseAdmin.from('inventory_count_items').insert(itemRows.map((item) => ({ ...item, inventory_count_id: count.id }))), 'Falha ao salvar itens do inventário.');
  await audit(tenant.id, actorId, 'INVENTORY_COUNT', count.id, previous ? 'UPDATED' : 'CREATED', previous, { ...count, items: itemRows }, payload.auditObservation);
  return mapInventoryCount(ensureOk(await supabaseAdmin.from('inventory_counts').select('*,inventory_count_items(*)').eq('id', count.id).single(), 'Falha ao recarregar inventário.'));
}

export async function changeInventoryCountStatus(tenantSlug, payload, actorId) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const count = maybeSingle(await supabaseAdmin.from('inventory_counts').select('*,inventory_count_items(*)').eq('tenant_id', tenant.id).eq('id', payload.id).maybeSingle(), 'Falha ao carregar inventário.');
  if (!count) throw new Error('Inventário não encontrado.');
  if (payload.action === 'CLOSE') {
    if (!['DRAFT', 'REOPENED'].includes(count.status)) throw new Error('Inventário não está disponível para fechamento.');
    const updated = ensureOk(await supabaseAdmin.from('inventory_counts').update({ status: 'CLOSED', closed_at: new Date().toISOString(), closed_by: actorId || null }).eq('id', count.id).select('*').single(), 'Falha ao fechar inventário.');
    if (count.count_type === 'CLOSING') {
      const nextMonth = addMonths(count.competence_month, 1);
      const existingOpening = maybeSingle(await supabaseAdmin.from('inventory_counts').select('*').eq('tenant_id', tenant.id).eq('competence_month', nextMonth).eq('count_type', 'OPENING').maybeSingle(), 'Falha ao verificar próximo mês.');
      if (existingOpening && existingOpening.source_inventory_count_id && existingOpening.source_inventory_count_id !== count.id) throw new Error('Já existe abertura do próximo mês vinculada a outro fechamento.');
      const opening = ensureOk(await supabaseAdmin.from('inventory_counts').upsert({ id: existingOpening?.id || undefined, tenant_id: tenant.id, competence_month: nextMonth, count_type: 'OPENING', count_date: `${nextMonth}-01`, status: 'CLOSED', total_value: count.total_value, source_inventory_count_id: count.id, observation: `Gerado pelo fechamento de ${count.competence_month}.`, created_by: actorId || null, closed_by: actorId || null, closed_at: new Date().toISOString() }, { onConflict: 'tenant_id,competence_month,count_type' }).select('*').single(), 'Falha ao gerar inventário inicial do próximo mês.');
      if (existingOpening) ensureOk(await supabaseAdmin.from('inventory_count_items').delete().eq('inventory_count_id', opening.id), 'Falha ao atualizar abertura seguinte.');
      ensureOk(await supabaseAdmin.from('inventory_count_items').insert((count.inventory_count_items || []).map((item) => ({ tenant_id: tenant.id, inventory_count_id: opening.id, ingredient_id: item.ingredient_id, quantity: item.quantity, unit: item.unit, unit_cost: item.unit_cost, total_value: item.total_value, observation: 'Saldo transportado do mês anterior.' }))), 'Falha ao transportar estoque final.');
    }
    await audit(tenant.id, actorId, 'INVENTORY_COUNT', count.id, 'CLOSED', count, updated, payload.observation);
    return mapInventoryCount({ ...updated, inventory_count_items: count.inventory_count_items });
  }
  if (payload.action === 'REOPEN') {
    if (count.status !== 'CLOSED') throw new Error('Somente inventário fechado pode ser reaberto.');
    const reason = String(payload.observation || '').trim();
    if (!reason) throw new Error('Informe o motivo da reabertura.');
    const updated = ensureOk(await supabaseAdmin.from('inventory_counts').update({ status: 'REOPENED', closed_at: null, closed_by: null }).eq('id', count.id).select('*').single(), 'Falha ao reabrir inventário.');
    if (count.count_type === 'CLOSING') ensureOk(await supabaseAdmin.from('inventory_counts').update({ status: 'CANCELLED' }).eq('tenant_id', tenant.id).eq('source_inventory_count_id', count.id), 'Falha ao invalidar abertura seguinte.');
    await audit(tenant.id, actorId, 'INVENTORY_COUNT', count.id, 'REOPENED', count, updated, reason);
    return mapInventoryCount({ ...updated, inventory_count_items: count.inventory_count_items });
  }
  throw new Error('Ação de inventário inválida.');
}

function mapBalancePeriod(row, metrics) {
  return {
    id: row.id, competenceMonth: row.competence_month, openingBankBalance: number(row.opening_bank_balance), openingCashBalance: number(row.opening_cash_balance),
    actualClosingBankBalance: row.actual_closing_bank_balance == null ? null : number(row.actual_closing_bank_balance),
    actualClosingCashBalance: row.actual_closing_cash_balance == null ? null : number(row.actual_closing_cash_balance),
    status: row.status, sourceBalancePeriodId: row.source_balance_period_id || '', observation: row.observation || '', ...metrics
  };
}

async function calculateBalanceMetrics(tenantId, month, period) {
  const start = `${month}-01`;
  const [year, monthNumber] = month.split('-').map(Number);
  const end = new Date(year, monthNumber, 0, 12).toISOString().slice(0, 10);
  const [transactions, reconciliations, movements] = await Promise.all([
    ensureOk(await supabaseAdmin.from('transactions').select('*').eq('tenant_id', tenantId).gte('transaction_date', start).lte('transaction_date', end), 'Falha ao carregar movimentos financeiros.'),
    ensureOk(await supabaseAdmin.from('daily_cash_reconciliations').select('*').eq('tenant_id', tenantId).gte('reconciliation_date', start).lte('reconciliation_date', end), 'Falha ao carregar conferências diárias.'),
    ensureOk(await supabaseAdmin.from('financial_account_movements').select('*').eq('tenant_id', tenantId).eq('status', 'ACTIVE').gte('movement_date', start).lte('movement_date', end), 'Falha ao carregar transferências e ajustes.')
  ]);
  const hasReconciliations = reconciliations.length > 0;
  const cashInflows = hasReconciliations ? reconciliations.reduce((sum, row) => sum + number(row.cash_revenue), 0) : transactions.filter((row) => row.type === 'receita' && row.financial_origin === 'CASH').reduce((sum, row) => sum + number(row.net_amount || row.amount), 0);
  const settlementInflows = transactions.filter((row) => row.type === 'controle' && /entrada de recebível/i.test(String(row.category || ''))).reduce((sum, row) => sum + number(row.amount), 0);
  const bankInflows = (hasReconciliations ? reconciliations.reduce((sum, row) => sum + number(row.bank_revenue), 0) : transactions.filter((row) => row.type === 'receita' && row.financial_origin === 'BANK').reduce((sum, row) => sum + number(row.net_amount || row.amount), 0)) + settlementInflows;
  const outflows = transactions.filter((row) => row.type === 'controle' && /saída de (conta|dinheiro)/i.test(String(row.category || '')));
  const cashOutflows = outflows.filter((row) => row.financial_origin === 'CASH' || /saída de dinheiro/i.test(row.category)).reduce((sum, row) => sum + number(row.amount), 0);
  const bankOutflows = outflows.filter((row) => row.financial_origin !== 'CASH' && !/saída de dinheiro/i.test(row.category)).reduce((sum, row) => sum + number(row.amount), 0);
  const bankMovement = movements.reduce((sum, row) => sum + number(row.bank_amount), 0);
  const cashMovement = movements.reduce((sum, row) => sum + number(row.cash_amount), 0);
  const expectedClosingBankBalance = money(number(period?.opening_bank_balance) + bankInflows - bankOutflows + bankMovement);
  const expectedClosingCashBalance = money(number(period?.opening_cash_balance) + cashInflows - cashOutflows + cashMovement);
  const actualBank = period?.actual_closing_bank_balance == null ? null : number(period.actual_closing_bank_balance);
  const actualCash = period?.actual_closing_cash_balance == null ? null : number(period.actual_closing_cash_balance);
  return {
    bankInflows: money(bankInflows), cashInflows: money(cashInflows), bankOutflows: money(bankOutflows), cashOutflows: money(cashOutflows),
    bankTransfersAndAdjustments: money(bankMovement), cashTransfersAndAdjustments: money(cashMovement),
    expectedClosingBankBalance, expectedClosingCashBalance,
    bankDifference: actualBank == null ? null : money(actualBank - expectedClosingBankBalance),
    cashDifference: actualCash == null ? null : money(actualCash - expectedClosingCashBalance),
    expectedTotalBalance: money(expectedClosingBankBalance + expectedClosingCashBalance),
    actualTotalBalance: actualBank == null || actualCash == null ? null : money(actualBank + actualCash)
  };
}

export async function getFinancialBalances(tenantSlug) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const [periods, movements] = await Promise.all([
    ensureOk(await supabaseAdmin.from('financial_balance_periods').select('*').eq('tenant_id', tenant.id).order('competence_month', { ascending: false }), 'Falha ao carregar saldos mensais.'),
    ensureOk(await supabaseAdmin.from('financial_account_movements').select('*').eq('tenant_id', tenant.id).order('movement_date', { ascending: false }), 'Falha ao carregar transferências e ajustes.')
  ]);
  const mapped = [];
  for (const period of periods) mapped.push(mapBalancePeriod(period, await calculateBalanceMetrics(tenant.id, period.competence_month, period)));
  return { periods: mapped, movements: movements.map((row) => ({ id: row.id, date: row.movement_date, movementType: row.movement_type, bankAmount: number(row.bank_amount), cashAmount: number(row.cash_amount), reason: row.reason, observation: row.observation || '', status: row.status, reversalReason: row.reversal_reason || '', createdBy: row.created_by || '', createdAt: row.created_at })) };
}

export async function saveFinancialBalancePeriod(tenantSlug, payload, actorId) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  if (!/^\d{4}-\d{2}$/.test(String(payload.competenceMonth || ''))) throw new Error('Competência inválida.');
  const previous = maybeSingle(await supabaseAdmin.from('financial_balance_periods').select('*').eq('tenant_id', tenant.id).eq('competence_month', payload.competenceMonth).maybeSingle(), 'Falha ao carregar saldo mensal.');
  if (previous?.status === 'CLOSED') throw new Error('Período financeiro fechado. Reabra antes de alterar.');
  const values = { id: previous?.id || undefined, tenant_id: tenant.id, competence_month: payload.competenceMonth, opening_bank_balance: money(payload.openingBankBalance), opening_cash_balance: money(payload.openingCashBalance), actual_closing_bank_balance: payload.actualClosingBankBalance === '' || payload.actualClosingBankBalance == null ? null : money(payload.actualClosingBankBalance), actual_closing_cash_balance: payload.actualClosingCashBalance === '' || payload.actualClosingCashBalance == null ? null : money(payload.actualClosingCashBalance), status: previous?.status === 'REOPENED' ? 'REOPENED' : 'OPEN', source_balance_period_id: previous?.source_balance_period_id || null, observation: String(payload.observation || '').trim(), created_by: previous?.created_by || actorId || null };
  const row = ensureOk(await supabaseAdmin.from('financial_balance_periods').upsert(values, { onConflict: 'tenant_id,competence_month' }).select('*').single(), 'Falha ao salvar saldos mensais.');
  await audit(tenant.id, actorId, 'FINANCIAL_BALANCE_PERIOD', row.id, previous ? 'UPDATED' : 'CREATED', previous, row, payload.auditObservation);
  return mapBalancePeriod(row, await calculateBalanceMetrics(tenant.id, row.competence_month, row));
}

export async function saveFinancialAccountMovement(tenantSlug, payload, actorId) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const amount = Math.abs(number(payload.amount));
  if (amount <= 0) throw new Error('Valor precisa ser maior que zero.');
  let bankAmount = 0; let cashAmount = 0; let movementType;
  if (payload.kind === 'BANK_TO_CASH') { movementType = 'TRANSFER'; bankAmount = -amount; cashAmount = amount; }
  else if (payload.kind === 'CASH_TO_BANK') { movementType = 'TRANSFER'; bankAmount = amount; cashAmount = -amount; }
  else if (payload.kind === 'BANK_ADJUSTMENT') { movementType = 'RECONCILIATION_ADJUSTMENT'; bankAmount = number(payload.signedAmount ?? payload.amount); }
  else if (payload.kind === 'CASH_ADJUSTMENT') { movementType = 'RECONCILIATION_ADJUSTMENT'; cashAmount = number(payload.signedAmount ?? payload.amount); }
  else throw new Error('Tipo de movimentação inválido.');
  const reason = String(payload.reason || '').trim();
  if (!reason) throw new Error('Motivo é obrigatório.');
  const row = ensureOk(await supabaseAdmin.from('financial_account_movements').insert({ tenant_id: tenant.id, movement_date: payload.date || today(), movement_type: movementType, bank_amount: money(bankAmount), cash_amount: money(cashAmount), reason, observation: String(payload.observation || '').trim(), created_by: actorId || null }).select('*').single(), 'Falha ao registrar movimentação entre saldos.');
  await audit(tenant.id, actorId, 'FINANCIAL_ACCOUNT_MOVEMENT', row.id, 'CREATED', null, row, payload.auditObservation);
  return { id: row.id, date: row.movement_date, movementType: row.movement_type, bankAmount: number(row.bank_amount), cashAmount: number(row.cash_amount), reason: row.reason, observation: row.observation || '', status: row.status };
}

export async function reverseFinancialAccountMovement(tenantSlug, payload, actorId) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const previous = maybeSingle(await supabaseAdmin.from('financial_account_movements').select('*').eq('tenant_id', tenant.id).eq('id', payload.id).maybeSingle(), 'Falha ao carregar movimentação.');
  if (!previous || previous.status !== 'ACTIVE') throw new Error('Movimentação ativa não encontrada.');
  const reason = String(payload.reason || '').trim(); if (!reason) throw new Error('Informe o motivo do estorno.');
  const row = ensureOk(await supabaseAdmin.from('financial_account_movements').update({ status: 'REVERSED', reversed_at: new Date().toISOString(), reversed_by: actorId || null, reversal_reason: reason }).eq('id', previous.id).select('*').single(), 'Falha ao estornar movimentação.');
  await audit(tenant.id, actorId, 'FINANCIAL_ACCOUNT_MOVEMENT', row.id, 'REVERSED', previous, row, reason);
  return { id: row.id, status: row.status };
}

export async function changeFinancialBalanceStatus(tenantSlug, payload, actorId) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const period = maybeSingle(await supabaseAdmin.from('financial_balance_periods').select('*').eq('tenant_id', tenant.id).eq('id', payload.id).maybeSingle(), 'Falha ao carregar período financeiro.');
  if (!period) throw new Error('Período financeiro não encontrado.');
  if (payload.action === 'CLOSE') {
    if (period.actual_closing_bank_balance == null || period.actual_closing_cash_balance == null) throw new Error('Informe saldo real bancário e dinheiro contado antes de fechar.');
    const row = ensureOk(await supabaseAdmin.from('financial_balance_periods').update({ status: 'CLOSED', closed_at: new Date().toISOString(), closed_by: actorId || null }).eq('id', period.id).select('*').single(), 'Falha ao fechar período financeiro.');
    const nextMonth = addMonths(period.competence_month, 1);
    const existing = maybeSingle(await supabaseAdmin.from('financial_balance_periods').select('*').eq('tenant_id', tenant.id).eq('competence_month', nextMonth).maybeSingle(), 'Falha ao verificar próximo período.');
    if (existing && existing.source_balance_period_id && existing.source_balance_period_id !== period.id) throw new Error('Próximo mês já está vinculado a outro fechamento.');
    ensureOk(await supabaseAdmin.from('financial_balance_periods').upsert({ id: existing?.id || undefined, tenant_id: tenant.id, competence_month: nextMonth, opening_bank_balance: period.actual_closing_bank_balance, opening_cash_balance: period.actual_closing_cash_balance, status: 'OPEN', source_balance_period_id: period.id, observation: `Saldo transportado de ${period.competence_month}.`, created_by: actorId || null }, { onConflict: 'tenant_id,competence_month' }), 'Falha ao transportar saldos para o próximo mês.');
    await audit(tenant.id, actorId, 'FINANCIAL_BALANCE_PERIOD', period.id, 'CLOSED', period, row, payload.observation);
    return mapBalancePeriod(row, await calculateBalanceMetrics(tenant.id, row.competence_month, row));
  }
  if (payload.action === 'REOPEN') {
    const reason = String(payload.observation || '').trim(); if (!reason) throw new Error('Informe o motivo da reabertura.');
    const row = ensureOk(await supabaseAdmin.from('financial_balance_periods').update({ status: 'REOPENED', closed_at: null, closed_by: null }).eq('id', period.id).select('*').single(), 'Falha ao reabrir período financeiro.');
    const monthStart = `${period.competence_month}-01`;
    ensureOk(
      await supabaseAdmin.from('financial_closings').update({ status: 'reopened' })
        .eq('tenant_id', tenant.id)
        .eq('period_type', 'monthly')
        .eq('period_start', monthStart),
      'Falha ao reabrir a competência histórica.'
    );
    await audit(tenant.id, actorId, 'FINANCIAL_BALANCE_PERIOD', period.id, 'REOPENED', period, row, reason);
    return mapBalancePeriod(row, await calculateBalanceMetrics(tenant.id, row.competence_month, row));
  }
  throw new Error('Ação financeira inválida.');
}

export async function closeIntegratedMonth(tenantSlug, payload, actorId) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const month = String(payload.competenceMonth || '');
  if (!/^\d{4}-\d{2}$/.test(month)) throw new Error('Competência inválida.');
  const dre = payload.dreSnapshot;
  if (!dre || dre.month !== month || !Number.isFinite(Number(dre.netIncome)) || !Number.isFinite(Number(dre.revenueNet))) {
    throw new Error('O fechamento exige um snapshot válido e completo da DRE da competência.');
  }
  const [inventory, balance, orders] = await Promise.all([
    maybeSingle(await supabaseAdmin.from('inventory_counts').select('*').eq('tenant_id', tenant.id).eq('competence_month', month).eq('count_type', 'CLOSING').eq('status', 'CLOSED').maybeSingle(), 'Falha ao verificar inventário final.'),
    maybeSingle(await supabaseAdmin.from('financial_balance_periods').select('*').eq('tenant_id', tenant.id).eq('competence_month', month).eq('status', 'CLOSED').maybeSingle(), 'Falha ao verificar fechamento financeiro.'),
    loadOrders(tenant.id)
  ]);
  if (!inventory) throw new Error('Feche o inventário final antes do fechamento mensal integrado.');
  if (!balance) throw new Error('Feche os saldos financeiros antes do fechamento mensal integrado.');
  const counts = ensureOk(await supabaseAdmin.from('inventory_counts').select('*,inventory_count_items(*)').eq('tenant_id', tenant.id), 'Falha ao calcular CMV do fechamento.');
  const summary = buildMonthlyInventorySummaries(counts, orders).find((item) => item.month === month);
  const metrics = await calculateBalanceMetrics(tenant.id, month, balance);
  const start = `${month}-01`; const end = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0, 12).toISOString().slice(0, 10);
  const snapshot = { dre, inventory: summary, financial: mapBalancePeriod(balance, metrics), checklist: { inventoryClosed: true, purchasesRegistered: true, paymentsReviewed: true, financialBalancesClosed: true, differencesReviewed: true, cmvCalculated: summary?.realCmv != null, futureObligationsPreserved: true }, closedBy: actorId || null };
  const previous = maybeSingle(await supabaseAdmin.from('financial_closings').select('*').eq('tenant_id', tenant.id).eq('period_type', 'monthly').eq('period_start', start).eq('period_end', end).maybeSingle(), 'Falha ao verificar fechamento existente.');
  if (previous?.status === 'closed') throw new Error('Esta competência já está fechada. Reabra-a explicitamente antes de recalcular o fechamento.');
  const row = ensureOk(await supabaseAdmin.from('financial_closings').upsert({ id: previous?.id || undefined, tenant_id: tenant.id, period_type: 'monthly', period_start: start, period_end: end, status: 'closed', snapshot, closed_at: new Date().toISOString() }, { onConflict: 'tenant_id,period_type,period_start,period_end' }).select('*').single(), 'Falha ao concluir fechamento integrado.');
  await audit(tenant.id, actorId, 'INTEGRATED_MONTH_CLOSE', row.id, previous ? 'RECLOSED' : 'CLOSED', previous, row, payload.observation);
  return { id: row.id, month, status: row.status, snapshot };
}
