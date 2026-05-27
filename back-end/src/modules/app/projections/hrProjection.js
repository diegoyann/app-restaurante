import { ensureOk, maybeSingle, supabaseAdmin } from '../../shared/db.js';
import { mapEmployee, mapSimpleName } from '../../shared/mappers.js';

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
    payrollConfig: payrollConfig
      ? {
          salaryPercentage: Number(payrollConfig.salary_percentage || 0),
          salaryBusinessDayOrdinal: payrollConfig.salary_business_day_ordinal,
          advancePercentage: Number(payrollConfig.advance_percentage || 0),
          advanceFixedDay: payrollConfig.advance_fixed_day,
          advanceBusinessDayPolicy: payrollConfig.advance_business_day_policy,
          holidayDates: Array.isArray(payrollConfig.holiday_dates) ? payrollConfig.holiday_dates : []
        }
      : null,
    employees: employees.map((row) => ({
      ...mapEmployee(row),
      discounts: discountsByEmployee[row.id] || []
    })),
    employeeRoles: employeeRoles.map(mapSimpleName),
    discountCategories: discountCategories.map(mapSimpleName)
  };
}
