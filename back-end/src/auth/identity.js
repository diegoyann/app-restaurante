import { supabaseAdmin } from '../lib/supabaseAdmin.js';

function getBearerToken(req) {
  const authorization = String(req.headers?.authorization || '');
  const [scheme, token] = authorization.split(' ');

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return '';
  }

  return token.trim();
}

export async function resolveIdentity(req) {
  const token = getBearerToken(req);

  if (!token) {
    const error = new Error('Token ausente.');
    error.statusCode = 401;
    throw error;
  }

  const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !userData?.user) {
    const error = new Error('Sessão inválida ou expirada.');
    error.statusCode = 401;
    throw error;
  }

  const user = userData.user;
  const { data: memberships, error: membershipError } = await supabaseAdmin
    .from('tenant_memberships')
    .select(`
      id,
      tenant_id,
      role,
      tenants:tenant_id (
        id,
        slug,
        name,
        business_name,
        status
      )
    `)
    .eq('user_id', user.id);

  if (membershipError) {
    throw membershipError;
  }

  const normalizedMemberships = (memberships || []).map((membership) => ({
    id: membership.id,
    tenantId: membership.tenant_id,
    role: membership.role,
    tenant: membership.tenants
      ? {
          id: membership.tenants.id,
          slug: membership.tenants.slug,
          name: membership.tenants.name,
          businessName: membership.tenants.business_name,
          status: membership.tenants.status
        }
      : null
  }));

  return {
    token,
    user: {
      id: user.id,
      email: user.email || '',
      metadata: user.user_metadata || {},
      appMetadata: user.app_metadata || {}
    },
    memberships: normalizedMemberships,
    isSuperAdmin: normalizedMemberships.some((membership) => membership.role === 'super_admin')
  };
}

export function requireRole(identity, allowedRoles) {
  if (identity.isSuperAdmin && allowedRoles.includes('super_admin')) {
    return true;
  }

  const hasRole = identity.memberships.some((membership) => allowedRoles.includes(membership.role));

  if (!hasRole) {
    const error = new Error('Acesso negado para este recurso.');
    error.statusCode = 403;
    throw error;
  }

  return true;
}

export function requireTenantAccess(identity, tenantSlug, allowedRoles = ['tenant_admin', 'tenant_staff']) {
  if (identity.isSuperAdmin) {
    return {
      tenantSlug,
      membership: null
    };
  }

  const membership = identity.memberships.find(
    (item) => item.tenant?.slug === tenantSlug && allowedRoles.includes(item.role)
  );

  if (!membership) {
    const error = new Error('Você não tem acesso a este tenant.');
    error.statusCode = 403;
    throw error;
  }

  return {
    tenantSlug,
    membership
  };
}
