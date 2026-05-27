import { defaultPermissionMap, normalizePermissionMap } from '../../../auth/permissions.js';
import { ensureOk, supabaseAdmin } from '../../shared/db.js';

function mapTenant(tenant) {
  return {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    businessName: tenant.business_name,
    companyId: tenant.company_id,
    branchCode: tenant.branch_code || tenant.slug,
    branchName: tenant.branch_name || tenant.name,
    isHeadquarters: Boolean(tenant.is_headquarters),
    company: tenant.companies
      ? {
          id: tenant.companies.id,
          slug: tenant.companies.slug,
          name: tenant.companies.name,
          businessName: tenant.companies.business_name,
          legalName: tenant.companies.legal_name || tenant.companies.business_name || '',
          cnpj: tenant.companies.cnpj || '',
          address: tenant.companies.address_line || '',
          status: tenant.companies.status
        }
      : null
  };
}

function mapRoleProfile(row, permissionsByProfileId = new Map()) {
  const permissionRows = permissionsByProfileId.get(row.id) || [];
  const permissionMap = Object.fromEntries(permissionRows.map((permission) => [permission.permission_key, Boolean(permission.enabled)]));

  return {
    id: row.id,
    key: row.key,
    name: row.name,
    isSystem: Boolean(row.is_system),
    baseRole: row.base_role,
    permissions: normalizePermissionMap(permissionMap, row.base_role)
  };
}

export async function ensureTenantRoleProfiles(tenant) {
  const defaults = [
    {
      tenant_id: tenant.id,
      key: 'admin',
      name: 'Admin',
      is_system: true,
      base_role: 'tenant_admin'
    },
    {
      tenant_id: tenant.id,
      key: 'staff',
      name: 'Staff',
      is_system: true,
      base_role: 'tenant_staff'
    }
  ];

  ensureOk(
    await supabaseAdmin
      .from('tenant_role_profiles')
      .upsert(defaults, { onConflict: 'tenant_id,key' }),
    'Falha ao garantir perfis padrão.'
  );

  const rows = ensureOk(
    await supabaseAdmin
      .from('tenant_role_profiles')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('is_system', { ascending: false })
      .order('created_at', { ascending: true }),
    'Falha ao carregar perfis de permissões.'
  );

  const existingPermissionRows = rows.length === 0
    ? []
    : ensureOk(
        await supabaseAdmin
          .from('tenant_role_permissions')
          .select('*')
          .in('tenant_role_profile_id', rows.map((row) => row.id)),
        'Falha ao carregar permissões dos perfis.'
      );

  const existingPairs = new Set(existingPermissionRows.map((row) => `${row.tenant_role_profile_id}:${row.permission_key}`));
  const missingPermissionRows = rows.flatMap((row) => {
    const defaultsForRole = defaultPermissionMap(row.base_role);
    return Object.entries(defaultsForRole)
      .filter(([permissionKey]) => !existingPairs.has(`${row.id}:${permissionKey}`))
      .map(([permissionKey, enabled]) => ({
        tenant_role_profile_id: row.id,
        permission_key: permissionKey,
        enabled
      }));
  });

  if (missingPermissionRows.length > 0) {
    ensureOk(
      await supabaseAdmin
        .from('tenant_role_permissions')
        .insert(missingPermissionRows),
      'Falha ao criar permissões padrão.'
    );
  }

  const permissionRows = missingPermissionRows.length === 0
    ? existingPermissionRows
    : ensureOk(
        await supabaseAdmin
          .from('tenant_role_permissions')
          .select('*')
          .in('tenant_role_profile_id', rows.map((row) => row.id)),
        'Falha ao recarregar permissões dos perfis.'
      );
  const permissionsByProfileId = permissionRows.reduce((acc, row) => {
    if (!acc.has(row.tenant_role_profile_id)) acc.set(row.tenant_role_profile_id, []);
    acc.get(row.tenant_role_profile_id).push(row);
    return acc;
  }, new Map());

  return rows.map((row) => mapRoleProfile(row, permissionsByProfileId));
}

export async function readTenantProjection(tenant) {
  return {
    tenant: mapTenant(tenant),
    roleProfiles: await ensureTenantRoleProfiles(tenant)
  };
}
