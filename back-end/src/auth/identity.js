import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { getEffectivePermissionsForIdentity } from '../modules/auth/index.js';

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
      company_id,
      role,
      role_profile_id,
      tenants:tenant_id (
        id,
        slug,
        name,
        business_name,
        company_id,
        status
      ),
      companies:company_id (
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
    companyId: membership.company_id,
    role: membership.role,
    roleProfileId: membership.role_profile_id || '',
    tenant: membership.tenants
      ? {
          id: membership.tenants.id,
          slug: membership.tenants.slug,
          name: membership.tenants.name,
          businessName: membership.tenants.business_name,
          companyId: membership.tenants.company_id,
          status: membership.tenants.status
        }
      : null,
    company: membership.companies
      ? {
          id: membership.companies.id,
          slug: membership.companies.slug,
          name: membership.companies.name,
          businessName: membership.companies.business_name,
          status: membership.companies.status
        }
      : null
  }));

  const companyAdminIds = [
    ...new Set(
      normalizedMemberships
        .filter((membership) => membership.role === 'tenant_admin' && membership.companyId)
        .map((membership) => membership.companyId)
    )
  ];

  const companyBranchesResult = companyAdminIds.length === 0
    ? { data: [], error: null }
    : await supabaseAdmin
        .from('tenants')
        .select('id, slug, name, business_name, company_id, status')
        .in('company_id', companyAdminIds);

  if (companyBranchesResult.error) {
    throw companyBranchesResult.error;
  }

  const companyBranches = companyBranchesResult.data || [];

  const accessibleTenantRoles = new Map();

  normalizedMemberships.forEach((membership) => {
    if (membership.tenant?.slug) {
      accessibleTenantRoles.set(membership.tenant.slug, membership.role);
    }
  });

  companyBranches.forEach((tenant) => {
    accessibleTenantRoles.set(tenant.slug, 'tenant_admin');
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email || '',
      metadata: user.user_metadata || {},
      appMetadata: user.app_metadata || {}
    },
    memberships: normalizedMemberships,
    accessibleTenants: [...accessibleTenantRoles.entries()].map(([slug, role]) => ({
      slug,
      role
    })),
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

  const accessibleTenant = (identity.accessibleTenants || []).find(
    (item) => item.slug === tenantSlug && allowedRoles.includes(item.role)
  );

  if (accessibleTenant) {
    return {
      tenantSlug,
      membership: accessibleTenant
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

export async function requireTenantPermission(identity, tenantSlug, permissionKey) {
  const access = requireTenantAccess(identity, tenantSlug, ['tenant_admin', 'tenant_staff']);

  if (identity.isSuperAdmin) {
    return access;
  }

  const permissions = await getEffectivePermissionsForIdentity(identity, tenantSlug);
  if (!permissions[permissionKey]) {
    const error = new Error('Você não tem permissão para este recurso.');
    error.statusCode = 403;
    throw error;
  }

  return access;
}

export async function requireAnyTenantPermission(identity, tenantSlug, permissionKeys = []) {
  const access = requireTenantAccess(identity, tenantSlug, ['tenant_admin', 'tenant_staff']);
  if (identity.isSuperAdmin) return access;
  const permissions = await getEffectivePermissionsForIdentity(identity, tenantSlug);
  if (!permissionKeys.some((key) => permissions[key])) {
    const error = new Error('Você não tem permissão para este recurso.');
    error.statusCode = 403;
    throw error;
  }
  return access;
}
