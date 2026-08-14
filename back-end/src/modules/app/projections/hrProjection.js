import { ensureOk, maybeSingle, supabaseAdmin } from '../../shared/db.js';
import { mapEmployee, mapSimpleName } from '../../shared/mappers.js';

export const DEFAULT_PAYROLL_CONFIG = {
  salaryPercentage: 60,
  salaryBusinessDayOrdinal: 5,
  advancePercentage: 40,
  advanceFixedDay: 20,
  advanceBusinessDayPolicy: 'next',
  holidayDates: [],
  mealCostPerWorkday: 15,
  extraKitchenDailyRate: 70,
  extraMotoboyDailyRate: 60
};

export function mapPayrollConfig(row) {
  if (!row) return { ...DEFAULT_PAYROLL_CONFIG };

  return {
    salaryPercentage: Number(row.salary_percentage || 0),
    salaryBusinessDayOrdinal: row.salary_business_day_ordinal,
    advancePercentage: Number(row.advance_percentage || 0),
    advanceFixedDay: row.advance_fixed_day,
    advanceBusinessDayPolicy: row.advance_business_day_policy,
    holidayDates: Array.isArray(row.holiday_dates) ? row.holiday_dates : [],
    mealCostPerWorkday: Number(row.meal_cost_per_workday || 15),
    extraKitchenDailyRate: Number(row.extra_kitchen_daily_rate || 70),
    extraMotoboyDailyRate: Number(row.extra_motoboy_daily_rate || 60)
  };
}

async function getDiscountsByEmployee(tenantId) {
  const rows = ensureOk(
    await supabaseAdmin
      .from('employee_discounts')
      .select('*')
      .eq('tenant_id', tenantId),
    'Falha ao carregar descontos de funcionários.'
  );

  return rows.reduce((acc, row) => {
    const employeeId = row.employee_id;
    if (!acc[employeeId]) acc[employeeId] = [];
    acc[employeeId].push({
      id: row.id,
      category: row.category,
      amount: Number(row.amount || 0)
    });
    return acc;
  }, {});
}

function mapDailyRateType(row) {
  return {
    id: row.id,
    name: row.name,
    amount: Number(row.amount || 0),
    appliesWeekdays: Boolean(row.applies_weekdays),
    appliesWeekends: Boolean(row.applies_weekends),
    active: row.active !== false
  };
}

function mapRateTypeSnapshot(row) {
  return {
    id: row.id,
    dailyRateTypeId: row.daily_rate_type_id || '',
    typeName: row.type_name,
    amountSnapshot: Number(row.amount_snapshot || 0)
  };
}

function mapWorkLog(row, rateTypes = []) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    workDate: row.work_date,
    worked: Boolean(row.worked),
    dailyRate: Number(row.daily_rate || 0),
    mealCost: Number(row.meal_cost || 0),
    deliveryFee: Number(row.delivery_fee || 0),
    note: row.note || '',
    rateTypes
  };
}

function mapWeeklyClosing(row) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    totalDailyRates: Number(row.total_daily_rates || 0),
    totalDeliveryFees: Number(row.total_delivery_fees || 0),
    totalPayment: Number(row.total_payment || 0),
    expectedPaymentDate: row.expected_payment_date,
    paidAmount: Number(row.paid_amount || 0),
    paidAt: row.paid_at || '',
    status: row.status,
    note: row.note || ''
  };
}

export async function readHrProjection(tenant) {
  const [payrollConfig, employees, discountsByEmployee, employeeRoles, discountCategories, workLogs, weeklyClosings, dailyRateTypes, workLogRateTypes, scheduledDaysOff, payrollAdjustments] = await Promise.all([
    maybeSingle(await supabaseAdmin.from('payroll_configs').select('*').eq('tenant_id', tenant.id).maybeSingle(), 'Falha ao carregar folha.'),
    ensureOk(await supabaseAdmin.from('employees').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: true }), 'Falha ao carregar funcionários.'),
    getDiscountsByEmployee(tenant.id),
    ensureOk(await supabaseAdmin.from('employee_roles').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: true }), 'Falha ao carregar cargos.'),
    ensureOk(await supabaseAdmin.from('discount_categories').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: true }), 'Falha ao carregar categorias de desconto.'),
    ensureOk(await supabaseAdmin.from('employee_work_logs').select('*').eq('tenant_id', tenant.id).order('work_date', { ascending: false }), 'Falha ao carregar conferências de trabalho.'),
    ensureOk(await supabaseAdmin.from('extra_weekly_closings').select('*').eq('tenant_id', tenant.id).order('period_start', { ascending: false }), 'Falha ao carregar fechamentos de extras.'),
    ensureOk(await supabaseAdmin.from('employee_daily_rate_types').select('*').eq('tenant_id', tenant.id).eq('active', true).order('created_at'), 'Falha ao carregar Tipos de Diária.'),
    ensureOk(await supabaseAdmin.from('employee_work_log_rate_types').select('*').eq('tenant_id', tenant.id).order('created_at'), 'Falha ao carregar snapshots de diária.'),
    ensureOk(await supabaseAdmin.from('employee_scheduled_days_off').select('*').eq('tenant_id', tenant.id).order('created_at'), 'Falha ao carregar folgas programadas.'),
    ensureOk(await supabaseAdmin.from('payroll_adjustments').select('*').eq('tenant_id', tenant.id).order('adjustment_date', { ascending: false }), 'Falha ao carregar ajustes da folha.')
  ]);

  const rateTypesByEmployee = dailyRateTypes.reduce((groups, row) => {
    (groups[row.employee_id] ||= []).push(mapDailyRateType(row));
    return groups;
  }, {});
  const rateTypesByWorkLog = workLogRateTypes.reduce((groups, row) => {
    (groups[row.work_log_id] ||= []).push(mapRateTypeSnapshot(row));
    return groups;
  }, {});
  const daysOffByEmployee = scheduledDaysOff.reduce((groups, row) => {
    (groups[row.employee_id] ||= []).push({
      id: row.id,
      employeeId: row.employee_id,
      kind: row.kind,
      weekday: row.weekday,
      offDate: row.off_date || '',
      note: row.note || '',
      active: row.active !== false,
      cancellationReason: row.cancellation_reason || ''
    });
    return groups;
  }, {});

  return {
    payrollConfig: mapPayrollConfig(payrollConfig),
    employees: employees.map((row) => ({
      ...mapEmployee(row, rateTypesByEmployee[row.id] || [], daysOffByEmployee[row.id] || []),
      discounts: discountsByEmployee[row.id] || []
    })),
    employeeRoles: employeeRoles.map(mapSimpleName),
    discountCategories: discountCategories.map(mapSimpleName),
    employeeWorkLogs: workLogs.map((row) => mapWorkLog(row, rateTypesByWorkLog[row.id] || [])),
    extraWeeklyClosings: weeklyClosings.map(mapWeeklyClosing),
    payrollAdjustments: payrollAdjustments.map((row) => ({
      id: row.id,
      employeeId: row.employee_id,
      competenceMonth: row.competence_month,
      adjustmentDate: row.adjustment_date,
      category: row.category,
      description: row.description,
      amount: Number(row.amount || 0),
      note: row.note || '',
      status: row.status,
      cancellationReason: row.cancellation_reason || ''
    }))
  };
}
