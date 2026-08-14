import { supabaseAdmin } from '../src/modules/shared/db.js';
import { getWorkforceData, saveEmployee, saveWorkLog } from '../src/modules/hr/index.js';
import { validateEmployeePayload } from '../src/services/payrollService.js';
import { weeklyPeriodForDate } from '../src/modules/hr/weeklyExtraModel.js';

const tenantSlug = process.env.ACCEPTANCE_TENANT_SLUG || 'bady-bassitt';
const marker = `[TESTE DIÁRIAS ${Date.now()}]`;
let tenantId = '';
let employeeId = '';

async function cleanup() {
  if (!tenantId) return;
  let employeeIds = employeeId ? [employeeId] : [];
  if (!employeeIds.length) {
    const employeeResult = await supabaseAdmin.from('employees').select('id').eq('tenant_id', tenantId).like('full_name', '[TESTE DIÁRIAS%');
    employeeIds = (employeeResult.data || []).map((employee) => employee.id);
  }
  if (!employeeIds.length) return;
  const closingsResult = await supabaseAdmin.from('extra_weekly_closings').select('id').eq('tenant_id', tenantId).in('employee_id', employeeIds);
  const closingIds = (closingsResult.data || []).map((closing) => closing.id);
  if (closingIds.length) {
    const obligationsResult = await supabaseAdmin.from('financial_obligations').select('id').eq('tenant_id', tenantId).in('extra_weekly_closing_id', closingIds);
    const obligationIds = (obligationsResult.data || []).map((obligation) => obligation.id);
    if (obligationIds.length) {
      await supabaseAdmin.from('transactions').delete().in('obligation_id', obligationIds);
      await supabaseAdmin.from('financial_payments').delete().in('obligation_id', obligationIds);
      await supabaseAdmin.from('financial_obligations').delete().in('id', obligationIds);
    }
  }
  const logsResult = await supabaseAdmin.from('employee_work_logs').select('id').eq('tenant_id', tenantId).in('employee_id', employeeIds);
  const logIds = (logsResult.data || []).map((log) => log.id);
  if (logIds.length) await supabaseAdmin.from('employee_work_log_rate_types').delete().in('work_log_id', logIds);
  await supabaseAdmin.from('employee_work_logs').delete().eq('tenant_id', tenantId).in('employee_id', employeeIds);
  await supabaseAdmin.from('extra_weekly_closings').delete().eq('tenant_id', tenantId).in('employee_id', employeeIds);
  await supabaseAdmin.from('employee_daily_rate_types').delete().eq('tenant_id', tenantId).in('employee_id', employeeIds);
  await supabaseAdmin.from('employee_discounts').delete().eq('tenant_id', tenantId).in('employee_id', employeeIds);
  await supabaseAdmin.from('employees').delete().eq('tenant_id', tenantId).in('id', employeeIds);
}

try {
  const tenantResult = await supabaseAdmin.from('tenants').select('id').eq('slug', tenantSlug).single();
  if (tenantResult.error || !tenantResult.data) throw tenantResult.error || new Error('Tenant não encontrado.');
  tenantId = tenantResult.data.id;

  const employee = await saveEmployee(tenantSlug, validateEmployeePayload({
    name: marker,
    role: 'Extra Cozinha',
    employmentType: 'external',
    status: 'active',
    paymentMode: 'weekly',
    weekday: '1',
    baseAmount: 60,
    dailyRateTypes: [
      { name: 'Diária Dia', amount: 60, appliesWeekdays: true, appliesWeekends: true },
      { name: 'Diária Noite', amount: 70, appliesWeekdays: true, appliesWeekends: true }
    ]
  }));
  employeeId = employee.id;
  if (employee.dailyRateTypes?.length !== 2) throw new Error('O cadastro não devolveu os dois Tipos de Diária.');
  const dayType = employee.dailyRateTypes.find((type) => type.name === 'Diária Dia');
  const nightType = employee.dailyRateTypes.find((type) => type.name === 'Diária Noite');

  const firstLog = await saveWorkLog(tenantSlug, {
    employeeId,
    workDate: '2098-08-13',
    worked: true,
    dailyRateTypeIds: [dayType.id, nightType.id]
  });
  if (firstLog.dailyRate !== 130 || firstLog.mealCost !== 15 || firstLog.rateTypes.length !== 2) throw new Error(`Dia + Noite deveria gerar R$ 130,00 e uma refeição de R$ 15,00: ${JSON.stringify(firstLog)}`);

  let workforce = await getWorkforceData(tenantSlug);
  const periodStart = weeklyPeriodForDate('2098-08-13').periodStart;
  let closing = workforce.extraWeeklyClosings.find((item) => String(item.employeeId) === String(employeeId) && item.periodStart === periodStart);
  if (!closing || closing.totalDailyRates !== 130 || closing.totalPayment !== 130) throw new Error('O fechamento semanal não recebeu os dois Tipos de Diária.');
  const initialObligations = await supabaseAdmin.from('financial_obligations').select('id,forecast_amount').eq('tenant_id', tenantId).eq('extra_weekly_closing_id', closing.id);
  if (initialObligations.error || initialObligations.data.length !== 1 || Number(initialObligations.data[0].forecast_amount) !== 130) throw new Error('O fechamento não gerou uma única obrigação semanal de R$ 130,00.');
  const obligationId = initialObligations.data[0].id;

  await saveEmployee(tenantSlug, validateEmployeePayload({
    ...employee,
    dailyRateTypes: employee.dailyRateTypes.map((type) => type.id === nightType.id ? { ...type, amount: 80 } : type)
  }));
  workforce = await getWorkforceData(tenantSlug);
  const historicalLog = workforce.employeeWorkLogs.find((item) => item.id === firstLog.id);
  if (historicalLog.dailyRate !== 130 || historicalLog.rateTypes.find((type) => type.dailyRateTypeId === nightType.id)?.amountSnapshot !== 70) throw new Error('O reajuste alterou o valor histórico da Diária Noite.');

  const secondLog = await saveWorkLog(tenantSlug, {
    employeeId,
    workDate: '2098-08-14',
    worked: true,
    dailyRateTypeIds: [nightType.id]
  });
  if (secondLog.dailyRate !== 80 || secondLog.mealCost !== 15) throw new Error('O novo registro não utilizou o valor reajustado de R$ 80,00 com uma única refeição.');
  workforce = await getWorkforceData(tenantSlug);
  closing = workforce.extraWeeklyClosings.find((item) => String(item.employeeId) === String(employeeId) && item.periodStart === periodStart);
  if (closing.totalDailyRates !== 210 || closing.totalPayment !== 210) throw new Error('O fechamento semanal não totalizou R$ 210,00.');
  const finalObligations = await supabaseAdmin.from('financial_obligations').select('id,forecast_amount').eq('tenant_id', tenantId).eq('extra_weekly_closing_id', closing.id);
  if (finalObligations.error || finalObligations.data.length !== 1 || finalObligations.data[0].id !== obligationId || Number(finalObligations.data[0].forecast_amount) !== 210) throw new Error('A obrigação semanal foi duplicada ou não foi atualizada para R$ 210,00.');

  console.log('PASS: múltiplos Tipos de Diária, refeição única, snapshot histórico, fechamento semanal e obrigação única validados no Supabase remoto.');
} finally {
  await cleanup();
}
