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
  mapSalesChannel,
  mapTransaction
} from '../shared/mappers.js';
import { normalizeRecurringCostName } from './obligationsService.js';
import { randomUUID } from 'node:crypto';
import { buildDailyRevenue } from './dailyRevenueModel.js';
import { assertCompetenceOpen } from './competenceProtection.js';
import { requireTransactionDate } from './transactionDateModel.js';

export async function saveTransaction(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const transactionDate = requireTransactionDate(payload.date);
  await assertCompetenceOpen(tenant.id, transactionDate.slice(0, 7));
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
        transaction_date: transactionDate,
        platform: payload.platform,
        payment: payload.payment,
        amount: payload.amount,
        tax: payload.tax,
        net_amount: payload.net,
        type: payload.type,
        category: payload.category,
        note: payload.note || '',
        source_type: sourceType,
        source_id: sourceId,
        economic_category: payload.economicCategory || '',
        financial_origin: payload.financialOrigin || '',
        obligation_id: payload.obligationId || null,
        payment_id: payload.paymentId || null,
        batch_id: payload.batchId || null
      })
      .select('*')
      .single(),
    'Falha ao salvar transação.'
  );

  return mapTransaction(row);
}

export async function deleteTransactionById(tenantSlug, transactionId) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const current = maybeSingle(
    await supabaseAdmin.from('transactions').select('transaction_date').eq('tenant_id', tenant.id).eq('id', transactionId).maybeSingle(),
    'Falha ao carregar lançamento.'
  );
  if (!current) return true;
  await assertCompetenceOpen(tenant.id, String(current.transaction_date).slice(0, 7));

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

export async function saveDailyRevenue(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const date = String(payload.date || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Data da venda diária inválida.');
  await assertCompetenceOpen(tenant.id, date.slice(0, 7));
  const channels = ensureOk(await supabaseAdmin.from('sales_channels').select('*').eq('tenant_id', tenant.id).eq('active', true), 'Falha ao carregar canais de venda.');
  const previous = ensureOk(await supabaseAdmin.from('transactions').select('batch_id').eq('tenant_id', tenant.id).eq('source_type', 'DAILY_REVENUE').eq('transaction_date', date), 'Falha ao verificar entrada diária existente.');
  const batchId = previous.find((row) => row.batch_id)?.batch_id || randomUUID();
  const daily = buildDailyRevenue({ date, batchId, channels, entries: Array.isArray(payload.entries) ? payload.entries : [] });
  ensureOk(await supabaseAdmin.from('transactions').delete().eq('tenant_id', tenant.id).eq('source_type', 'DAILY_REVENUE').eq('transaction_date', date), 'Falha ao substituir entrada diária.');
  const transactions = [];
  for (const row of daily.rows) transactions.push(await saveTransaction(tenantSlug, { ...row, note: String(payload.note || '') }));
  const existingReconciliation = maybeSingle(await supabaseAdmin.from('daily_cash_reconciliations').select('*').eq('tenant_id', tenant.id).eq('reconciliation_date', date).maybeSingle(), 'Falha ao carregar conferência do dia.');
  ensureOk(await supabaseAdmin.from('daily_cash_reconciliations').upsert({
    id: existingReconciliation?.id || undefined,
    tenant_id: tenant.id,
    reconciliation_date: date,
    gross_revenue: daily.totals.grossRevenue,
    cash_revenue: daily.totals.cashRevenue,
    bank_revenue: daily.totals.bankRevenue,
    receivable_revenue: daily.totals.receivableRevenue,
    opening_cash_balance: Number(existingReconciliation?.opening_cash_balance || 0),
    counted_closing_cash: existingReconciliation?.counted_closing_cash ?? null,
    observation: String(payload.note || existingReconciliation?.observation || '')
  }, { onConflict: 'tenant_id,reconciliation_date' }), 'Falha ao atualizar conferência financeira do dia.');
  return { batchId, transactions, totals: daily.totals };
}

export async function deleteTransactionBySource(tenantId, sourceType, sourceId) {
  const existing = ensureOk(
    await supabaseAdmin.from('transactions').select('transaction_date').eq('tenant_id', tenantId).eq('source_type', sourceType).eq('source_id', sourceId),
    'Falha ao carregar lançamento automático.'
  );
  for (const row of existing) await assertCompetenceOpen(tenantId, String(row.transaction_date).slice(0, 7));
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
  const today = new Date().toISOString().slice(0, 10);
  const previous = payload.id ? maybeSingle(
    await supabaseAdmin.from('recurring_costs').select('*').eq('tenant_id', tenant.id).eq('id', payload.id).maybeSingle(),
    'Falha ao carregar o cadastro recorrente atual.'
  ) : null;
  const normalized = normalizeRecurringCostName(payload.desc);
  const category = String(payload.category || 'CUSTO_FIXO').trim().toUpperCase();
  const duplicate = payload.id ? null : maybeSingle(
    await supabaseAdmin.from('recurring_costs').select('id').eq('tenant_id', tenant.id).eq('category', category).eq('normalized_key', normalized.key).eq('active', true).is('merged_into_id', null).maybeSingle(),
    'Falha ao verificar custo fixo duplicado.'
  );
  if (duplicate) throw new Error(`Já existe um cadastro mestre equivalente: ${normalized.name}.`);
  const requestedEffectiveDate = String(payload.effectiveFrom || today).slice(0, 10);
  const effectiveDate = previous && requestedEffectiveDate < today ? today : requestedEffectiveDate;
  const row = ensureOk(
    await supabaseAdmin
      .from('recurring_costs')
      .upsert({
        id: payload.id || undefined,
        tenant_id: tenant.id,
        description: normalized.name,
        amount: payload.amount,
        due_day: payload.dueDay,
        last_paid_month: payload.lastPaidMonth || '',
        normalized_key: normalized.key,
        category,
        forecast_type: payload.forecastType === 'ESTIMATED' ? 'ESTIMATED' : 'FIXED',
        recurrence: ['MONTHLY', 'WEEKLY', 'SPECIAL'].includes(payload.recurrence) ? payload.recurrence : 'MONTHLY',
        weekday: payload.recurrence === 'WEEKLY' ? Number(payload.weekday) : null,
        effective_from: effectiveDate,
        active: payload.active !== false,
        aliases: Array.isArray(payload.aliases) ? payload.aliases : [],
        source_type: payload.sourceType || 'MANUAL'
      })
      .select('*')
      .single(),
    'Falha ao salvar custo fixo.'
  );

  ensureOk(
    await supabaseAdmin.from('recurring_cost_history').upsert({
      tenant_id: tenant.id,
      recurring_cost_id: row.id,
      effective_month: effectiveDate.slice(0, 7),
      description: row.description,
      amount: row.amount,
      due_day: row.due_day,
      category: row.category,
      forecast_type: row.forecast_type,
      recurrence: row.recurrence,
      weekday: row.weekday,
      active: row.active,
    }, { onConflict: 'tenant_id,recurring_cost_id,effective_month' }),
    'Falha ao preservar a vigência do custo recorrente.'
  );

  if (previous) {
    const effectiveMonth = effectiveDate.slice(0, 7);
    ensureOk(
      await supabaseAdmin
        .from('financial_obligations')
        .delete()
        .eq('tenant_id', tenant.id)
        .eq('recurring_cost_id', row.id)
        .eq('source_type', 'RECURRING')
        .eq('paid_amount', 0)
        .gte('competence_month', effectiveMonth),
      'Falha ao substituir previsões futuras do cadastro recorrente.'
    );
  }

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

export async function saveSalesChannel(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const name = String(payload.name || '').trim();
  const feePercent = Number(payload.feePercent || 0);
  if (!name) throw new Error('Nome do canal é obrigatório.');
  if (!Number.isFinite(feePercent) || feePercent < 0 || feePercent > 100) throw new Error('A taxa deve estar entre 0% e 100%.');
  const settlementType = payload.settlementType === 'SCHEDULED' ? 'SCHEDULED' : 'IMMEDIATE';
  const settlementFrequency = settlementType === 'SCHEDULED' && payload.settlementFrequency === 'WEEKLY' ? 'WEEKLY' : 'NONE';
  const row = ensureOk(await supabaseAdmin.from('sales_channels').upsert({
    id: payload.id || undefined,
    tenant_id: tenant.id,
    name,
    active: payload.active !== false,
    fee_percent: feePercent,
    settlement_type: settlementType,
    settlement_frequency: settlementFrequency,
    settlement_weekday: settlementFrequency === 'WEEKLY' ? Number(payload.settlementWeekday ?? 3) : null,
    settlement_delay_days: settlementFrequency === 'WEEKLY' ? Number(payload.settlementDelayDays ?? 3) : 0,
    notes: String(payload.notes || '').trim()
  }).select('*').single(), 'Falha ao salvar canal de venda.');
  return mapSalesChannel(row);
}

export async function deleteSalesChannelById(tenantSlug, channelId) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  ensureOk(await supabaseAdmin.from('sales_channels').delete().eq('tenant_id', tenant.id).eq('id', channelId), 'Falha ao excluir canal de venda.');
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
