const money = (value) => Math.round(Math.max(Number(value) || 0, 0) * 100) / 100;
const dateBr = (value) => {
  const [year, month, day] = String(value || '').split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
};

export function buildExtraObligationRow(tenantId, closing) {
  const employee = closing.employees || {};
  const isDelivery = /moto|entrega/i.test(String(employee.role || ''));
  return {
    tenant_id: tenantId,
    employee_id: closing.employee_id,
    extra_weekly_closing_id: closing.id,
    description: `${employee.full_name || 'Funcionário extra'} — ${dateBr(closing.period_start)} a ${dateBr(closing.period_end)}`,
    economic_category: 'FOLHA_EXTRA',
    source_type: 'EXTRA',
    source_id: closing.id,
    competence_month: String(closing.period_start).slice(0, 7),
    forecast_type: 'FIXED',
    forecast_amount: money(closing.total_payment),
    final_amount: money(closing.total_payment),
    due_date: closing.expected_payment_date,
    note: isDelivery ? 'Inclui diárias e taxas de entrega.' : 'Extra de cozinha.'
  };
}
