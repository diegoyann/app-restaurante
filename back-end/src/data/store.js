function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const baseTenantData = {
  settings: {
    ifoodTax: 23,
    anotaaiTax: 5,
    appPassword: 'admin',
    passwordReminder: 'A senha padrão é "admin".',
    businessName: 'Rei das Esfihas',
    alertDaysBefore: 3
  },
  aiBehaviorSettings: {
    positiveTone: 'friendly',
    crisisStrategy: 'whatsapp',
    additionalInstructions: '',
    autoPublishPositive: true
  },
  payrollConfig: {
    salaryPercentage: 60,
    salaryBusinessDayOrdinal: 5,
    advancePercentage: 40,
    advanceFixedDay: 20,
    advanceBusinessDayPolicy: 'next',
    holidayDates: []
  },
  salesChannels: [
    { id: 1, name: 'ifood' },
    { id: 2, name: 'anotaai' }
  ],
  financeExpenseCategories: [
    { id: 1, name: 'Compra de Insumos' },
    { id: 2, name: 'Fornecedor' },
    { id: 3, name: 'Manutenção' },
    { id: 4, name: 'Marketing' },
    { id: 5, name: 'Imposto' },
    { id: 6, name: 'Retirada' },
    { id: 7, name: 'Outras Saídas' }
  ],
  recurringCosts: [
    { id: 1, desc: 'Aluguel', amount: 3000, dueDay: 10, lastPaidMonth: '' },
    { id: 2, desc: 'Energia Elétrica', amount: 850, dueDay: 15, lastPaidMonth: '' }
  ],
  employees: [
    {
      id: 1,
      name: 'João da Massa',
      phone: '',
      email: '',
      address: '',
      maritalStatus: '',
      role: 'Esfiharia',
      notes: '',
      employmentType: 'fixed',
      status: 'active',
      salary: 2200,
      admissionDate: '',
      discounts: [{ id: 1, category: 'Falta', amount: 0 }]
    },
    {
      id: 2,
      name: 'Maria do Balcão',
      phone: '',
      email: '',
      address: '',
      maritalStatus: '',
      role: 'Atendimento',
      notes: '',
      employmentType: 'fixed',
      status: 'active',
      salary: 1800,
      admissionDate: '',
      discounts: [{ id: 1, category: 'Outros', amount: 0 }]
    },
    {
      id: 3,
      name: 'Carlos da Fornalha',
      phone: '',
      email: '',
      address: '',
      maritalStatus: '',
      role: 'Pizzaiolo',
      notes: 'Prestador semanal',
      employmentType: 'external',
      status: 'active',
      paymentMode: 'weekly',
      baseAmount: 450,
      weekday: '5',
      specificDate: '',
      startDate: ''
    }
  ],
  transactions: [
    { id: 1, date: '2024-04-09', platform: 'ifood', payment: 'online', amount: 1200, tax: 23, net: 924, type: 'receita', category: 'ifood', note: 'Pedidos iFood' },
    { id: 2, date: '2024-04-09', platform: 'anotaai', payment: 'pix', amount: 650, tax: 5, net: 617.5, type: 'receita', category: 'anotaai', note: 'Pedidos Anota AI' },
    { id: 3, date: '2024-04-09', platform: 'despesa', payment: 'pix', amount: 180, tax: 0, net: -180, type: 'despesa', category: 'Compra de Insumos', note: 'Reposição de hortifruti' }
  ]
};

function createTenantData(overrides = {}) {
  return {
    ...clone(baseTenantData),
    ...clone(overrides),
    settings: {
      ...clone(baseTenantData.settings),
      ...(overrides.settings ? clone(overrides.settings) : {})
    },
    aiBehaviorSettings: {
      ...clone(baseTenantData.aiBehaviorSettings),
      ...(overrides.aiBehaviorSettings ? clone(overrides.aiBehaviorSettings) : {})
    },
    payrollConfig: {
      ...clone(baseTenantData.payrollConfig),
      ...(overrides.payrollConfig ? clone(overrides.payrollConfig) : {})
    }
  };
}

function createTenantRecord({ slug, name, data = {} }) {
  return {
    id: createId('ten'),
    slug,
    name,
    data: createTenantData({
      ...data,
      settings: {
        businessName: name,
        ...(data.settings || {})
      }
    })
  };
}

export const db = {
  users: [
    {
      id: 'usr_super_admin',
      name: 'Administrador Global',
      email: 'admin@gestaofood.com.br',
      password: 'admin123',
      role: 'super_admin',
      tenantSlug: null
    },
    {
      id: 'usr_rei',
      name: 'Rei das Esfihas',
      email: 'rei@reidasesfihas.com',
      password: 'admin',
      role: 'tenant_admin',
      tenantSlug: 'reidasesfihas'
    },
    {
      id: 'usr_demo',
      name: 'Demo Restaurante',
      email: 'demo@gestaofood.com.br',
      password: 'demo',
      role: 'tenant_admin',
      tenantSlug: 'demo'
    },
    {
      id: 'usr_express',
      name: 'Esfiharia Express',
      email: 'admin@express.com',
      password: 'admin',
      role: 'tenant_admin',
      tenantSlug: 'esfiharia-express'
    }
  ],
  tenants: {
    reidasesfihas: createTenantRecord({
      slug: 'reidasesfihas',
      name: 'Rei das Esfihas'
    }),
    demo: createTenantRecord({
      slug: 'demo',
      name: 'Demo Restaurante'
    }),
    'esfiharia-express': createTenantRecord({
      slug: 'esfiharia-express',
      name: 'Esfiharia Express'
    })
  }
};

export function listTenants() {
  return Object.values(db.tenants).map((tenant) => ({
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name
  }));
}

export function findUserByCredentials(email, password) {
  return db.users.find(
    (user) =>
      user.email.toLowerCase() === String(email || '').trim().toLowerCase() &&
      user.password === password
  );
}

export function listUsers() {
  return db.users.map((user) => clone(user));
}

export function getTenant(slug) {
  return db.tenants[slug] || null;
}

export function assertTenant(slug) {
  const tenant = getTenant(slug);

  if (!tenant) {
    throw new Error('Tenant não encontrado.');
  }

  return tenant;
}

export function getTenantData(slug) {
  return assertTenant(slug).data;
}

export function buildTenantBootstrap(slug) {
  const tenant = assertTenant(slug);

  return {
    tenant: {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name
    },
    ...clone(tenant.data)
  };
}

export function buildAdminTenantSnapshot(slug) {
  const tenant = assertTenant(slug);
  const users = db.users.filter((user) => user.tenantSlug === slug);
  const tenantData = clone(tenant.data);

  return {
    tenant: {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name
    },
    summary: {
      users: users.length,
      employees: tenantData.employees.length,
      salesChannels: tenantData.salesChannels.length,
      recurringCosts: tenantData.recurringCosts.length,
      transactions: tenantData.transactions.length
    },
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantSlug: user.tenantSlug
    })),
    data: tenantData
  };
}

export function buildAdminBootstrap(selectedTenantSlug = '') {
  const tenants = listTenants();
  const resolvedTenantSlug = selectedTenantSlug || tenants[0]?.slug || '';

  return {
    availableTenants: tenants,
    selectedTenantSlug: resolvedTenantSlug,
    selectedTenant: resolvedTenantSlug ? buildAdminTenantSnapshot(resolvedTenantSlug) : null
  };
}

export function updateTenantSection(slug, section, value) {
  const tenant = assertTenant(slug);
  tenant.data[section] = clone(value);
  return clone(tenant.data[section]);
}

export function createTenant({ name, slug }) {
  const normalizedName = String(name || '').trim();
  const normalizedSlug = slugify(slug || normalizedName);

  if (!normalizedName) {
    throw new Error('Nome do tenant é obrigatório.');
  }

  if (!normalizedSlug) {
    throw new Error('Slug do tenant é obrigatório.');
  }

  if (db.tenants[normalizedSlug]) {
    throw new Error('Já existe um tenant com esse slug.');
  }

  const tenant = createTenantRecord({
    slug: normalizedSlug,
    name: normalizedName
  });

  db.tenants[normalizedSlug] = tenant;
  return clone(tenant);
}

export function updateTenantMeta(slug, payload) {
  const tenant = assertTenant(slug);
  const nextName = String(payload.name || tenant.name).trim();

  if (!nextName) {
    throw new Error('Nome do tenant é obrigatório.');
  }

  tenant.name = nextName;
  tenant.data.settings.businessName = String(
    payload.businessName || tenant.data.settings.businessName || nextName
  ).trim();

  return clone(tenant);
}

export function deleteTenant(slug) {
  const tenant = assertTenant(slug);

  delete db.tenants[slug];
  db.users = db.users.filter((user) => user.tenantSlug !== slug);

  return clone({
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name
  });
}

export function appendTransaction(slug, transaction) {
  const tenant = assertTenant(slug);
  const newTransaction = {
    id: Date.now(),
    ...clone(transaction)
  };

  tenant.data.transactions = [newTransaction, ...tenant.data.transactions];
  return clone(newTransaction);
}

export function appendRecurringCost(slug, recurringCost) {
  const tenant = assertTenant(slug);
  const newRecurringCost = {
    id: Date.now(),
    ...clone(recurringCost)
  };

  tenant.data.recurringCosts = [newRecurringCost, ...tenant.data.recurringCosts];
  return clone(newRecurringCost);
}

export function updateRecurringCost(slug, recurringCostId, patch) {
  const tenant = assertTenant(slug);
  const targetId = Number(recurringCostId);
  let updatedCost = null;

  tenant.data.recurringCosts = tenant.data.recurringCosts.map((cost) => {
    if (cost.id !== targetId) {
      return cost;
    }

    updatedCost = {
      ...cost,
      ...clone(patch)
    };

    return updatedCost;
  });

  if (!updatedCost) {
    throw new Error('Custo fixo não encontrado.');
  }

  return clone(updatedCost);
}

export function upsertEmployee(slug, employee) {
  const tenant = assertTenant(slug);
  const normalized = clone(employee);

  if (!normalized.id) {
    normalized.id = Date.now();
    tenant.data.employees = [...tenant.data.employees, normalized];
    return clone(normalized);
  }

  tenant.data.employees = tenant.data.employees.map((current) =>
    current.id === normalized.id ? normalized : current
  );

  return clone(normalized);
}

export function deleteEmployee(slug, employeeId) {
  const tenant = assertTenant(slug);
  const targetId = Number(employeeId);
  const currentSize = tenant.data.employees.length;

  tenant.data.employees = tenant.data.employees.filter((employee) => employee.id !== targetId);

  if (tenant.data.employees.length === currentSize) {
    throw new Error('Funcionário não encontrado.');
  }

  return true;
}

export function upsertTenantUser(slug, payload) {
  assertTenant(slug);

  const normalizedName = String(payload.name || '').trim();
  const normalizedEmail = String(payload.email || '').trim().toLowerCase();
  const normalizedPassword = String(payload.password || '').trim();
  const normalizedRole = payload.role === 'tenant_staff' ? 'tenant_staff' : 'tenant_admin';

  if (!normalizedName) {
    throw new Error('Nome do usuário é obrigatório.');
  }

  if (!normalizedEmail) {
    throw new Error('E-mail do usuário é obrigatório.');
  }

  const currentUserId = payload.id ? String(payload.id) : null;
  const duplicatedEmail = db.users.find(
    (user) => user.email.toLowerCase() === normalizedEmail && user.id !== currentUserId
  );

  if (duplicatedEmail) {
    throw new Error('Já existe um usuário com esse e-mail.');
  }

  if (!payload.id && normalizedPassword.length < 4) {
    throw new Error('Senha deve ter pelo menos 4 caracteres.');
  }

  if (payload.id) {
    let updatedUser = null;

    db.users = db.users.map((user) => {
      if (user.id !== currentUserId) {
        return user;
      }

      updatedUser = {
        ...user,
        name: normalizedName,
        email: normalizedEmail,
        role: normalizedRole,
        tenantSlug: slug,
        password: normalizedPassword ? normalizedPassword : user.password
      };

      return updatedUser;
    });

    if (!updatedUser) {
      throw new Error('Usuário não encontrado.');
    }

    return clone(updatedUser);
  }

  const createdUser = {
    id: createId('usr'),
    name: normalizedName,
    email: normalizedEmail,
    password: normalizedPassword,
    role: normalizedRole,
    tenantSlug: slug
  };

  db.users.push(createdUser);
  return clone(createdUser);
}

export function deleteTenantUser(slug, userId) {
  assertTenant(slug);

  const currentSize = db.users.length;
  db.users = db.users.filter((user) => !(user.id === String(userId) && user.tenantSlug === slug));

  if (db.users.length === currentSize) {
    throw new Error('Usuário não encontrado.');
  }

  return true;
}

export function replacePayrollSettings(slug, settings) {
  return updateTenantSection(slug, 'payrollConfig', settings);
}

export function ensureEmployeeIds(slug) {
  const tenant = assertTenant(slug);

  tenant.data.employees = tenant.data.employees.map((employee) => ({
    ...employee,
    id: employee.id || createId('emp')
  }));
}
