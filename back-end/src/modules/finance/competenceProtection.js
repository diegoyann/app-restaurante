import { maybeSingle, supabaseAdmin } from '../shared/db.js';

const ISO_MONTH = /^\d{4}-\d{2}$/;

export function assertCompetenceMonth(month) {
  const value = String(month || '');
  if (!ISO_MONTH.test(value)) throw new Error('Competência inválida. Use AAAA-MM.');
  return value;
}

export async function getMonthlyClosing(tenantId, month) {
  const competenceMonth = assertCompetenceMonth(month);
  return maybeSingle(
    await supabaseAdmin
      .from('financial_closings')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('period_type', 'monthly')
      .eq('period_start', `${competenceMonth}-01`)
      .eq('period_end', `${competenceMonth}-${String(new Date(Number(competenceMonth.slice(0, 4)), Number(competenceMonth.slice(5, 7)), 0).getDate()).padStart(2, '0')}`)
      .maybeSingle(),
    'Falha ao verificar o fechamento da competência.',
  );
}

export async function isCompetenceClosed(tenantId, month) {
  return (await getMonthlyClosing(tenantId, month))?.status === 'closed';
}

export async function assertCompetenceOpen(tenantId, month) {
  const competenceMonth = assertCompetenceMonth(month);
  if (await isCompetenceClosed(tenantId, competenceMonth)) {
    const error = new Error(
      `A competência ${competenceMonth} está fechada. Reabra-a explicitamente e informe o motivo antes de alterar o histórico.`,
    );
    error.statusCode = 409;
    throw error;
  }
  return competenceMonth;
}
