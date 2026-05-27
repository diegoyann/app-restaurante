import {
  ensureOk,
  getTenantRowBySlug,
  maybeSingle,
  normalizeMoney,
  supabaseAdmin
} from '../shared/db.js';
import {
  mapFinancialClosing,
  mapPaymentMethod,
  mapRecurringCost,
  mapTransaction
} from '../shared/mappers.js';

export async function saveTransaction(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const sourceType = String(payload.sourceType || 'manual').trim() || 'manual';
  const sourceId = String(payload.sourceId || '').trim();
  const existingSource = sourceId
    ? maybeSingle(
        await supabaseAdmin
          .from('transactions')
          .select('id')
          .eq('tenant_id', tenant.id)
          .eq('source_type', sourceType)
          .eq('source_id', sourceId)
          .maybeSingle(),
        'Falha ao localizar lançamento automático.'
      )
    : null;

  const row = ensureOk(
    await supabaseAdmin
      .from('transactions')
      .upsert({
        id: payload.id || existingSource?.id || undefined,
        tenant_id: tenant.id,
        transaction_date: payload.date,
        platform: payload.platform,
        payment: payload.payment,
        amount: payload.amount,
        tax: payload.tax,
        net_amount: payload.net,
        type: payload.type,
        category: payload.category,
        note: payload.note || '',
        source_type: sourceType,
        source_id: sourceId
      })
      .select('*')
      .single(),
    'Falha ao salvar transação.'
  );

  return mapTransaction(row);
}

export async function deleteTransactionById(tenantSlug, transactionId) {
  const tenant = await getTenantRowBySlug(tenantSlug);

  ensureOk(
    await supabaseAdmin
      .from('transactions')
      .delete()
      .eq('tenant_id', tenant.id)
      .eq('id', transactionId),
    'Falha ao remover lançamento.'
  );

  return true;
}

export async function deleteTransactionBySource(tenantId, sourceType, sourceId) {
  ensureOk(
    await supabaseAdmin
      .from('transactions')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('source_type', sourceType)
      .eq('source_id', sourceId),
    'Falha ao remover lançamento automático.'
  );
}

export async function syncOrderFinancialTransaction(tenantId, order) {
  if (!order?.id) return null;

  if (order.status !== 'delivered' || Number(order.total_amount || 0) <= 0) {
    await deleteTransactionBySource(tenantId, 'order', order.id);
    return null;
  }

  const transactionDate = String(order.delivered_at || order.updated_at || order.created_at || new Date().toISOString()).slice(0, 10);
  const payment = order.payment_methods?.name || '';
  const channel = String(order.channel || 'proprio').trim() || 'proprio';
  const amount = normalizeMoney(order.total_amount);
  const platformFee = normalizeMoney(order.platform_fee_amount);
  const netAmount = normalizeMoney(amount - platformFee);

  const existing = maybeSingle(
    await supabaseAdmin
      .from('transactions')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('source_type', 'order')
      .eq('source_id', order.id)
      .maybeSingle(),
    'Falha ao localizar receita do pedido.'
  );

  const payload = {
    tenant_id: tenantId,
    transaction_date: transactionDate,
    platform: channel,
    payment,
    amount,
    tax: platformFee,
    net_amount: netAmount,
    type: 'receita',
    category: channel === 'ifood' ? 'pedido_ifood' : 'pedido_proprio',
    note: `Pedido ${order.order_number || String(order.id).slice(0, 8)}`,
    source_type: 'order',
    source_id: order.id
  };

  const row = ensureOk(
    existing
      ? await supabaseAdmin
          .from('transactions')
          .update(payload)
          .eq('tenant_id', tenantId)
          .eq('id', existing.id)
          .select('*')
          .single()
      : await supabaseAdmin
          .from('transactions')
          .insert(payload)
          .select('*')
          .single(),
    'Falha ao sincronizar receita do pedido.'
  );

  return mapTransaction(row);
}

async function ensureDeliveredOrdersAreSynced(tenantId, orders) {
  for (const order of orders) {
    await syncOrderFinancialTransaction(tenantId, order);
  }
}

async function getOrdersInClosingRange(tenantId, periodStart, periodEnd) {
  return ensureOk(
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
      .eq('status', 'delivered')
      .gte('delivered_at', `${periodStart}T00:00:00`)
      .lte('delivered_at', `${periodEnd}T23:59:59`),
    'Falha ao carregar pedidos entregues para fechamento.'
  );
}

export async function saveRecurringCost(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const row = ensureOk(
    await supabaseAdmin
      .from('recurring_costs')
      .upsert({
        id: payload.id || undefined,
        tenant_id: tenant.id,
        description: payload.desc,
        amount: payload.amount,
        due_day: payload.dueDay,
        last_paid_month: payload.lastPaidMonth || ''
      })
      .select('*')
      .single(),
    'Falha ao salvar custo fixo.'
  );

  return mapRecurringCost(row);
}

export async function deleteRecurringCostById(tenantSlug, recurringCostId) {
  const tenant = await getTenantRowBySlug(tenantSlug);

  ensureOk(
    await supabaseAdmin
      .from('recurring_costs')
      .delete()
      .eq('tenant_id', tenant.id)
      .eq('id', recurringCostId),
    'Falha ao remover custo fixo.'
  );

  return true;
}

export async function savePaymentMethod(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const name = String(payload.name || '').trim();
  const allowedKinds = ['cash', 'credit_card', 'debit_card', 'pix', 'voucher', 'other'];
  const kind = allowedKinds.includes(payload.kind) ? payload.kind : 'other';

  if (!name) throw new Error('Nome da forma de pagamento é obrigatório.');

  const paymentMethodPayload = {
    tenant_id: tenant.id,
    name,
    kind,
    requires_change: Boolean(payload.requiresChange),
    status: payload.status === 'inactive' ? 'inactive' : 'active'
  };

  const row = ensureOk(
    payload.id
      ? await supabaseAdmin
          .from('payment_methods')
          .update(paymentMethodPayload)
          .eq('tenant_id', tenant.id)
          .eq('id', payload.id)
          .select('*')
          .single()
      : await supabaseAdmin
          .from('payment_methods')
          .insert(paymentMethodPayload)
          .select('*')
          .single(),
    'Falha ao salvar forma de pagamento.'
  );

  return mapPaymentMethod(row);
}

export async function deletePaymentMethodById(tenantSlug, paymentMethodId) {
  const tenant = await getTenantRowBySlug(tenantSlug);

  ensureOk(
    await supabaseAdmin
      .from('payment_methods')
      .delete()
      .eq('tenant_id', tenant.id)
      .eq('id', paymentMethodId),
    'Falha ao remover forma de pagamento.'
  );

  return true;
}

function parseDateOnly(value, fallback = new Date()) {
  const raw = String(value || '').slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (!fallback) return '';
  return fallback.toISOString().slice(0, 10);
}

function normalizePeriodType(value) {
  if (value === 'weekly' || value === 'monthly') return value;
  return 'daily';
}

function isDateInRange(value, startDate, endDate) {
  const date = parseDateOnly(value, null);
  return date >= startDate && date <= endDate;
}

function sumMoney(items, selector) {
  return normalizeMoney(items.reduce((sum, item) => sum + Number(selector(item) || 0), 0));
}

function buildClosingSnapshot({ periodType, periodStart, periodEnd, bootstrap }) {
  const transactions = bootstrap.transactions.filter((transaction) => isDateInRange(transaction.date, periodStart, periodEnd));
  const automaticOrderTransactions = transactions.filter((transaction) => transaction.type === 'receita' && transaction.sourceType === 'order');
  const manualIncomeTransactions = transactions.filter((transaction) => transaction.type === 'receita' && transaction.sourceType !== 'order');
  const manualExpenseTransactions = transactions.filter((transaction) => transaction.type === 'despesa');
  const deliveredOrders = bootstrap.orders.filter((order) => {
    const date = order.deliveredAt || order.updatedAt || order.createdAt;
    return order.status === 'delivered' && isDateInRange(date, periodStart, periodEnd);
  });

  const fixedCostEntries = bootstrap.recurringCosts.filter((cost) => {
    if (!cost.lastPaidMonth) return false;
    const [year, month] = String(cost.lastPaidMonth).split('-').map(Number);
    if (!year || !month) return false;
    const day = Math.min(Number(cost.dueDay) || 1, new Date(year, month, 0).getDate());
    return isDateInRange(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`, periodStart, periodEnd);
  });

  const monthlyRangeKey = periodStart.slice(0, 7) === periodEnd.slice(0, 7) ? periodStart.slice(0, 7) : '';
  const payrollEmployees = bootstrap.employees.filter((employee) => employee.status !== 'inactive');
  const payrollCosts = monthlyRangeKey
    ? sumMoney(payrollEmployees, (employee) => employee.employmentType === 'freelance' ? employee.baseAmount : employee.salary)
    : 0;

  const orderIncome = sumMoney(automaticOrderTransactions, (transaction) => transaction.net);
  const manualIncome = sumMoney(manualIncomeTransactions, (transaction) => transaction.net);
  const grossRevenue = sumMoney(transactions.filter((transaction) => transaction.type === 'receita'), (transaction) => transaction.amount);
  const netRevenue = normalizeMoney(orderIncome + manualIncome);
  const manualExpenses = sumMoney(manualExpenseTransactions, (transaction) => transaction.amount);
  const fixedCosts = sumMoney(fixedCostEntries, (cost) => cost.amount);
  const deliveryCosts = sumMoney(deliveredOrders, (order) => order.deliveryCost);
  const channelFees = normalizeMoney(grossRevenue - netRevenue);
  const totalExpenses = normalizeMoney(manualExpenses + fixedCosts + payrollCosts + deliveryCosts);
  const balance = normalizeMoney(netRevenue - totalExpenses);

  return {
    periodType,
    periodStart,
    periodEnd,
    grossRevenue,
    netRevenue,
    orderIncome,
    manualIncome,
    manualExpenses,
    fixedCosts,
    payrollCosts,
    deliveryCosts,
    channelFees,
    totalExpenses,
    balance,
    snapshot: {
      transactions,
      deliveredOrders: deliveredOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        deliveryCost: order.deliveryCost,
        deliveredAt: order.deliveredAt,
        payment: order.paymentMethod?.name || ''
      })),
      fixedCostEntries,
      payrollEmployees: payrollEmployees.map((employee) => ({
        id: employee.id,
        name: employee.name,
        employmentType: employee.employmentType,
        amount: employee.employmentType === 'freelance' ? employee.baseAmount : employee.salary
      }))
    }
  };
}

export async function saveFinancialClosing(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const periodType = normalizePeriodType(payload.periodType);
  const periodStart = parseDateOnly(payload.periodStart);
  const periodEnd = parseDateOnly(payload.periodEnd, new Date(`${periodStart}T00:00:00Z`));

  if (periodEnd < periodStart) throw new Error('periodEnd precisa ser maior ou igual ao periodStart.');

  const deliveredRows = await getOrdersInClosingRange(tenant.id, periodStart, periodEnd);
  await ensureDeliveredOrdersAreSynced(tenant.id, deliveredRows);
  const { getTenantBootstrap } = await import('../app/tenantBootstrapReadModel.js');
  const bootstrap = await getTenantBootstrap(tenantSlug);
  const summary = buildClosingSnapshot({ periodType, periodStart, periodEnd, bootstrap });

  const row = ensureOk(
    await supabaseAdmin
      .from('financial_closings')
      .upsert({
        tenant_id: tenant.id,
        period_type: periodType,
        period_start: periodStart,
        period_end: periodEnd,
        gross_revenue: summary.grossRevenue,
        net_revenue: summary.netRevenue,
        order_income: summary.orderIncome,
        manual_income: summary.manualIncome,
        manual_expenses: summary.manualExpenses,
        fixed_costs: summary.fixedCosts,
        payroll_costs: summary.payrollCosts,
        delivery_costs: summary.deliveryCosts,
        channel_fees: summary.channelFees,
        total_expenses: summary.totalExpenses,
        balance: summary.balance,
        status: 'closed',
        snapshot: summary.snapshot,
        closed_at: new Date().toISOString()
      }, { onConflict: 'tenant_id,period_type,period_start,period_end' })
      .select('*')
      .single(),
    'Falha ao salvar fechamento financeiro.'
  );

  return mapFinancialClosing(row);
}
