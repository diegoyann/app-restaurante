import { ensureOk, getTenantRowBySlug, maybeSingle, normalizeMoney, supabaseAdmin } from '../shared/db.js';
import { measureBootstrapSpan } from '../../lib/bootstrapTrace.js';
import { recurringObligationRows } from './recurrenceSchedule.js';
import { buildExtraObligationRow } from './extraObligationModel.js';
import { planObligationBatch } from './bootstrapObligationBatch.js';
import { calculatePaymentProgress, requirePaymentDate } from './paymentModel.js';
import { loadFixedPayrollStatements } from '../hr/fixedPayrollService.js';
import { assertCompetenceOpen, isCompetenceClosed } from './competenceProtection.js';

const money = (value) => normalizeMoney(Math.max(Number(value) || 0, 0));
const signedMoney = (value) => normalizeMoney(Number(value) || 0);
const todayIso = () => new Date().toISOString().slice(0, 10);

export function normalizeRecurringCostName(value) {
  const clean = String(value || '')
    .replace(/^Planilha\s+[^—-]+\s+[—-]\s+Custos\s+Fixos\s+[—-]\s+/i, '')
    .trim()
    .replace(/\s+/g, ' ');
  const key = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return { name: clean, key };
}

function addMonths(month, offset) {
  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(year, monthNumber - 1 + offset, 1, 12);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function dateForDay(month, day) {
  const [year, monthNumber] = month.split('-').map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  return `${month}-${String(Math.min(Math.max(Number(day) || 1, 1), lastDay)).padStart(2, '0')}`;
}

function dateBr(value) {
  const [year, month, day] = String(value || '').split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function nthBusinessDay(month, ordinal, holidays = []) {
  const [year, monthNumber] = month.split('-').map(Number);
  let count = 0;
  for (let day = 1; day <= 31; day += 1) {
    const date = new Date(year, monthNumber - 1, day, 12);
    if (date.getMonth() !== monthNumber - 1) break;
    const iso = date.toISOString().slice(0, 10);
    if (date.getDay() !== 0 && date.getDay() !== 6 && !holidays.includes(iso)) count += 1;
    if (count === Number(ordinal || 5)) return iso;
  }
  return dateForDay(month, 5);
}

function obligationAmount(row) {
  return money(row.final_amount ?? row.forecast_amount);
}

function statusFor(row, referenceDate = todayIso()) {
  if (row.status === 'CANCELLED') return 'CANCELLED';
  const total = obligationAmount(row);
  const paid = money(row.paid_amount);
  if (total === 0 && row.status === 'PAID') return 'PAID';
  if (total > 0 && paid >= total) return 'PAID';
  if (paid > 0) return 'PARTIAL';
  if (row.due_date < referenceDate) return 'OVERDUE';
  const due = new Date(`${row.due_date}T12:00:00`);
  const reference = new Date(`${referenceDate}T12:00:00`);
  const days = Math.ceil((due - reference) / 86400000);
  return days <= 7 ? 'DUE_SOON' : 'EXPECTED';
}

function mapPayment(row) {
  return {
    id: row.id,
    obligationId: row.obligation_id,
    amount: Number(row.amount || 0),
    paymentDate: row.payment_date,
    financialOrigin: row.financial_origin,
    paymentMethod: row.payment_method,
    observation: row.observation || ''
  };
}

export function mapFinancialObligation(row, payments = [], payrollDetail = null) {
  const status = statusFor(row);
  const total = obligationAmount(row);
  return {
    id: row.id,
    recurringCostId: row.recurring_cost_id || '',
    employeeId: row.employee_id || '',
    extraWeeklyClosingId: row.extra_weekly_closing_id || '',
    purchaseReceiptId: row.purchase_receipt_id || '',
    purchaseOrderId: row.purchase_order_id || '',
    description: row.description,
    economicCategory: row.economic_category,
    sourceType: row.source_type,
    sourceId: row.source_id,
    originalImportLabel: row.original_import_label || '',
    competenceMonth: row.competence_month,
    forecastType: row.forecast_type,
    forecastAmount: Number(row.forecast_amount || 0),
    finalAmount: row.final_amount == null ? null : Number(row.final_amount),
    totalAmount: total,
    dueDate: row.due_date,
    status,
    paidAmount: Number(row.paid_amount || 0),
    openAmount: money(total - Number(row.paid_amount || 0)),
    note: row.note || '',
    suggestedPaymentMethod: row.suggested_payment_method || '',
    suggestedFinancialOrigin: row.suggested_financial_origin || '',
    payments,
    payrollDetail
  };
}

async function generateRecurring(tenantId, months) {
  const costs = ensureOk(await supabaseAdmin.from('recurring_costs').select('*').eq('tenant_id', tenantId), 'Falha ao carregar cadastros de custos fixos.');
  const rows = [];
  for (const cost of costs) {
    const { name } = normalizeRecurringCostName(cost.description);
    if (cost.last_paid_month) {
      rows.push({
        tenant_id: tenantId, recurring_cost_id: cost.merged_into_id || cost.id, description: name,
        economic_category: cost.category || 'CUSTO_FIXO', source_type: 'IMPORTED_SPREADSHEET', source_id: cost.id,
        original_import_label: cost.original_import_label || '', competence_month: cost.last_paid_month,
        forecast_type: cost.forecast_type || 'FIXED', forecast_amount: money(cost.amount), final_amount: money(cost.amount),
        due_date: dateForDay(cost.last_paid_month, cost.due_day), status: 'PAID', paid_amount: money(cost.amount),
        note: 'Histórico preservado da importação original.', preserveExisting: true
      });
    }
    if (!cost.active || cost.merged_into_id || ['FOLHA_FIXA', 'FOLHA_EXTRA'].includes(cost.category)) continue;
    for (const month of months) {
      for (const occurrence of recurringObligationRows(cost, month)) {
        rows.push({
          tenant_id: tenantId, recurring_cost_id: cost.id,
          description: cost.recurrence === 'WEEKLY' ? `${name} — ${dateBr(occurrence.dueDate)}` : name,
          economic_category: cost.category || 'CUSTO_FIXO', source_type: 'RECURRING', source_id: occurrence.sourceId,
          original_import_label: cost.original_import_label || '', competence_month: month,
          forecast_type: cost.forecast_type || 'FIXED', forecast_amount: occurrence.amount,
          due_date: occurrence.dueDate, note: ''
        });
      }
    }
  }
  return rows;
}

async function generatePayroll(tenantId, months) {
  const statements = await loadFixedPayrollStatements(tenantId, months);
  const rows = [];
  for (const statement of statements) {
      const month = statement.month;
      const advancePercentage = Number(statement.advancePercentage || 40);
      const salaryPercentage = Number(statement.salaryPercentage || 60);
      const nextMonth = addMonths(month, 1);
      rows.push({
        tenant_id: tenantId, employee_id: statement.employeeId, description: `${statement.employeeName} — Primeiro pagamento ${advancePercentage}%`,
        economic_category: 'FOLHA_FIXA', source_type: 'RH', source_id: `${statement.employeeId}:ADVANCE`, competence_month: month,
        forecast_type: 'FIXED', forecast_amount: statement.advanceAmount, final_amount: statement.advanceAmount,
        due_date: dateForDay(month, statement.advanceFixedDay || 20), note: 'Competência da folha fixa; salário e regra preservados por vigência.'
      });
      rows.push({
        tenant_id: tenantId, employee_id: statement.employeeId, description: `${statement.employeeName} — Pagamento final ${salaryPercentage}%`,
        economic_category: 'FOLHA_FIXA', source_type: 'RH', source_id: `${statement.employeeId}:SALARY`, competence_month: month,
        forecast_type: 'ESTIMATED', forecast_amount: statement.baseSalaryPayment, final_amount: statement.finalSalaryPayment,
        due_date: nthBusinessDay(nextMonth, statement.salaryBusinessDayOrdinal || 5, statement.holidayDates || []),
        note: `${statement.absenceCount} falta(s): R$ ${statement.absenceAmount.toFixed(2)}. Outros descontos: R$ ${statement.otherDiscountAmount.toFixed(2)}. Pagamento no mês seguinte; competência preservada.`
      });
  }
  return rows;
}

function extraClosingCandidate(tenantId, closing) {
  return {
    ...buildExtraObligationRow(tenantId, closing),
    paid_amount: money(closing.paid_amount),
    status: closing.status === 'paid'
      ? 'PAID'
      : closing.status === 'partial'
        ? 'PARTIAL'
        : 'EXPECTED'
  };
}

async function synchronizeObligationCandidates(tenantId, candidates) {
  if (candidates.length === 0) return [];

  const months = [...new Set(candidates.map((row) => row.competence_month))];
  const [existing, closingRows] = await Promise.all([
    ensureOk(
      await supabaseAdmin
        .from('financial_obligations')
        .select('*')
        .eq('tenant_id', tenantId)
        .in('competence_month', months),
      'Falha ao carregar obrigações financeiras existentes.'
    ),
    ensureOk(
      await supabaseAdmin
        .from('financial_closings')
        .select('period_start,status')
        .eq('tenant_id', tenantId)
        .eq('period_type', 'monthly')
        .in('period_start', months.map((month) => `${month}-01`)),
      'Falha ao verificar competências fechadas.'
    )
  ]);
  const closedMonths = new Set(
    closingRows
      .filter((row) => row.status === 'closed')
      .map((row) => String(row.period_start).slice(0, 7))
  );
  const rows = planObligationBatch({ candidates, existing, closedMonths });

  if (rows.length === 0) return existing;

  return ensureOk(
    await supabaseAdmin
      .from('financial_obligations')
      .upsert(rows, {
        onConflict: 'tenant_id,source_type,source_id,competence_month',
        ignoreDuplicates: false,
        defaultToNull: false
      })
      .select('*'),
    'Falha ao sincronizar obrigações financeiras.'
  );
}

export async function synchronizeFixedPayrollMonth(tenantId, month) {
  if (await isCompetenceClosed(tenantId, month)) return [];
  return synchronizeObligationCandidates(tenantId, await generatePayroll(tenantId, [month]));
}

export async function synchronizeExtraClosingObligation(tenantId, closingId) {
  const closing = maybeSingle(await supabaseAdmin.from('extra_weekly_closings').select('*,employees(full_name,role)').eq('tenant_id', tenantId).eq('id', closingId).maybeSingle(), 'Falha ao carregar fechamento semanal para sincronização.');
  if (!closing) throw new Error('Fechamento semanal não encontrado para sincronização.');
  return synchronizeObligationCandidates(tenantId, [extraClosingCandidate(tenantId, closing)]);
}

async function generateExtras(tenantId) {
  const closings = ensureOk(await supabaseAdmin.from('extra_weekly_closings').select('*,employees(full_name,role)').eq('tenant_id', tenantId), 'Falha ao carregar extras.');
  return closings.map((closing) => extraClosingCandidate(tenantId, closing));
}

export async function ensureFinancialObligationsForTenant(tenant) {
  const currentMonth = todayIso().slice(0, 7);
  const months = [currentMonth, addMonths(currentMonth, 1), addMonths(currentMonth, 2)];
  const [recurringRows, payrollRows, extraRows] = await Promise.all([
    measureBootstrapSpan('finance.obligations.recurring', () => generateRecurring(tenant.id, months)),
    measureBootstrapSpan('finance.obligations.payroll', () => generatePayroll(tenant.id, months)),
    measureBootstrapSpan('finance.obligations.extras', () => generateExtras(tenant.id))
  ]);
  return synchronizeObligationCandidates(tenant.id, [
    ...recurringRows,
    ...payrollRows,
    ...extraRows
  ]);
}

export async function getFinancialObligations(tenantSlug) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  await ensureFinancialObligationsForTenant(tenant);
  const [rows, paymentRows, duplicateCandidates, extraClosings, workLogs, workLogRateTypes] = await Promise.all([
    ensureOk(await supabaseAdmin.from('financial_obligations').select('*').eq('tenant_id', tenant.id).order('due_date'), 'Falha ao carregar contas a pagar.'),
    ensureOk(await supabaseAdmin.from('financial_payments').select('*').eq('tenant_id', tenant.id).order('payment_date', { ascending: false }), 'Falha ao carregar pagamentos.'),
    ensureOk(await supabaseAdmin.from('recurring_cost_duplicate_candidates').select('*,left:recurring_costs!recurring_cost_duplicate_candidates_left_cost_id_fkey(description),right:recurring_costs!recurring_cost_duplicate_candidates_right_cost_id_fkey(description)').eq('tenant_id', tenant.id).eq('status', 'PENDING'), 'Falha ao carregar possíveis duplicatas.'),
    ensureOk(await supabaseAdmin.from('extra_weekly_closings').select('*,employees(full_name,role)').eq('tenant_id', tenant.id), 'Falha ao detalhar folha extra.'),
    ensureOk(await supabaseAdmin.from('employee_work_logs').select('*').eq('tenant_id', tenant.id).eq('worked', true), 'Falha ao detalhar jornadas.'),
    ensureOk(await supabaseAdmin.from('employee_work_log_rate_types').select('*').eq('tenant_id', tenant.id), 'Falha ao detalhar Tipos de Diária.')
  ]);
  const paymentsByObligation = paymentRows.reduce((map, row) => {
    const items = map.get(row.obligation_id) || [];
    items.push(mapPayment(row)); map.set(row.obligation_id, items); return map;
  }, new Map());
  const fixedMonths = [...new Set(rows.filter((row) => row.economic_category === 'FOLHA_FIXA').map((row) => row.competence_month))];
  const fixedStatements = await loadFixedPayrollStatements(tenant.id, fixedMonths);
  const fixedDetails = new Map(fixedStatements.map((statement) => [`${statement.employeeId}:${statement.month}`, statement]));
  const snapshotsByLog = workLogRateTypes.reduce((groups, row) => {
    (groups[row.work_log_id] ||= []).push({
      dailyRateTypeId: row.daily_rate_type_id || '',
      typeName: row.type_name,
      amountSnapshot: Number(row.amount_snapshot || 0)
    });
    return groups;
  }, {});
  const extraDetails = new Map(extraClosings.map((closing) => {
    const logs = workLogs.filter((log) => log.employee_id === closing.employee_id && log.work_date >= closing.period_start && log.work_date <= closing.period_end);
    return [String(closing.id), {
      employeeId: closing.employee_id,
      employeeName: closing.employees?.full_name || 'Funcionário extra',
      role: closing.employees?.role || '',
      periodStart: closing.period_start,
      periodEnd: closing.period_end,
      daysWorked: logs.length,
      dailyRateCount: logs.reduce((total, log) => total + Math.max((snapshotsByLog[log.id] || []).length, Number(log.daily_rate || 0) > 0 ? 1 : 0), 0),
      workDays: logs.map((log) => ({
        date: log.work_date,
        dailyRate: Number(log.daily_rate || 0),
        deliveryFee: Number(log.delivery_fee || 0),
        rateTypes: snapshotsByLog[log.id] || []
      })),
      totalDailyRates: Number(closing.total_daily_rates || 0),
      totalDeliveryFees: Number(closing.total_delivery_fees || 0),
      totalPayment: Number(closing.total_payment || 0)
    }];
  }));
  return {
    obligations: rows.map((row) => {
      const payrollDetail = row.economic_category === 'FOLHA_FIXA'
        ? { ...fixedDetails.get(`${row.employee_id}:${row.competence_month}`), installment: String(row.source_id).endsWith(':ADVANCE') ? 'ADVANCE' : 'SALARY' }
        : row.economic_category === 'FOLHA_EXTRA' ? extraDetails.get(String(row.extra_weekly_closing_id || row.source_id)) : null;
      return mapFinancialObligation(row, paymentsByObligation.get(row.id) || [], payrollDetail || null);
    }),
    duplicateCandidates: duplicateCandidates.map((row) => ({ id: row.id, leftCostId: row.left_cost_id, rightCostId: row.right_cost_id, leftName: row.left?.description || '', rightName: row.right?.description || '', reason: row.reason }))
  };
}

export async function resolveRecurringCostDuplicate(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const action = payload.action === 'MERGE' ? 'CONFIRMED' : payload.action === 'KEEP_SEPARATE' ? 'REJECTED' : '';
  if (!payload.id || !action) throw new Error('Informe a duplicidade e uma ação válida.');

  return ensureOk(await supabaseAdmin.rpc('resolve_recurring_cost_duplicate_candidate', {
    p_tenant_id: tenant.id,
    p_candidate_id: payload.id,
    p_action: action
  }), 'Falha ao resolver possível duplicidade.');
}

export async function updateFinancialObligation(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const current = maybeSingle(await supabaseAdmin.from('financial_obligations').select('*').eq('tenant_id', tenant.id).eq('id', payload.id).maybeSingle(), 'Falha ao carregar obrigação.');
  if (!current) throw new Error('Obrigação não encontrada.');
  await assertCompetenceOpen(tenant.id, current.competence_month);
  const finalAmount = payload.finalAmount === '' || payload.finalAmount == null ? null : money(payload.finalAmount);
  if (finalAmount != null && finalAmount < Number(current.paid_amount || 0)) throw new Error('O valor final não pode ser menor que o total já pago.');
  const row = ensureOk(await supabaseAdmin.from('financial_obligations').update({
    final_amount: finalAmount,
    due_date: payload.dueDate || current.due_date,
    note: String(payload.note ?? current.note ?? '').trim()
  }).eq('id', current.id).select('*').single(), 'Falha ao atualizar obrigação.');
  return mapFinancialObligation(row);
}

export async function addFinancialPayment(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const obligation = maybeSingle(await supabaseAdmin.from('financial_obligations').select('*').eq('tenant_id', tenant.id).eq('id', payload.obligationId).maybeSingle(), 'Falha ao carregar obrigação.');
  if (!obligation) throw new Error('Obrigação não encontrada.');
  await assertCompetenceOpen(tenant.id, obligation.competence_month);
  const openAmount = money(obligationAmount(obligation) - Number(obligation.paid_amount || 0));
  const paymentAmount = money(payload.amount);
  if (paymentAmount <= 0 || paymentAmount > openAmount) throw new Error(`Pagamento deve estar entre R$ 0,01 e R$ ${openAmount.toFixed(2)}.`);
  const origin = payload.financialOrigin === 'CASH' ? 'CASH' : 'BANK';
  const allowedMethods = ['PIX', 'TRANSFER', 'BOLETO', 'CARD', 'CASH', 'OTHER'];
  const method = allowedMethods.includes(payload.paymentMethod) ? payload.paymentMethod : 'OTHER';
  const paymentDate = requirePaymentDate(payload.paymentDate);
  const payment = ensureOk(await supabaseAdmin.from('financial_payments').insert({
    tenant_id: tenant.id, obligation_id: obligation.id, amount: paymentAmount,
    payment_date: paymentDate, financial_origin: origin,
    payment_method: method, observation: String(payload.observation || '').trim()
  }).select('*').single(), 'Falha ao registrar pagamento.');
  const progress = calculatePaymentProgress({ totalAmount: obligationAmount(obligation), previousPaidAmount: obligation.paid_amount, paymentAmount });
  const updated = ensureOk(await supabaseAdmin.from('financial_obligations').update({ paid_amount: progress.paidAmount, status: progress.status }).eq('id', obligation.id).select('*').single(), 'Falha ao atualizar saldo da obrigação.');
  if (obligation.extra_weekly_closing_id) {
    ensureOk(await supabaseAdmin.from('extra_weekly_closings').update({
      paid_amount: progress.paidAmount,
      paid_at: progress.status === 'PAID' ? payment.payment_date : null,
      status: progress.status === 'PAID' ? 'paid' : 'partial'
    }).eq('tenant_id', tenant.id).eq('id', obligation.extra_weekly_closing_id), 'Falha ao sincronizar pagamento do extra.');
  }
  ensureOk(await supabaseAdmin.from('transactions').insert({
    tenant_id: tenant.id, transaction_date: payment.payment_date, platform: origin === 'CASH' ? 'dinheiro' : 'conta',
    payment: method, amount: paymentAmount, tax: 0, net_amount: -paymentAmount, type: 'controle',
    category: origin === 'CASH' ? 'Fluxo | Saída de dinheiro' : 'Fluxo | Saída de conta',
    economic_category: obligation.economic_category, financial_origin: origin,
    note: obligation.description, source_type: 'OBLIGATION_PAYMENT', source_id: payment.id,
    obligation_id: obligation.id, payment_id: payment.id
  }), 'Falha ao integrar pagamento ao fluxo de caixa.');
  return { obligation: mapFinancialObligation(updated, [mapPayment(payment)]), payment: mapPayment(payment) };
}

export async function saveDailyCashReconciliation(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  await assertCompetenceOpen(tenant.id, String(payload.date || '').slice(0, 7));
  const grossRevenue = money(payload.grossRevenue);
  const cashRevenue = money(payload.cashRevenue);
  if (cashRevenue > grossRevenue) throw new Error('Entrada em dinheiro não pode superar a receita total para conferência.');
  const row = ensureOk(await supabaseAdmin.from('daily_cash_reconciliations').upsert({
    tenant_id: tenant.id, reconciliation_date: payload.date, gross_revenue: grossRevenue,
    cash_revenue: cashRevenue, opening_cash_balance: money(payload.openingCashBalance),
    counted_closing_cash: payload.countedClosingCash === '' || payload.countedClosingCash == null ? null : money(payload.countedClosingCash),
    observation: String(payload.observation || '').trim()
  }, { onConflict: 'tenant_id,reconciliation_date' }).select('*').single(), 'Falha ao salvar conferência física.');
  return row;
}

export async function getDailyCashReconciliations(tenantSlug) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const [rows, transactions] = await Promise.all([
    ensureOk(await supabaseAdmin.from('daily_cash_reconciliations').select('*').eq('tenant_id', tenant.id).order('reconciliation_date', { ascending: false }), 'Falha ao carregar conferências físicas.'),
    ensureOk(await supabaseAdmin.from('transactions').select('transaction_date,amount,financial_origin,category,type').eq('tenant_id', tenant.id).eq('type', 'controle'), 'Falha ao carregar saídas realizadas.')
  ]);
  return rows.map((row) => {
    const dayOutflows = transactions.filter((transaction) => transaction.transaction_date === row.reconciliation_date && /saída de (dinheiro|conta)/i.test(String(transaction.category || '')));
    const isCash = (transaction) => transaction.financial_origin === 'CASH' || /saída de dinheiro/i.test(String(transaction.category || ''));
    const cashOutflow = money(dayOutflows.filter(isCash).reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0));
    const bankOutflow = money(dayOutflows.filter((transaction) => !isCash(transaction)).reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0));
    const expected = money(Number(row.opening_cash_balance || 0) + Number(row.cash_revenue || 0) - cashOutflow);
    const counted = row.counted_closing_cash == null ? null : Number(row.counted_closing_cash);
    return {
      id: row.id, date: row.reconciliation_date, grossRevenue: Number(row.gross_revenue || 0),
      cashRevenue: Number(row.cash_revenue || 0), bankRevenue: Number(row.bank_revenue || 0), receivableRevenue: Number(row.receivable_revenue || 0), nonCashRevenue: money(Number(row.gross_revenue || 0) - Number(row.cash_revenue || 0)),
      openingCashBalance: Number(row.opening_cash_balance || 0), cashOutflow, bankOutflow,
      expectedClosingCash: expected, countedClosingCash: counted,
      cashDifference: counted == null ? null : signedMoney(counted - expected), observation: row.observation || ''
    };
  });
}
