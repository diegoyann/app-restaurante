import { supabaseAdmin } from '../src/modules/shared/db.js';
import {
  changeFinancialBalanceStatus,
  changeInventoryCountStatus,
  changePurchaseOrderStatus,
  closeIntegratedMonth,
  getFinancialBalances,
  getSupplyChainData,
  receivePurchaseOrder,
  saveFinancialAccountMovement,
  saveFinancialBalancePeriod,
  saveInventoryCount,
  savePurchaseOrder,
  saveSupplier
} from '../src/modules/supply-chain/index.js';
import { addFinancialPayment } from '../src/modules/finance/obligationsService.js';

const tenantSlug = process.env.ACCEPTANCE_TENANT_SLUG || 'bady-bassitt';
let tenantId = process.env.ACCEPTANCE_TENANT_ID;
if (!tenantId) {
  const tenantResult = await supabaseAdmin.from('tenants').select('id').eq('slug', tenantSlug).single();
  if (tenantResult.error || !tenantResult.data) throw tenantResult.error || new Error('Tenant de aceitação não encontrado.');
  tenantId = tenantResult.data.id;
}
const marker = `[TESTE AUTOMÁTICO ${Date.now()}]`;
const ids = { supplier: '', order: '', cancelOrder: '', receipts: [], obligations: [], counts: [], balances: [], movements: [], closings: [] };
let originalIngredients = [];

async function cleanup() {
  if (ids.receipts.length) await supabaseAdmin.from('purchase_receipts').update({ financial_obligation_id: null }).in('id', ids.receipts);
  if (ids.obligations.length) {
    await supabaseAdmin.from('financial_obligations').update({ purchase_receipt_id: null }).in('id', ids.obligations);
    await supabaseAdmin.from('transactions').delete().in('obligation_id', ids.obligations);
    await supabaseAdmin.from('financial_payments').delete().in('obligation_id', ids.obligations);
    await supabaseAdmin.from('financial_obligations').delete().in('id', ids.obligations);
  }
  if (ids.closings.length) await supabaseAdmin.from('financial_closings').delete().in('id', ids.closings);
  if (ids.counts.length) {
    await supabaseAdmin.from('inventory_count_items').delete().in('inventory_count_id', ids.counts);
    await supabaseAdmin.from('inventory_counts').delete().in('id', ids.counts);
  }
  if (ids.movements.length) await supabaseAdmin.from('financial_account_movements').delete().in('id', ids.movements);
  if (ids.balances.length) await supabaseAdmin.from('financial_balance_periods').delete().in('id', ids.balances);
  if (ids.receipts.length) {
    const { data: items } = await supabaseAdmin.from('purchase_receipt_items').select('id').in('purchase_receipt_id', ids.receipts);
    const itemIds = (items || []).map((item) => item.id);
    if (itemIds.length) {
      await supabaseAdmin.from('inventory_movements').delete().in('source_id', itemIds);
      await supabaseAdmin.from('ingredient_price_history').delete().in('purchase_receipt_item_id', itemIds);
    }
    await supabaseAdmin.from('purchase_receipt_items').delete().in('purchase_receipt_id', ids.receipts);
    await supabaseAdmin.from('purchase_receipts').delete().in('id', ids.receipts);
  }
  for (const orderId of [ids.order, ids.cancelOrder].filter(Boolean)) {
    await supabaseAdmin.from('purchase_order_items').delete().eq('purchase_order_id', orderId);
    await supabaseAdmin.from('purchase_orders').delete().eq('id', orderId);
  }
  if (ids.supplier) {
    await supabaseAdmin.from('supplier_ingredients').delete().eq('supplier_id', ids.supplier);
    await supabaseAdmin.from('suppliers').delete().eq('id', ids.supplier);
  }
  await supabaseAdmin.from('operation_audit_events').delete().eq('tenant_id', tenantId).gte('created_at', new Date(Date.now() - 3600000).toISOString());
  for (const ingredient of originalIngredients) await supabaseAdmin.from('ingredients').update({ unit_cost: ingredient.unit_cost }).eq('id', ingredient.id);
}

try {
  const ingredientResult = await supabaseAdmin.from('ingredients').select('id,name,unit,unit_cost').eq('tenant_id', tenantId).limit(2);
  if (ingredientResult.error || ingredientResult.data.length < 2) throw ingredientResult.error || new Error('São necessários dois insumos.');
  originalIngredients = ingredientResult.data;
  const supplier = await saveSupplier(tenantSlug, { name: marker, paymentTermType: 'DAYS_AFTER_RECEIPT', paymentTermDays: 7, defaultPaymentMethod: 'BOLETO', defaultFinancialOrigin: 'BANK', ingredientIds: originalIngredients.map((item) => item.id) });
  ids.supplier = supplier.id;
  let order = await savePurchaseOrder(tenantSlug, { supplierId: supplier.id, orderDate: '2098-08-31', status: 'AWAITING_DELIVERY', items: originalIngredients.map((item, index) => ({ ingredientId: item.id, orderedQuantity: index + 2, estimatedUnitPrice: 10 + index })) });
  ids.order = order.id;
  const forecastResult = await supabaseAdmin.from('financial_obligations').select('*').eq('tenant_id', tenantId).eq('purchase_order_id', order.id).single();
  if (forecastResult.error) throw forecastResult.error;
  if (Number(forecastResult.data.forecast_amount) !== 53 || forecastResult.data.final_amount != null) throw new Error('Pedido realizado não gerou a obrigação prevista de R$ 53,00.');
  ids.obligations.push(forecastResult.data.id);
  order = await savePurchaseOrder(tenantSlug, {
    id: order.id,
    supplierId: supplier.id,
    orderDate: order.orderDate,
    status: order.status,
    notes: 'Pedido editado antes do recebimento',
    items: order.items.map((item) => ({
      ingredientId: item.ingredientId,
      orderedQuantity: item.orderedQuantity,
      estimatedUnitPrice: item.estimatedUnitPrice,
      observation: item.observation
    }))
  });
  const editedForecastResult = await supabaseAdmin.from('financial_obligations').select('id,forecast_amount').eq('tenant_id', tenantId).eq('purchase_order_id', order.id);
  if (order.id !== ids.order || order.notes !== 'Pedido editado antes do recebimento' || editedForecastResult.error || editedForecastResult.data.length !== 1 || editedForecastResult.data[0].id !== forecastResult.data.id || Number(editedForecastResult.data[0].forecast_amount) !== 53) throw new Error('A edição não preservou o mesmo pedido e a mesma obrigação prevista.');

  const cancellable = await savePurchaseOrder(tenantSlug, {
    supplierId: supplier.id,
    orderDate: '2098-08-30',
    status: 'DRAFT',
    items: [{ ingredientId: originalIngredients[0].id, orderedQuantity: 1, estimatedUnitPrice: 10 }]
  });
  ids.cancelOrder = cancellable.id;
  const draftObligation = await supabaseAdmin.from('financial_obligations').select('id').eq('tenant_id', tenantId).eq('purchase_order_id', cancellable.id);
  if (draftObligation.error || draftObligation.data.length !== 0) throw new Error('Rascunho gerou Conta a Pagar indevidamente.');
  await changePurchaseOrderStatus(tenantSlug, { id: cancellable.id, status: 'ORDERED' });
  const cancellableObligation = await supabaseAdmin.from('financial_obligations').select('id,status').eq('tenant_id', tenantId).eq('purchase_order_id', cancellable.id).single();
  if (cancellableObligation.error) throw cancellableObligation.error;
  ids.obligations.push(cancellableObligation.data.id);
  await changePurchaseOrderStatus(tenantSlug, { id: cancellable.id, action: 'CANCEL', reason: 'Cancelamento de aceitação automática' });
  const cancelledObligation = await supabaseAdmin.from('financial_obligations').select('status,final_amount').eq('id', cancellableObligation.data.id).single();
  if (cancelledObligation.error || cancelledObligation.data.status !== 'CANCELLED' || Number(cancelledObligation.data.final_amount) !== 0) throw new Error('Cancelar o pedido não cancelou a mesma obrigação financeira.');

  const first = await receivePurchaseOrder(tenantSlug, { purchaseOrderId: order.id, receivedAt: '2098-09-01', items: [{ purchaseOrderItemId: order.items[0].id, receivedQuantity: 1, actualUnitPrice: 11 }] });
  ids.receipts.push(first.receiptId);
  if (first.obligationId !== forecastResult.data.id) throw new Error('O recebimento parcial criou outra obrigação financeira.');
  if (first.order.status !== 'PARTIALLY_RECEIVED') throw new Error(`Status parcial incorreto: ${first.order.status}`);
  order = first.order;
  const remaining = order.items.map((item) => ({
    purchaseOrderItemId: item.id,
    receivedQuantity: item.orderedQuantity - order.receipts.flatMap((receipt) => receipt.items).filter((received) => received.purchaseOrderItemId === item.id).reduce((sum, received) => sum + received.receivedQuantity, 0),
    actualUnitPrice: 12
  })).filter((item) => item.receivedQuantity > 0);
  const second = await receivePurchaseOrder(tenantSlug, { purchaseOrderId: order.id, receivedAt: '2098-09-05', items: remaining });
  ids.receipts.push(second.receiptId);
  if (second.obligationId !== forecastResult.data.id) throw new Error('O recebimento total criou outra obrigação financeira.');
  if (second.order.status !== 'RECEIVED') throw new Error(`Status final incorreto: ${second.order.status}`);
  const obligationResult = await supabaseAdmin.from('financial_obligations').select('*').eq('id', first.obligationId).single();
  const obligation = obligationResult.data;
  const orderObligations = await supabaseAdmin.from('financial_obligations').select('id').eq('tenant_id', tenantId).eq('purchase_order_id', order.id);
  if (orderObligations.error || orderObligations.data.length !== 1) throw new Error('O pedido não possui exatamente uma obrigação financeira.');
  if (Number(obligation.forecast_amount) !== 53 || Number(obligation.final_amount) !== 59) throw new Error('A mesma obrigação não foi atualizada de R$ 53,00 previsto para R$ 59,00 realizado.');
  if (obligation.due_date !== '2098-09-08' || obligation.competence_month !== '2098-09') throw new Error('Competência ou vencimento da obrigação incorreto.');
  if (obligation.suggested_payment_method !== 'BOLETO' || obligation.suggested_financial_origin !== 'BANK') throw new Error('Sugestões financeiras do fornecedor não foram preservadas.');
  await addFinancialPayment(tenantSlug, { obligationId: first.obligationId, amount: 5, paymentDate: '2098-10-01', financialOrigin: 'CASH', paymentMethod: 'CASH' });
  await addFinancialPayment(tenantSlug, { obligationId: first.obligationId, amount: Number(obligation.final_amount) - 5, paymentDate: '2098-10-03', financialOrigin: 'BANK', paymentMethod: 'PIX' });

  const opening = await saveInventoryCount(tenantSlug, { competenceMonth: '2098-09', countType: 'OPENING', countDate: '2098-09-01', items: originalIngredients.map((item) => ({ ingredientId: item.id, quantity: 10, unitCost: 10 })) });
  ids.counts.push(opening.id); await changeInventoryCountStatus(tenantSlug, { id: opening.id, action: 'CLOSE' });
  const closing = await saveInventoryCount(tenantSlug, { competenceMonth: '2098-09', countType: 'CLOSING', countDate: '2098-09-30', items: originalIngredients.map((item) => ({ ingredientId: item.id, quantity: 8, unitCost: 10 })) });
  ids.counts.push(closing.id); await changeInventoryCountStatus(tenantSlug, { id: closing.id, action: 'CLOSE' });
  const rolledCounts = await supabaseAdmin.from('inventory_counts').select('id').eq('tenant_id', tenantId).eq('competence_month', '2098-10');
  ids.counts.push(...rolledCounts.data.map((item) => item.id));

  const period = await saveFinancialBalancePeriod(tenantSlug, { competenceMonth: '2098-09', openingBankBalance: 1000, openingCashBalance: 200, actualClosingBankBalance: 900, actualClosingCashBalance: 210 });
  ids.balances.push(period.id);
  const movement = await saveFinancialAccountMovement(tenantSlug, { kind: 'BANK_TO_CASH', amount: 50, date: '2098-09-10', reason: 'Teste de transferência' });
  ids.movements.push(movement.id);
  await changeFinancialBalanceStatus(tenantSlug, { id: period.id, action: 'CLOSE' });
  const nextPeriods = await supabaseAdmin.from('financial_balance_periods').select('id').eq('tenant_id', tenantId).eq('competence_month', '2098-10');
  ids.balances.push(...nextPeriods.data.map((item) => item.id));
  const integrated = await closeIntegratedMonth(tenantSlug, { competenceMonth: '2098-09' });
  ids.closings.push(integrated.id);

  const supply = await getSupplyChainData(tenantSlug);
  const summary = supply.monthlyInventorySummaries.find((item) => item.month === '2098-09');
  const balances = await getFinancialBalances(tenantSlug);
  const october = balances.periods.find((item) => item.competenceMonth === '2098-10');
  const paymentResult = await supabaseAdmin.from('financial_payments').select('financial_origin,amount').eq('obligation_id', first.obligationId);
  const payments = paymentResult.data;
  if (summary?.realCmv !== 99 || summary?.purchasesReceived !== 59) throw new Error(`CMV incorreto: ${JSON.stringify(summary)}`);
  if (payments.length !== 2 || !payments.some((item) => item.financial_origin === 'CASH') || !payments.some((item) => item.financial_origin === 'BANK')) throw new Error('Pagamento misto incorreto.');
  if (october?.openingBankBalance !== 900 || october?.openingCashBalance !== 210) throw new Error('Transporte de saldos incorreto.');
  if (october?.expectedClosingBankBalance !== 846 || october?.expectedClosingCashBalance !== 205) throw new Error(`Pagamentos não reduziram banco/caixa corretamente: ${JSON.stringify(october)}`);
  console.log('PASS: rascunho sem obrigação; edição preserva pedido/previsão; cancelamento cancela previsão; recebimentos parcial/total atualizam a mesma obrigação; competência e D+7; sugestões; pagamento misto; BANK/CASH; CMV real e transportes.');
} finally {
  await cleanup();
}
