export const PERMISSIONS = [
  { key: 'dashboard.view', defaultAdmin: true, defaultStaff: true },
  { key: 'dashboard.cards.revenue', defaultAdmin: true, defaultStaff: true },
  { key: 'dashboard.cards.orders', defaultAdmin: true, defaultStaff: true },
  { key: 'dashboard.cards.ticket', defaultAdmin: true, defaultStaff: false },
  { key: 'dashboard.cards.cmv', defaultAdmin: true, defaultStaff: false },
  { key: 'dashboard.cards.markup', defaultAdmin: true, defaultStaff: false },
  { key: 'dashboard.cards.fixedCosts', defaultAdmin: true, defaultStaff: false },
  { key: 'menu.view', defaultAdmin: true, defaultStaff: true },
  { key: 'reviews.view', defaultAdmin: true, defaultStaff: true },
  { key: 'cmv.view', defaultAdmin: true, defaultStaff: false },
  { key: 'finance.transactions.view', defaultAdmin: true, defaultStaff: false },
  { key: 'finance.closing.view', defaultAdmin: true, defaultStaff: false },
  { key: 'integrations.ifood.manage', defaultAdmin: true, defaultStaff: false },
  { key: 'people.hr.view', defaultAdmin: true, defaultStaff: false },
  { key: 'settings.general.view', defaultAdmin: true, defaultStaff: false },
  { key: 'system.permissions.manage', defaultAdmin: true, defaultStaff: false }
];

export const ALL_PERMISSION_KEYS = PERMISSIONS.map((permission) => permission.key);

export function defaultPermissionMap(baseRole = 'tenant_staff') {
  return Object.fromEntries(
    PERMISSIONS.map((permission) => [
      permission.key,
      baseRole === 'tenant_admin' ? permission.defaultAdmin : permission.defaultStaff
    ])
  );
}

export function normalizePermissionMap(value, baseRole = 'tenant_staff') {
  const defaults = defaultPermissionMap(baseRole);
  return Object.fromEntries(
    PERMISSIONS.map((permission) => [
      permission.key,
      typeof value?.[permission.key] === 'boolean' ? value[permission.key] : defaults[permission.key]
    ])
  );
}
