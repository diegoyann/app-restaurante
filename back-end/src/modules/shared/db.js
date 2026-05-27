import { supabaseAdmin } from '../../lib/supabaseAdmin.js';

export { supabaseAdmin };

export function ensureOk(result, fallbackMessage) {
  if (result.error) {
    const error = new Error(result.error.message || fallbackMessage);
    error.statusCode = result.status || 500;
    throw error;
  }

  return result.data;
}

export function maybeSingle(result, fallbackMessage) {
  if (result.error && result.status !== 406) {
    const error = new Error(result.error.message || fallbackMessage);
    error.statusCode = result.status || 500;
    throw error;
  }

  return result.data || null;
}

export async function getTenantRowBySlug(slug) {
  const tenant = maybeSingle(
    await supabaseAdmin
      .from('tenants')
      .select(`
        id,
        slug,
        name,
        business_name,
        company_id,
        branch_code,
        branch_name,
        is_headquarters,
        status,
        companies:company_id (
          id,
          slug,
          name,
          business_name,
          legal_name,
          cnpj,
          address_line,
          status
        )
      `)
      .eq('slug', slug)
      .maybeSingle(),
    'Falha ao carregar tenant.'
  );

  if (!tenant) {
    const error = new Error('Tenant não encontrado.');
    error.statusCode = 404;
    throw error;
  }

  return tenant;
}

export function sanitizeJsonArray(value) {
  return Array.isArray(value) ? value : [];
}

export function normalizeMoney(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}
