import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveEffectivePermissionsFromBootstrap } from '../../repositories/appRepository.js';
import { requireTenantAccess } from '../../auth/identity.js';

const tenant = { slug: 'tenant-a', companyId: 'company-a' };
const roleProfiles = [
  { id: 'profile-admin', key: 'admin', baseRole: 'tenant_admin', permissions: { 'finance.transactions.view': true, 'people.hr.view': true } },
  { id: 'profile-staff', key: 'staff', baseRole: 'tenant_staff', permissions: { 'finance.transactions.view': false, 'people.hr.view': false } }
];

test('bootstrap permissions reuse tenant and role profiles while preserving membership precedence', () => {
  const identity = {
    isSuperAdmin: false,
    memberships: [{ tenant: { slug: 'tenant-a' }, companyId: 'company-a', role: 'tenant_staff', roleProfileId: 'profile-admin' }]
  };

  const permissions = resolveEffectivePermissionsFromBootstrap(identity, tenant, roleProfiles);
  assert.equal(permissions['finance.transactions.view'], true);
  assert.equal(permissions['people.hr.view'], true);
});

test('bootstrap permissions preserve company fallback and staff profile fallback', () => {
  const identity = {
    isSuperAdmin: false,
    memberships: [{ companyId: 'company-a', role: 'tenant_staff', roleProfileId: 'unknown' }]
  };

  const permissions = resolveEffectivePermissionsFromBootstrap(identity, tenant, roleProfiles);
  assert.equal(permissions['finance.transactions.view'], false);
  assert.equal(permissions['people.hr.view'], false);
});

test('tenant authorization still rejects cross-tenant identities before bootstrap reuse', () => {
  const identity = {
    isSuperAdmin: false,
    accessibleTenants: [{ slug: 'tenant-b', role: 'tenant_admin' }],
    memberships: []
  };

  assert.throws(
    () => requireTenantAccess(identity, 'tenant-a'),
    (error) => error.statusCode === 403 && /não tem acesso/.test(error.message)
  );
});

test('super admin retains tenant access and administrator permission defaults', () => {
  const identity = { isSuperAdmin: true, accessibleTenants: [], memberships: [] };
  assert.equal(requireTenantAccess(identity, 'tenant-a').tenantSlug, 'tenant-a');
  assert.equal(resolveEffectivePermissionsFromBootstrap(identity, tenant, roleProfiles)['finance.transactions.view'], true);
});
