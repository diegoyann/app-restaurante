export function normalizeSessionPayload(payload) {
  if (!payload || !payload.user) {
    return null;
  }

  const memberships = Array.isArray(payload.memberships) ? payload.memberships : [];

  return {
    user: {
      id: payload.user.id || '',
      email: payload.user.email || '',
      name: payload.user.name || payload.user.email || '',
      role: payload.user.role || 'tenant_staff'
    },
    memberships: memberships.map((membership) => ({
      id: membership.id || '',
      role: membership.role || 'tenant_staff',
      roleProfileId: membership.roleProfileId || '',
      tenant: membership.tenant
        ? {
            id: membership.tenant.id || '',
            slug: membership.tenant.slug || '',
            name: membership.tenant.name || '',
            businessName: membership.tenant.businessName || '',
            status: membership.tenant.status || 'active'
          }
        : null
    })),
    currentTenant: payload.currentTenant
      ? {
          id: payload.currentTenant.id || '',
          slug: payload.currentTenant.slug || '',
          name: payload.currentTenant.name || '',
          businessName: payload.currentTenant.businessName || '',
          status: payload.currentTenant.status || 'active'
        }
      : null
  };
}

export function getAccessibleTenantSlug(session, requestedTenantSlug = '') {
  if (!session?.user) {
    return '';
  }

  const requested = String(requestedTenantSlug || '').trim();
  const memberships = session.memberships || [];

  if (session.user.role === 'super_admin') {
    return requested || session.currentTenant?.slug || memberships.find((membership) => membership.tenant?.slug)?.tenant?.slug || '';
  }

  if (requested && memberships.some((membership) => membership.tenant?.slug === requested)) {
    return requested;
  }

  return session.currentTenant?.slug || memberships.find((membership) => membership.tenant?.slug)?.tenant?.slug || '';
}

export function canAccessTenant(session, tenantSlug) {
  if (!session?.user || !tenantSlug) {
    return false;
  }

  if (session.user.role === 'super_admin') {
    return true;
  }

  return (session.memberships || []).some((membership) => membership.tenant?.slug === tenantSlug);
}

export function resolveSessionDestination(session) {
  if (!session?.user) {
    return '/login';
  }

  if (session.user.role === 'super_admin') {
    return '/admin';
  }

  const tenantSlug = getAccessibleTenantSlug(session);
  return tenantSlug ? `/app/${tenantSlug}` : '/login';
}
