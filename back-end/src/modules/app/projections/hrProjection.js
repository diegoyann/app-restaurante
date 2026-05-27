import { ensureOk, maybeSingle, supabaseAdmin } from '../../shared/db.js';
import { mapEmployee, mapSimpleName } from '../../shared/mappers.js';

export const DEFAULT_PAYROLL_CONFIG = {
  salaryPercentage: 60,
  salaryBusinessDayOrdinal: 5,
  advancePercentage: 40,
  advanceFixedDay: 20,
  advanceBusinessDayPolicy: 'next',
  holidayDates: []
};

export function mapPayrollConfig(row) {
  if (!row) return { ...DEFAULT_PAYROLL_CONFIG };

  return {
    salaryPercentage: Number(row.salary_percentage || 0),
    salaryBusinessDayOrdinal: row.salary_business_day_ordinal,
    advancePercentage: Number(row.advance_percentage || 0),
    advanceFixedDay: row.advance_fixed_day,
    advanceBusinessDayPolicy: row.advance_business_day_policy,
    holidayDates: Array.isArray(row.holiday_dates) ? row.holiday_dates : []
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

export async function readHrProjection(tenant) {
  const [payrollConfig, employees, discountsByEmployee, employeeRoles, discountCategories] = await Promise.all([
    maybeSingle(await supabaseAdmin.from('payroll_configs').select('*').eq('tenant_id', tenant.id).maybeSingle(), 'Falha ao carregar folha.'),
    ensureOk(await supabaseAdmin.from('employees').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: true }), 'Falha ao carregar funcionários.'),
    getDiscountsByEmployee(tenant.id),
    ensureOk(await supabaseAdmin.from('employee_roles').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: true }), 'Falha ao carregar cargos.'),
    ensureOk(await supabaseAdmin.from('discount_categories').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: true }), 'Falha ao carregar categorias de desconto.')
  ]);

  return {
    payrollConfig: mapPayrollConfig(payrollConfig),
    employees: employees.map((row) => ({
      ...mapEmployee(row),
      discounts: discountsByEmployee[row.id] || []
    })),
    employeeRoles: employeeRoles.map(mapSimpleName),
    discountCategories: discountCategories.map(mapSimpleName)
  };
}
