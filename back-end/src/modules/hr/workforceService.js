import { ensureOk, getTenantRowBySlug, maybeSingle, normalizeMoney, supabaseAdmin } from '../shared/db.js';
import { mapPayrollConfig } from '../app/projections/hrProjection.js';
import { calculateWeeklyExtraTotals, weeklyPeriodForDate } from './weeklyExtraModel.js';
import { synchronizeExtraClosingObligation, synchronizeFixedPayrollMonth } from '../finance/obligationsService.js';
import { resolveDailyRateSelection, suggestedDailyRateTypeIds } from './dailyRateTypesModel.js';
import { assertCompetenceOpen } from '../finance/competenceProtection.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const money = (value) => normalizeMoney(Math.max(Number(value) || 0, 0));
const isMotoboy = (employee) => /moto|entrega/i.test(String(employee.role || ''));

function assertDate(value, field = 'Data') {
  if (!ISO_DATE.test(String(value || ''))) throw new Error(`${field} inválida. Use AAAA-MM-DD.`);
  return value;
}

function addDays(date, days) {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

function mapRateTypeSnapshot(row) {
  return {
    id: row.id,
    dailyRateTypeId: row.daily_rate_type_id || '',
    typeName: row.type_name,
    amountSnapshot: Number(row.amount_snapshot || 0)
  };
}

function mapLog(row, rateTypes = []) {
  return {
    id: row.id, employeeId: row.employee_id, workDate: row.work_date, worked: Boolean(row.worked),
    dailyRate: Number(row.daily_rate || 0), mealCost: Number(row.meal_cost || 0),
    deliveryFee: Number(row.delivery_fee || 0), note: row.note || '', rateTypes
  };
}

function mapClosing(row) {
  return {
    id: row.id, employeeId: row.employee_id, periodStart: row.period_start, periodEnd: row.period_end,
    totalDailyRates: Number(row.total_daily_rates || 0), totalDeliveryFees: Number(row.total_delivery_fees || 0),
    totalPayment: Number(row.total_payment || 0), expectedPaymentDate: row.expected_payment_date,
    paidAmount: Number(row.paid_amount || 0), paidAt: row.paid_at || '', status: row.status, note: row.note || ''
  };
}

async function readConfig(tenantId) {
  const row = maybeSingle(await supabaseAdmin.from('payroll_configs').select('*').eq('tenant_id', tenantId).maybeSingle(), 'Falha ao carregar configuração de RH.');
  return mapPayrollConfig(row);
}

async function getEmployee(tenantId, employeeId) {
  const employee = maybeSingle(await supabaseAdmin.from('employees').select('*').eq('tenant_id', tenantId).eq('id', employeeId).maybeSingle(), 'Falha ao carregar funcionário.');
  if (!employee) throw new Error('Funcionário não encontrado nesta filial.');
  return employee;
}

export async function saveWorkLog(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const workDate = assertDate(payload.workDate);
  await assertCompetenceOpen(tenant.id, workDate.slice(0, 7));
  const employee = await getEmployee(tenant.id, payload.employeeId);
  const config = await readConfig(tenant.id);
  const worked = payload.worked !== false;
  const motoboy = isMotoboy(employee);
  const currentQuery = supabaseAdmin.from('employee_work_logs').select('*').eq('tenant_id', tenant.id);
  const current = maybeSingle(await (payload.id
    ? currentQuery.eq('id', payload.id)
    : currentQuery.eq('employee_id', employee.id).eq('work_date', workDate)).maybeSingle(), 'Falha ao carregar conferência.');
  const existingSnapshots = current
    ? ensureOk(await supabaseAdmin.from('employee_work_log_rate_types').select('*').eq('tenant_id', tenant.id).eq('work_log_id', current.id), 'Falha ao carregar Tipos de Diária da presença.')
    : [];

  let dailyRate = 0;
  let snapshots = [];
  if (worked && employee.employment_type === 'external') {
    const configuredRows = ensureOk(await supabaseAdmin.from('employee_daily_rate_types').select('*').eq('tenant_id', tenant.id).eq('employee_id', employee.id).eq('active', true).order('created_at'), 'Falha ao carregar Tipos de Diária do funcionário.');
    const configuredTypes = configuredRows.map((type) => ({
      id: type.id,
      name: type.name,
      amount: Number(type.amount || 0),
      active: type.active !== false,
      appliesWeekdays: Boolean(type.applies_weekdays),
      appliesWeekends: Boolean(type.applies_weekends)
    }));
    let selectedIds;
    if (Array.isArray(payload.dailyRateTypeIds)) {
      selectedIds = payload.dailyRateTypeIds;
    } else if (existingSnapshots.length) {
      selectedIds = existingSnapshots.map((item) => item.daily_rate_type_id).filter(Boolean);
    } else {
      selectedIds = suggestedDailyRateTypeIds(configuredTypes, workDate);
    }

    if (!selectedIds.length && current && Number(current.daily_rate || 0) > 0 && !Array.isArray(payload.dailyRateTypeIds)) {
      dailyRate = money(current.daily_rate);
    } else {
      if (!selectedIds.length) throw new Error('Selecione ao menos um Tipo de Diária para registrar a presença deste funcionário extra.');
      const selection = resolveDailyRateSelection(configuredTypes, selectedIds, existingSnapshots);
      dailyRate = selection.dailyRate;
      snapshots = selection.snapshots;
    }
  }
  const mealCost = worked ? money(Number(current?.meal_cost || 0) > 0 ? current.meal_cost : config.mealCostPerWorkday) : 0;
  const deliveryFee = worked && motoboy ? money(payload.deliveryFee ?? current?.delivery_fee) : 0;

  const row = ensureOk(await supabaseAdmin.from('employee_work_logs').upsert({
    id: current?.id || payload.id || undefined, tenant_id: tenant.id, employee_id: employee.id, work_date: workDate,
    worked, daily_rate: dailyRate, meal_cost: mealCost, delivery_fee: deliveryFee, note: String(payload.note || '').trim()
  }, { onConflict: 'tenant_id,employee_id,work_date' }).select('*').single(), 'Falha ao salvar conferência diária.');

  ensureOk(await supabaseAdmin.from('employee_work_log_rate_types').delete().eq('tenant_id', tenant.id).eq('work_log_id', row.id), 'Falha ao atualizar Tipos de Diária da presença.');
  let snapshotRows = [];
  if (snapshots.length) {
    snapshotRows = ensureOk(await supabaseAdmin.from('employee_work_log_rate_types').insert(snapshots.map((item) => ({
      tenant_id: tenant.id,
      work_log_id: row.id,
      daily_rate_type_id: item.dailyRateTypeId,
      type_name: item.typeName,
      amount_snapshot: item.amountSnapshot
    }))).select('*'), 'Falha ao preservar os valores dos Tipos de Diária.');
  }

  if (employee.employment_type === 'external') {
    const closing = await regenerateWeeklyClosing(tenant.id, employee, weeklyPeriodForDate(workDate).periodStart);
    if (closing?.id) await synchronizeExtraClosingObligation(tenant.id, closing.id);
  } else {
    await synchronizeFixedPayrollMonth(tenant.id, workDate.slice(0, 7));
  }
  return mapLog(row, snapshotRows.map(mapRateTypeSnapshot));
}

export async function regenerateWeeklyClosing(tenantId, employee, periodStart) {
  const periodEnd = addDays(periodStart, 6);
  const logs = ensureOk(await supabaseAdmin.from('employee_work_logs').select('*').eq('tenant_id', tenantId).eq('employee_id', employee.id).gte('work_date', periodStart).lte('work_date', periodEnd).eq('worked', true), 'Falha ao calcular fechamento semanal.');
  const weeklyTotals = calculateWeeklyExtraTotals(logs);
  const totalDailyRates = money(weeklyTotals.dailyRates);
  const totalDeliveryFees = money(weeklyTotals.deliveryFees);
  const totalPayment = money(totalDailyRates + totalDeliveryFees);
  const expectedPaymentDate = addDays(periodEnd, isMotoboy(employee) ? 4 : 1);
  const existing = maybeSingle(await supabaseAdmin.from('extra_weekly_closings').select('*').eq('tenant_id', tenantId).eq('employee_id', employee.id).eq('period_start', periodStart).maybeSingle(), 'Falha ao carregar fechamento semanal.');

  if (logs.length === 0 && !existing) return null;
  const paidAmount = Math.min(money(existing?.paid_amount), totalPayment);
  const status = paidAmount >= totalPayment && totalPayment > 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'pending';
  const row = ensureOk(await supabaseAdmin.from('extra_weekly_closings').upsert({
    id: existing?.id, tenant_id: tenantId, employee_id: employee.id, period_start: periodStart, period_end: periodEnd,
    total_daily_rates: totalDailyRates, total_delivery_fees: totalDeliveryFees, total_payment: totalPayment,
    expected_payment_date: expectedPaymentDate, paid_amount: paidAmount, paid_at: status === 'paid' ? existing?.paid_at || expectedPaymentDate : null,
    status, note: existing?.note || ''
  }, { onConflict: 'tenant_id,employee_id,period_start,period_end' }).select('*').single(), 'Falha ao salvar fechamento semanal.');
  return mapClosing(row);
}

export async function updateWeeklyClosingPayment(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const current = maybeSingle(await supabaseAdmin.from('extra_weekly_closings').select('*').eq('tenant_id', tenant.id).eq('id', payload.id).maybeSingle(), 'Falha ao carregar fechamento.');
  if (!current) throw new Error('Fechamento não encontrado.');
  await assertCompetenceOpen(tenant.id, String(current.period_start).slice(0, 7));
  const paidAmount = Math.min(money(payload.paidAmount), Number(current.total_payment || 0));
  const status = paidAmount >= Number(current.total_payment || 0) && Number(current.total_payment || 0) > 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'pending';
  const row = ensureOk(await supabaseAdmin.from('extra_weekly_closings').update({
    paid_amount: paidAmount, paid_at: status === 'pending' ? null : assertDate(payload.paidAt || new Date().toISOString().slice(0, 10), 'Data do pagamento'),
    status, note: String(payload.note ?? current.note ?? '').trim()
  }).eq('tenant_id', tenant.id).eq('id', current.id).select('*').single(), 'Falha ao atualizar pagamento.');
  return mapClosing(row);
}

export async function getWorkforceData(tenantSlug) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const [logs, closings, rateTypeSnapshots] = await Promise.all([
    ensureOk(await supabaseAdmin.from('employee_work_logs').select('*').eq('tenant_id', tenant.id).order('work_date', { ascending: false }), 'Falha ao carregar conferências.'),
    ensureOk(await supabaseAdmin.from('extra_weekly_closings').select('*').eq('tenant_id', tenant.id).order('period_start', { ascending: false }), 'Falha ao carregar fechamentos.'),
    ensureOk(await supabaseAdmin.from('employee_work_log_rate_types').select('*').eq('tenant_id', tenant.id).order('created_at'), 'Falha ao carregar Tipos de Diária registrados.')
  ]);
  const snapshotsByLog = rateTypeSnapshots.reduce((groups, row) => {
    (groups[row.work_log_id] ||= []).push(mapRateTypeSnapshot(row));
    return groups;
  }, {});
  return { employeeWorkLogs: logs.map((row) => mapLog(row, snapshotsByLog[row.id] || [])), extraWeeklyClosings: closings.map(mapClosing) };
}
