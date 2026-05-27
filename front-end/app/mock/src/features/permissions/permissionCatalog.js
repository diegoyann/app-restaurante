export const PERMISSION_CATEGORIES = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'operational', label: 'Operacional' },
  { id: 'finance', label: 'Financeiro' },
  { id: 'people', label: 'Pessoas' },
  { id: 'system', label: 'Sistema' }
];

export const PERMISSIONS = [
  { key: 'dashboard.view', category: 'dashboard', label: 'Ver dashboard', description: 'Acessa a tela inicial do tenant.', defaultAdmin: true, defaultStaff: true },
  { key: 'dashboard.cards.revenue', category: 'dashboard', label: 'Card receita bruta', description: 'Visualiza receita bruta no dashboard.', defaultAdmin: true, defaultStaff: true },
  { key: 'dashboard.cards.orders', category: 'dashboard', label: 'Card pedidos', description: 'Visualiza contagem de pedidos.', defaultAdmin: true, defaultStaff: true },
  { key: 'dashboard.cards.ticket', category: 'dashboard', label: 'Card ticket médio', description: 'Visualiza ticket médio.', defaultAdmin: true, defaultStaff: false },
  { key: 'dashboard.cards.cmv', category: 'dashboard', label: 'Card CMV', description: 'Visualiza métricas de CMV.', defaultAdmin: true, defaultStaff: false },
  { key: 'dashboard.cards.markup', category: 'dashboard', label: 'Card markup', description: 'Visualiza markup médio.', defaultAdmin: true, defaultStaff: false },
  { key: 'dashboard.cards.fixedCosts', category: 'dashboard', label: 'Card custos fixos', description: 'Visualiza custos fixos.', defaultAdmin: true, defaultStaff: false },
  { key: 'menu.view', category: 'operational', label: 'Cardápio operacional', description: 'Acessa cardápio, categorias e itens.', defaultAdmin: true, defaultStaff: true },
  { key: 'reviews.view', category: 'operational', label: 'Avaliações', description: 'Acessa gestão de avaliações.', defaultAdmin: true, defaultStaff: true },
  { key: 'cmv.view', category: 'operational', label: 'CMV / ficha técnica', description: 'Acessa insumos, preparações e produtos.', defaultAdmin: true, defaultStaff: false },
  { key: 'finance.transactions.view', category: 'finance', label: 'Lançamentos', description: 'Acessa lançamentos financeiros.', defaultAdmin: true, defaultStaff: false },
  { key: 'finance.closing.view', category: 'finance', label: 'Fechamento', description: 'Acessa fechamento financeiro.', defaultAdmin: true, defaultStaff: false },
  { key: 'integrations.ifood.manage', category: 'system', label: 'Integração iFood', description: 'Importa e sincroniza pedidos externos do iFood.', defaultAdmin: true, defaultStaff: false },
  { key: 'people.hr.view', category: 'people', label: 'RH / pessoal', description: 'Acessa colaboradores e folha.', defaultAdmin: true, defaultStaff: false },
  { key: 'settings.general.view', category: 'system', label: 'Configurações gerais', description: 'Acessa configurações do tenant.', defaultAdmin: true, defaultStaff: false },
  { key: 'system.permissions.manage', category: 'system', label: 'Perfis e permissões', description: 'Cria perfis e edita permissões.', defaultAdmin: true, defaultStaff: false }
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

export function hasPermission(permissionMap, key) {
  return Boolean(permissionMap?.[key]);
}
