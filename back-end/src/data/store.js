import { createMockDataset } from '../../../shared/mock-data/index.js';

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

const dataset = createMockDataset();

function findTenantIndex(slug) {
  return dataset.tenants.findIndex((tenant) => tenant.slug === slug);
}

export function listTenants() {
  return dataset.tenants.map((tenant) => ({
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    businessName: tenant.businessName
  }));
}

export function findUserByCredentials() {
  return null;
}

export function listUsers() {
  return dataset.users.map((user) => ({
    id: user.id,
    name: user.fullName,
    email: user.email,
    role: user.role,
    tenantSlug: user.tenantSlug
  }));
}

export function getTenant(slug) {
  return dataset.tenants.find((tenant) => tenant.slug === slug) || null;
}

export function assertTenant(slug) {
  const tenant = getTenant(slug);

  if (!tenant) {
    throw new Error('Tenant não encontrado.');
  }

  return tenant;
}

export function getTenantData(slug) {
  return clone(assertTenant(slug).bootstrap);
}

export function buildTenantBootstrap(slug) {
  const tenant = assertTenant(slug);

  return {
    tenant: {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      businessName: tenant.businessName
    },
    ...clone(tenant.bootstrap)
  };
}

export function buildAdminTenantSnapshot(slug) {
  const tenant = assertTenant(slug);
  const users = dataset.users.filter((user) => user.tenantSlug === slug);
  const bootstrap = clone(tenant.bootstrap);

  return {
    tenant: {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      businessName: tenant.businessName
    },
    summary: {
      users: users.length,
      employees: bootstrap.employees.length,
      salesChannels: bootstrap.salesChannels.length,
      recurringCosts: bootstrap.recurringCosts.length,
      transactions: bootstrap.transactions.length
    },
    users: users.map((user) => ({
      id: user.id,
      name: user.fullName,
      email: user.email,
      role: user.role,
      tenantSlug: user.tenantSlug
    })),
    data: bootstrap
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
  tenant.bootstrap[section] = clone(value);
  return clone(tenant.bootstrap[section]);
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

  if (getTenant(normalizedSlug)) {
    throw new Error('Já existe um tenant com esse slug.');
  }

  const template = clone(dataset.tenants[0]?.bootstrap || {});
  const tenant = {
    id: createId('ten'),
    slug: normalizedSlug,
    name: normalizedName,
    businessName: normalizedName,
    bootstrap: {
      aiBehaviorSettings: template.aiBehaviorSettings || null,
      payrollConfig: template.payrollConfig || null,
      employeeRoles: [],
      discountCategories: [],
      employees: [],
      ingredients: [],
      ingredientUnits: [],
      preparations: [],
      products: [],
      menuCategories: [],
      menuItems: [],
      recurringCosts: [],
      salesChannels: [],
      financeExpenseCategories: [],
      transactions: [],
      customers: [],
      paymentMethods: [],
      orders: [],
      deliveryDrivers: [],
      financialClosings: [],
      reviews: [],
      settings: {
        ...template.settings,
        businessName: normalizedName
      }
    }
  };

  dataset.tenants.push(tenant);
  return clone(tenant);
}

export function updateTenantMeta(slug, payload) {
  const tenant = assertTenant(slug);
  const nextName = String(payload.name || tenant.name).trim();
  const nextBusinessName = String(payload.businessName || tenant.businessName || nextName).trim();

  if (!nextName) {
    throw new Error('Nome do tenant é obrigatório.');
  }

  tenant.name = nextName;
  tenant.businessName = nextBusinessName;
  tenant.bootstrap.settings = {
    ...tenant.bootstrap.settings,
    businessName: nextBusinessName
  };

  return clone(tenant);
}

export function deleteTenant(slug) {
  const tenant = assertTenant(slug);
  const tenantIndex = findTenantIndex(slug);

  dataset.tenants.splice(tenantIndex, 1);

  const remainingUsers = dataset.users.filter((user) => user.tenantSlug !== slug);
  dataset.users.splice(0, dataset.users.length, ...remainingUsers);

  return clone({
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name
  });
}

export function appendTransaction(slug, transaction) {
  const tenant = assertTenant(slug);
  const nextTransaction = {
    id: Date.now(),
    ...clone(transaction)
  };

  tenant.bootstrap.transactions = [nextTransaction, ...tenant.bootstrap.transactions];
  return clone(nextTransaction);
}

export function appendRecurringCost(slug, recurringCost) {
  const tenant = assertTenant(slug);
  const nextRecurringCost = {
    id: Date.now(),
    ...clone(recurringCost)
  };

  tenant.bootstrap.recurringCosts = [nextRecurringCost, ...tenant.bootstrap.recurringCosts];
  return clone(nextRecurringCost);
}

export function updateRecurringCost(slug, recurringCostId, patch) {
  const tenant = assertTenant(slug);
  let updatedCost = null;

  tenant.bootstrap.recurringCosts = tenant.bootstrap.recurringCosts.map((cost) => {
    if (String(cost.id) !== String(recurringCostId)) {
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
    tenant.bootstrap.employees = [...tenant.bootstrap.employees, normalized];
    return clone(normalized);
  }

  tenant.bootstrap.employees = tenant.bootstrap.employees.map((current) =>
    current.id === normalized.id ? normalized : current
  );

  return clone(normalized);
}

export function deleteEmployee(slug, employeeId) {
  const tenant = assertTenant(slug);
  const currentSize = tenant.bootstrap.employees.length;

  tenant.bootstrap.employees = tenant.bootstrap.employees.filter(
    (employee) => String(employee.id) !== String(employeeId)
  );

  if (tenant.bootstrap.employees.length === currentSize) {
    throw new Error('Funcionário não encontrado.');
  }

  return true;
}

export function upsertTenantUser(slug, payload) {
  assertTenant(slug);

  const normalizedName = String(payload.name || '').trim();
  const normalizedEmail = String(payload.email || '').trim().toLowerCase();
  const normalizedRole = payload.role === 'tenant_staff' ? 'tenant_staff' : 'tenant_admin';

  if (!normalizedName) {
    throw new Error('Nome do usuário é obrigatório.');
  }

  if (!normalizedEmail) {
    throw new Error('E-mail do usuário é obrigatório.');
  }

  const currentUserId = payload.id ? String(payload.id) : null;
  const duplicatedEmail = dataset.users.find(
    (user) => user.email.toLowerCase() === normalizedEmail && user.id !== currentUserId
  );

  if (duplicatedEmail) {
    throw new Error('Já existe um usuário com esse e-mail.');
  }

  if (payload.id) {
    let updatedUser = null;

    dataset.users.forEach((user, index) => {
      if (user.id !== currentUserId) return;

      updatedUser = {
        ...user,
        email: normalizedEmail,
        fullName: normalizedName,
        role: normalizedRole,
        tenantSlug: slug
      };

      dataset.users[index] = updatedUser;
    });

    if (!updatedUser) {
      throw new Error('Usuário não encontrado.');
    }

    return clone(updatedUser);
  }

  const createdUser = {
    id: createId('usr'),
    email: normalizedEmail,
    fullName: normalizedName,
    role: normalizedRole,
    tenantSlug: slug
  };

  dataset.users.push(createdUser);
  return clone(createdUser);
}

export function deleteTenantUser(slug, userId) {
  assertTenant(slug);

  const currentSize = dataset.users.length;
  const remainingUsers = dataset.users.filter(
    (user) => !(user.id === String(userId) && user.tenantSlug === slug)
  );

  dataset.users.splice(0, dataset.users.length, ...remainingUsers);

  if (dataset.users.length === currentSize) {
    throw new Error('Usuário não encontrado.');
  }

  return true;
}

export function replacePayrollSettings(slug, settings) {
  return updateTenantSection(slug, 'payrollConfig', settings);
}

export function ensureEmployeeIds(slug) {
  const tenant = assertTenant(slug);

  tenant.bootstrap.employees = tenant.bootstrap.employees.map((employee) => ({
    ...employee,
    id: employee.id || createId('emp')
  }));
}
