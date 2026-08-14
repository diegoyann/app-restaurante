import { createMockDataset } from "../mocks/sharedMockData.js";
import { getMockAuthUser } from "./mockAuth.js";
import {
  defaultPermissionMap,
  normalizePermissionMap,
} from "../features/permissions/permissionCatalog.js";
import {
  assertIngredientUnitLabel,
  createEmptyAppDataState,
  createDefaultIngredientUnits,
} from "../mocks/appStateDefaults.js";

const clone = (value) => JSON.parse(JSON.stringify(value));

const state = createMockDataset();

state.companies = (() => {
  const companiesById = new Map();

  state.tenants.forEach((tenant) => {
    const companySlug = tenant.companySlug || tenant.slug;
    const companyName =
      tenant.companyName || tenant.businessName || tenant.name;
    const company = {
      id: tenant.companyId || `cmp_${companySlug}`,
      slug: companySlug,
      name: companyName,
      businessName: tenant.companyBusinessName || companyName,
      legalName:
        tenant.companyLegalName || tenant.companyBusinessName || companyName,
      cnpj: tenant.companyCnpj || "",
      address: tenant.companyAddress || "",
      status: "active",
    };

    tenant.companyId = company.id;
    tenant.companySlug = company.slug;
    tenant.companyName = company.name;
    companiesById.set(company.id, company);
  });

  return [...companiesById.values()];
})();

state.roleProfiles = state.tenants.flatMap((tenant) => [
  {
    id: `role_${tenant.id}_admin`,
    tenantSlug: tenant.slug,
    key: "admin",
    name: "Admin",
    isSystem: true,
    baseRole: "tenant_admin",
    permissions: defaultPermissionMap("tenant_admin"),
  },
  {
    id: `role_${tenant.id}_staff`,
    tenantSlug: tenant.slug,
    key: "staff",
    name: "Staff",
    isSystem: true,
    baseRole: "tenant_staff",
    permissions: defaultPermissionMap("tenant_staff"),
  },
]);

state.users = state.users.map((user) => {
  if (user.role === "super_admin") return user;
  const tenant = state.tenants.find((item) => item.slug === user.tenantSlug);
  const roleProfile = state.roleProfiles.find(
    (profile) =>
      profile.tenantSlug === user.tenantSlug && profile.baseRole === user.role,
  );
  return {
    ...user,
    companyId: tenant?.companyId || user.companyId || "",
    accessScope: user.accessScope || "branch",
    roleProfileId: roleProfile?.id || "",
  };
});

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeCatalogName(value) {
  return String(value || "")
    .trim()
    .toLocaleUpperCase("pt-BR");
}

function normalizeLinkedCategoryNames(option = {}) {
  const categoryNames = Array.isArray(option.linkedCategoryNames)
    ? option.linkedCategoryNames
    : [];
  const fallback = option.linkedCategoryName;

  return [...categoryNames, fallback].reduce((acc, categoryName) => {
    const normalized = String(categoryName || "").trim();
    if (normalized && !acc.includes(normalized)) acc.push(normalized);
    return acc;
  }, []);
}

function normalizeLinkedComponentRefs(option = {}) {
  const componentRefs = Array.isArray(option.linkedComponentRefs)
    ? option.linkedComponentRefs
    : [];
  const fallback = option.linkedComponentRef;

  return [...componentRefs, fallback].reduce((acc, componentRef) => {
    const normalized = String(componentRef || "").trim();
    if (normalized && !acc.includes(normalized)) acc.push(normalized);
    return acc;
  }, []);
}

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function findTenantRecord(tenantSlug) {
  const tenant = state.tenants.find((item) => item.slug === tenantSlug);

  if (!tenant) {
    throw new Error("Tenant não encontrado.");
  }

  return tenant;
}

function getTenantCompany(tenant) {
  const existingCompany = state.companies.find(
    (company) => company.id === tenant.companyId,
  );

  if (existingCompany) return existingCompany;

  const companySlug = tenant.companySlug || tenant.slug;
  const companyName = tenant.companyName || tenant.businessName || tenant.name;

  return {
    id: tenant.companyId || `cmp_${companySlug}`,
    slug: companySlug,
    name: companyName,
    businessName: tenant.companyBusinessName || companyName,
    legalName:
      tenant.companyLegalName || tenant.companyBusinessName || companyName,
    cnpj: tenant.companyCnpj || "",
    address: tenant.companyAddress || "",
    status: "active",
  };
}

function listAvailableCompanies() {
  return clone(state.companies).sort((a, b) => a.name.localeCompare(b.name));
}

function listAvailableTenants() {
  return state.tenants.map((tenant) => ({
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    businessName: tenant.businessName,
    companyId: getTenantCompany(tenant).id,
    branchCode: tenant.branchCode || tenant.slug,
    branchName: tenant.branchName || tenant.name,
    isHeadquarters: Boolean(tenant.isHeadquarters),
    company: getTenantCompany(tenant),
  }));
}

function listRoleProfiles(tenantSlug) {
  return state.roleProfiles
    .filter((profile) => profile.tenantSlug === tenantSlug)
    .map((profile) => ({
      id: profile.id,
      key: profile.key,
      name: profile.name,
      isSystem: Boolean(profile.isSystem),
      baseRole: profile.baseRole,
      permissions: normalizePermissionMap(
        profile.permissions,
        profile.baseRole,
      ),
    }));
}

function resolveRoleProfile(tenantSlug, user) {
  if (!user || user.role === "super_admin") {
    return null;
  }

  return (
    state.roleProfiles.find((profile) => profile.id === user.roleProfileId) ||
    state.roleProfiles.find(
      (profile) =>
        profile.tenantSlug === tenantSlug && profile.baseRole === user.role,
    ) ||
    state.roleProfiles.find(
      (profile) => profile.tenantSlug === tenantSlug && profile.key === "staff",
    ) ||
    null
  );
}

function getUserPermissionMap(tenantSlug, user) {
  if (user?.role === "super_admin") return defaultPermissionMap("tenant_admin");
  const profile = resolveRoleProfile(tenantSlug, user);
  return normalizePermissionMap(
    profile?.permissions,
    profile?.baseRole || user?.role || "tenant_staff",
  );
}

function createEmptyTenantBootstrap(businessName) {
  const bootstrap = createEmptyAppDataState();
  return {
    ...bootstrap,
    ingredientUnits: createDefaultIngredientUnits(() => createId("unit")),
    menuCategories: [],
    settings: {
      ...bootstrap.settings,
      businessName,
    },
  };
}

function ensureDefaultIngredientUnits(bootstrap) {
  bootstrap.ingredientUnits = createDefaultIngredientUnits(() =>
    createId("unit"),
  );
}

function cloneWithNewIds(items, prefix) {
  const idMap = new Map();
  const clonedItems = items.map((item) => {
    const nextId = createId(prefix);
    idMap.set(String(item.id), nextId);
    return { ...clone(item), id: nextId };
  });

  return { items: clonedItems, idMap };
}

function remapRecipe(recipe, ingredientIdMap, preparationIdMap) {
  return normalizeRecipe(recipe)
    .map((line) => {
      if (line.componentType === "ingredient") {
        const componentId = ingredientIdMap.get(String(line.componentId));
        return componentId ? { ...line, componentId } : null;
      }

      if (line.componentType === "preparation") {
        const componentId = preparationIdMap.get(String(line.componentId));
        return componentId ? { ...line, componentId } : null;
      }

      return null;
    })
    .filter(Boolean);
}

function remapLinkedComponents(components, maps, allowCmv) {
  if (!allowCmv) return [];

  return normalizeRecipe(components)
    .map((component) => {
      const type =
        typeof component === "string"
          ? component.split(":")[0]
          : component?.type;
      const id =
        typeof component === "string" ? component.split(":")[1] : component?.id;
      const nextId = maps[`${type}Ids`]?.get(String(id));
      return nextId ? { type, id: nextId } : null;
    })
    .filter(Boolean);
}

function remapLinkedComponentRef(ref, maps, allowCmv, allowMenu) {
  const [type, id] = String(ref || "").split(":");
  if (!type || !id) return "";
  if (type === "menu-item" && allowMenu)
    return maps.menuItemIds.has(String(id))
      ? `menu-item:${maps.menuItemIds.get(String(id))}`
      : "";
  if (!allowCmv) return "";
  const nextId = maps[`${type}Ids`]?.get(String(id));
  return nextId ? `${type}:${nextId}` : "";
}

function importHeadquartersData(targetTenant, sourceTenant, options) {
  const source = sourceTenant.bootstrap || {};
  const target = targetTenant.bootstrap;
  const maps = {
    ingredientIds: new Map(),
    preparationIds: new Map(),
    productIds: new Map(),
    categoryIds: new Map(),
    menuItemIds: new Map(),
  };

  if (options.importCmvFromHeadquarters) {
    target.ingredientUnits = createDefaultIngredientUnits(() =>
      createId("unit"),
    );

    const ingredients = cloneWithNewIds(source.ingredients || [], "ingredient");
    target.ingredients = ingredients.items;
    maps.ingredientIds = ingredients.idMap;

    const preparations = cloneWithNewIds(
      source.preparations || [],
      "preparation",
    );
    maps.preparationIds = preparations.idMap;
    target.preparations = preparations.items.map((preparation) => ({
      ...preparation,
      recipe: remapRecipe(
        preparation.recipe,
        maps.ingredientIds,
        maps.preparationIds,
      ),
    }));

    const products = cloneWithNewIds(source.products || [], "product");
    maps.productIds = products.idMap;
    target.products = products.items.map((product) => ({
      ...product,
      recipe: remapRecipe(
        product.recipe,
        maps.ingredientIds,
        maps.preparationIds,
      ),
    }));
  }

  ensureDefaultIngredientUnits(target);

  if (options.importMenuFromHeadquarters) {
    const categories = cloneWithNewIds(source.menuCategories || [], "cat");
    target.menuCategories = categories.items;
    maps.categoryIds = categories.idMap;

    const menuItems = cloneWithNewIds(source.menuItems || [], "menu");
    maps.menuItemIds = menuItems.idMap;
    target.menuItems = menuItems.items.map((item) => ({
      ...item,
      linkedComponents: remapLinkedComponents(
        item.linkedComponents,
        maps,
        options.importCmvFromHeadquarters,
      ),
      comboGroups: (item.comboGroups || []).map((group) => ({
        ...group,
        id: createId("combo_group"),
        options: (group.options || []).map((option) => ({
          ...option,
          id: createId("combo_option"),
          linkedComponentRef: remapLinkedComponentRef(
            option.linkedComponentRef,
            maps,
            options.importCmvFromHeadquarters,
            options.importMenuFromHeadquarters,
          ),
        })),
      })),
    }));
  }
}

function buildTenantBootstrap(tenantSlug) {
  const tenant = findTenantRecord(tenantSlug);

  return {
    tenant: {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      businessName: tenant.businessName,
      companyId: getTenantCompany(tenant).id,
      branchCode: tenant.branchCode || tenant.slug,
      branchName: tenant.branchName || tenant.name,
      isHeadquarters: Boolean(tenant.isHeadquarters),
      company: getTenantCompany(tenant),
    },
    roleProfiles: listRoleProfiles(tenantSlug),
    ...clone(tenant.bootstrap),
    ingredientUnits: createDefaultIngredientUnits(),
  };
}

function buildAdminTenantSnapshot(tenantSlug) {
  const tenant = findTenantRecord(tenantSlug);
  const company = getTenantCompany(tenant);
  const users = state.users.filter(
    (user) =>
      user.tenantSlug === tenantSlug ||
      (user.accessScope === "company" && user.companyId === company.id),
  );
  const bootstrap = buildTenantBootstrap(tenantSlug);

  return {
    tenant: {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      businessName: tenant.businessName,
      companyId: company.id,
      branchCode: tenant.branchCode || tenant.slug,
      branchName: tenant.branchName || tenant.name,
      isHeadquarters: Boolean(tenant.isHeadquarters),
      company,
    },
    summary: {
      users: users.length,
      employees: bootstrap.employees.length,
      salesChannels: bootstrap.salesChannels.length,
      recurringCosts: bootstrap.recurringCosts.length,
      transactions: bootstrap.transactions.length,
      customers: bootstrap.customers.length,
      paymentMethods: bootstrap.paymentMethods.length,
      orders: bootstrap.orders.length,
    },
    users: users.map((user) => ({
      id: user.id,
      name: user.fullName,
      email: user.email,
      role: user.role,
      roleProfileId: resolveRoleProfile(tenantSlug, user)?.id || "",
      roleProfileName: resolveRoleProfile(tenantSlug, user)?.name || "",
      tenantSlug: user.tenantSlug || tenantSlug,
      accessScope: user.accessScope || "branch",
    })),
    roleProfiles: listRoleProfiles(tenantSlug),
    data: {
      settings: bootstrap.settings,
      aiBehaviorSettings: bootstrap.aiBehaviorSettings,
      payrollConfig: bootstrap.payrollConfig,
      employees: bootstrap.employees,
      recurringCosts: bootstrap.recurringCosts,
      salesChannels: bootstrap.salesChannels,
      financeExpenseCategories: bootstrap.financeExpenseCategories,
      transactions: bootstrap.transactions,
      customers: bootstrap.customers,
      paymentMethods: bootstrap.paymentMethods,
      orders: bootstrap.orders,
      deliveryDrivers: bootstrap.deliveryDrivers,
    },
  };
}

function buildAdminBootstrap(selectedTenantSlug = "") {
  const availableTenants = listAvailableTenants();
  const resolvedTenantSlug =
    selectedTenantSlug || availableTenants[0]?.slug || "";

  return {
    availableCompanies: listAvailableCompanies(),
    availableTenants,
    selectedTenantSlug: resolvedTenantSlug,
    selectedTenant: resolvedTenantSlug
      ? buildAdminTenantSnapshot(resolvedTenantSlug)
      : null,
  };
}

function normalizeRecipe(value, { validateUnits = false } = {}) {
  const recipe = Array.isArray(value) ? clone(value) : [];
  if (!validateUnits) return recipe;

  return recipe.map((line) => ({
    ...line,
    quantityUnit: assertIngredientUnitLabel(
      line.quantityUnit,
      "Unidade da ficha técnica inválida.",
    ),
  }));
}

function createCatalogDependencyError(message) {
  const error = new Error(message);
  error.statusCode = 409;
  return error;
}

function hasRecipeComponent(recipe, componentType, componentId) {
  return normalizeRecipe(recipe).some(
    (line) =>
      line.componentType === componentType &&
      String(line.componentId) === String(componentId),
  );
}

function hasLinkedComponent(components, type, id) {
  return normalizeRecipe(components).some((component) => {
    if (typeof component === "string") return component === `${type}:${id}`;
    return component?.type === type && String(component?.id) === String(id);
  });
}

function hasComboLinkedComponentRef(menuItems, type, id) {
  return menuItems.some(
    (item) =>
      item.itemType === "combo" &&
      (item.comboGroups || []).some((group) =>
        (group.options || []).some(
          (option) => option.linkedComponentRef === `${type}:${id}`,
        ),
      ),
  );
}

async function getCurrentMockUser() {
  const authenticatedUser = getMockAuthUser();

  if (!authenticatedUser) {
    throw new Error("Sessão não encontrada. Faça login novamente.");
  }

  const user = state.users.find(
    (item) =>
      item.email.toLowerCase() === authenticatedUser.email.toLowerCase(),
  );

  if (!user) {
    throw new Error("Usuário mock não encontrado para a sessão atual.");
  }

  return user;
}

export const authApi = {
  async getSession() {
    const currentUser = await getCurrentMockUser();
    const memberships = state.users
      .filter(
        (user) =>
          user.id === currentUser.id ||
          user.email.toLowerCase() === currentUser.email.toLowerCase(),
      )
      .map((user) => {
        const tenant = user.tenantSlug
          ? state.tenants.find((item) => item.slug === user.tenantSlug)
          : null;

        return {
          id: `mem_${user.id}`,
          role: user.role,
          roleProfileId: user.roleProfileId || "",
          tenant: tenant
            ? {
                id: tenant.id,
                slug: tenant.slug,
                name: tenant.name,
                businessName: tenant.businessName,
                status: "active",
              }
            : null,
        };
      });

    const currentTenant =
      memberships.find(
        (membership) => membership.tenant && membership.role !== "super_admin",
      )?.tenant || null;

    return {
      user: {
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.fullName,
        role: currentUser.role,
      },
      memberships,
      currentTenant,
    };
  },
};

export const appApi = {
  async getBootstrap(tenantSlug) {
    const currentUser = await getCurrentMockUser();
    return {
      ...buildTenantBootstrap(tenantSlug),
      currentUserPermissions: getUserPermissionMap(tenantSlug, currentUser),
    };
  },
};

export const settingsApi = {
  async updateGeneral(tenantSlug, payload) {
    const tenant = findTenantRecord(tenantSlug);
    tenant.bootstrap.settings = {
      ...tenant.bootstrap.settings,
      ifoodTax: Number(payload.ifoodTax),
      anotaaiTax: Number(payload.anotaaiTax),
      businessName: String(payload.businessName || "").trim(),
      alertDaysBefore: Number(payload.alertDaysBefore),
    };

    return clone(tenant.bootstrap.settings);
  },
  async updateAiBehavior(tenantSlug, payload) {
    const tenant = findTenantRecord(tenantSlug);
    tenant.bootstrap.aiBehaviorSettings = {
      ...tenant.bootstrap.aiBehaviorSettings,
      ...clone(payload),
    };

    return clone(tenant.bootstrap.aiBehaviorSettings);
  },
};

export const financeApi = {
  async createTransaction(tenantSlug, payload) {
    const tenant = findTenantRecord(tenantSlug);
    const transaction = {
      id: Date.now(),
      ...clone(payload),
    };

    tenant.bootstrap.transactions = [
      transaction,
      ...tenant.bootstrap.transactions,
    ];
    return { type: transaction.type, transaction: clone(transaction) };
  },
  async updateTransaction(tenantSlug, payload) {
    const tenant = findTenantRecord(tenantSlug);
    const transaction = { ...clone(payload) };
    tenant.bootstrap.transactions = tenant.bootstrap.transactions.map((item) =>
      item.id === payload.id ? transaction : item,
    );
    return { type: transaction.type, transaction: clone(transaction) };
  },
  async deleteTransaction(tenantSlug, id) {
    const tenant = findTenantRecord(tenantSlug);
    tenant.bootstrap.transactions = tenant.bootstrap.transactions.filter(
      (item) => item.id !== id,
    );
    return { id };
  },
  async createRecurringCost(tenantSlug, payload) {
    const tenant = findTenantRecord(tenantSlug);
    const recurringCost = {
      id: createId("recurring"),
      desc: String(payload.desc || payload.reference || "").trim(),
      amount: Number(payload.amount) || 0,
      dueDay: Number(payload.dueDay) || 1,
      lastPaidMonth: payload.lastPaidMonth || "",
    };
    tenant.bootstrap.recurringCosts = [
      recurringCost,
      ...tenant.bootstrap.recurringCosts,
    ];
    return clone(recurringCost);
  },
  async createSalesChannel(tenantSlug, payload) {
    const tenant = findTenantRecord(tenantSlug);
    const channel = {
      id: createId("channel"),
      active: true,
      feePercent: 0,
      settlementType: "IMMEDIATE",
      settlementFrequency: "NONE",
      ...clone(payload),
    };
    tenant.bootstrap.salesChannels = [
      ...tenant.bootstrap.salesChannels,
      channel,
    ];
    return clone(channel);
  },
  async saveDailyRevenue(tenantSlug, payload) {
    const tenant = findTenantRecord(tenantSlug);
    const batchId = createId("daily");
    const transactions = (payload.entries || []).flatMap((entry) =>
      [
        ["cash", "dinheiro"],
        ["online", "online"],
      ]
        .map(([key, payment]) => ({
          id: createId("transaction"),
          batchId,
          date: payload.date,
          platform:
            tenant.bootstrap.salesChannels.find(
              (item) => item.id === entry.channelId,
            )?.name || "",
          payment,
          amount: Number(entry[key] || 0),
          tax: 0,
          net: Number(entry[key] || 0),
          type: "receita",
          category: "Venda diária",
          sourceType: "DAILY_REVENUE",
        }))
        .filter((item) => item.amount > 0),
    );
    tenant.bootstrap.transactions = [
      ...transactions,
      ...tenant.bootstrap.transactions.filter(
        (item) =>
          !(item.sourceType === "DAILY_REVENUE" && item.date === payload.date),
      ),
    ];
    return {
      batchId,
      transactions,
      totals: {
        grossRevenue: transactions.reduce((sum, item) => sum + item.amount, 0),
      },
    };
  },
  async receiveChannelSettlement(tenantSlug, payload) {
    const tenant = findTenantRecord(tenantSlug);
    tenant.bootstrap.channelSettlements = (
      tenant.bootstrap.channelSettlements || []
    ).map((item) =>
      item.id === payload.id
        ? { ...item, status: "RECEIVED", receivedDate: payload.receivedDate }
        : item,
    );
    return clone(
      tenant.bootstrap.channelSettlements.find(
        (item) => item.id === payload.id,
      ),
    );
  },
  async updateSalesChannel(tenantSlug, payload) {
    const tenant = findTenantRecord(tenantSlug);
    tenant.bootstrap.salesChannels = tenant.bootstrap.salesChannels.map(
      (item) =>
        item.id === payload.id ? { ...item, ...clone(payload) } : item,
    );
    return clone(
      tenant.bootstrap.salesChannels.find((item) => item.id === payload.id),
    );
  },
  async deleteSalesChannel(tenantSlug, id) {
    const tenant = findTenantRecord(tenantSlug);
    tenant.bootstrap.salesChannels = tenant.bootstrap.salesChannels.filter(
      (item) => item.id !== id,
    );
    return { id };
  },
  async updateRecurringCost(tenantSlug, payload) {
    const tenant = findTenantRecord(tenantSlug);
    const recurringCost = { ...clone(payload) };
    tenant.bootstrap.recurringCosts = tenant.bootstrap.recurringCosts.map(
      (cost) => (cost.id === payload.id ? recurringCost : cost),
    );
    return clone(recurringCost);
  },
  async updateRecurringCostAmount(tenantSlug, id, amount) {
    const tenant = findTenantRecord(tenantSlug);
    tenant.bootstrap.recurringCosts = tenant.bootstrap.recurringCosts.map(
      (cost) => (cost.id === id ? { ...cost, amount } : cost),
    );

    return clone(
      tenant.bootstrap.recurringCosts.find((cost) => cost.id === id),
    );
  },
  async toggleRecurringCostPayment(tenantSlug, id, lastPaidMonth) {
    const tenant = findTenantRecord(tenantSlug);
    tenant.bootstrap.recurringCosts = tenant.bootstrap.recurringCosts.map(
      (cost) => (cost.id === id ? { ...cost, lastPaidMonth } : cost),
    );

    return clone(
      tenant.bootstrap.recurringCosts.find((cost) => cost.id === id),
    );
  },
  async deleteRecurringCost(tenantSlug, id) {
    const tenant = findTenantRecord(tenantSlug);
    tenant.bootstrap.recurringCosts = tenant.bootstrap.recurringCosts.filter(
      (cost) => cost.id !== id,
    );
    return { id };
  },
  async getObligations(tenantSlug) {
    const tenant = findTenantRecord(tenantSlug);
    return {
      obligations: clone(tenant.bootstrap.financialObligations || []),
      duplicateCandidates: [],
    };
  },
  async updateObligation(tenantSlug, payload) {
    const tenant = findTenantRecord(tenantSlug);
    tenant.bootstrap.financialObligations = (
      tenant.bootstrap.financialObligations || []
    ).map((item) =>
      item.id === payload.id
        ? {
            ...item,
            finalAmount: payload.finalAmount,
            dueDate: payload.dueDate || item.dueDate,
            note: payload.note ?? item.note,
          }
        : item,
    );
    return clone(
      tenant.bootstrap.financialObligations.find(
        (item) => item.id === payload.id,
      ),
    );
  },
  async addObligationPayment(tenantSlug, payload) {
    const tenant = findTenantRecord(tenantSlug);
    const payment = { id: createId("payment"), ...clone(payload) };
    tenant.bootstrap.financialPayments = [
      payment,
      ...(tenant.bootstrap.financialPayments || []),
    ];
    tenant.bootstrap.financialObligations = (
      tenant.bootstrap.financialObligations || []
    ).map((item) => {
      if (item.id !== payload.obligationId) return item;
      const paidAmount =
        Number(item.paidAmount || 0) + Number(payload.amount || 0);
      return {
        ...item,
        payments: [payment, ...(item.payments || [])],
        paidAmount,
        openAmount: Math.max(
          Number(item.totalAmount || item.forecastAmount || 0) - paidAmount,
          0,
        ),
        status:
          paidAmount >= Number(item.totalAmount || item.forecastAmount || 0)
            ? "PAID"
            : "PARTIAL",
      };
    });
    return {
      payment,
      obligation: clone(
        tenant.bootstrap.financialObligations.find(
          (item) => item.id === payload.obligationId,
        ),
      ),
    };
  },
  async resolveObligationDuplicate(_tenantSlug, payload) {
    return {
      id: payload.id,
      status: payload.action === "MERGE" ? "CONFIRMED" : "REJECTED",
    };
  },
  async getCashReconciliations(tenantSlug) {
    return clone(
      findTenantRecord(tenantSlug).bootstrap.dailyCashReconciliations || [],
    );
  },
  async saveCashReconciliation(tenantSlug, payload) {
    const tenant = findTenantRecord(tenantSlug);
    const row = { id: createId("cash"), ...clone(payload) };
    tenant.bootstrap.dailyCashReconciliations = [
      row,
      ...(tenant.bootstrap.dailyCashReconciliations || []).filter(
        (item) => item.date !== row.date,
      ),
    ];
    return clone(row);
  },
  async getBalances() {
    return { periods: [], movements: [] };
  },
  async saveBalancePeriod(_tenantSlug, payload) {
    return {
      id: payload.id || createId("balance"),
      status: "OPEN",
      ...clone(payload),
    };
  },
  async changeBalanceStatus(_tenantSlug, payload) {
    return {
      ...clone(payload),
      status: payload.action === "CLOSE" ? "CLOSED" : "REOPENED",
    };
  },
  async saveAccountMovement(_tenantSlug, payload) {
    return { id: createId("movement"), status: "ACTIVE", ...clone(payload) };
  },
  async reverseAccountMovement(_tenantSlug, payload) {
    return { id: payload.id, status: "REVERSED" };
  },
  async closeIntegratedMonth(_tenantSlug, payload) {
    return {
      id: createId("integrated-close"),
      month: payload.competenceMonth,
      status: "closed",
    };
  },
  async closePeriod(tenantSlug, payload) {
    const tenant = findTenantRecord(tenantSlug);
    const summary = payload.summary || {};
    const closing = {
      id: payload.id || createId("closing"),
      periodType: payload.periodType || "daily",
      periodStart: payload.periodStart,
      periodEnd: payload.periodEnd,
      grossRevenue: Number(summary.receitaBruta || 0),
      netRevenue: Number(summary.receitaLiquida || 0),
      orderIncome: Number(summary.receitaPedidos || 0),
      manualIncome: Number(summary.receitaManual || 0),
      manualExpenses: Number(summary.saidasLancadas || 0),
      fixedCosts: Number(summary.custosFixos || 0),
      payrollCosts: Number(summary.folhaSalarial || 0),
      deliveryCosts: Number(summary.custosEntrega || 0),
      channelFees: Number(summary.taxasCanais || 0),
      totalExpenses: Number(summary.totalDespesas || 0),
      balance: Number(summary.saldoPeriodo || 0),
      status: "closed",
      snapshot: {
        ledgerEntries: clone(summary.ledgerEntries || []),
      },
      closedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    tenant.bootstrap.financialClosings = [
      closing,
      ...tenant.bootstrap.financialClosings.filter(
        (item) =>
          !(
            item.periodType === closing.periodType &&
            item.periodStart === closing.periodStart &&
            item.periodEnd === closing.periodEnd
          ),
      ),
    ];

    return clone(closing);
  },
};

export const customersApi = {
  async saveCustomer(tenantSlug, payload) {
    const tenant = findTenantRecord(tenantSlug);
    const customer = {
      id: payload.id || createId("customer"),
      name: String(payload.name || payload.fullName || "").trim(),
      phone: onlyDigits(payload.phone),
      email: String(payload.email || "").trim(),
      document: String(payload.document || "").trim(),
      addressLine: String(payload.addressLine || "").trim(),
      addressNumber: String(payload.addressNumber || "").trim(),
      addressComplement: String(payload.addressComplement || "").trim(),
      district: String(payload.district || "").trim(),
      city: String(payload.city || "").trim(),
      state: String(payload.state || "").trim(),
      postalCode: String(payload.postalCode || "").trim(),
      notes: String(payload.notes || "").trim(),
      status: payload.status === "inactive" ? "inactive" : "active",
    };

    if (!customer.name) throw new Error("Nome do cliente é obrigatório.");

    tenant.bootstrap.customers = payload.id
      ? tenant.bootstrap.customers.map((current) =>
          current.id === payload.id ? customer : current,
        )
      : [customer, ...tenant.bootstrap.customers];

    return clone(customer);
  },
  async deleteCustomer(tenantSlug, id) {
    const tenant = findTenantRecord(tenantSlug);
    tenant.bootstrap.customers = tenant.bootstrap.customers.filter(
      (customer) => customer.id !== id,
    );
    tenant.bootstrap.orders = tenant.bootstrap.orders.map((order) =>
      order.customerId === id
        ? { ...order, customerId: "", customer: null }
        : order,
    );
    return { id };
  },
};

export const paymentMethodsApi = {
  async savePaymentMethod(tenantSlug, payload) {
    const tenant = findTenantRecord(tenantSlug);
    const allowedKinds = [
      "cash",
      "credit_card",
      "debit_card",
      "pix",
      "voucher",
      "other",
    ];
    const paymentMethod = {
      id: payload.id || createId("payment"),
      name: String(payload.name || "").trim(),
      kind: allowedKinds.includes(payload.kind) ? payload.kind : "other",
      requiresChange: Boolean(payload.requiresChange),
      status: payload.status === "inactive" ? "inactive" : "active",
    };

    if (!paymentMethod.name)
      throw new Error("Nome da forma de pagamento é obrigatório.");

    tenant.bootstrap.paymentMethods = payload.id
      ? tenant.bootstrap.paymentMethods.map((current) =>
          current.id === payload.id ? paymentMethod : current,
        )
      : [...tenant.bootstrap.paymentMethods, paymentMethod];

    return clone(paymentMethod);
  },
  async deletePaymentMethod(tenantSlug, id) {
    const tenant = findTenantRecord(tenantSlug);
    tenant.bootstrap.paymentMethods = tenant.bootstrap.paymentMethods.filter(
      (method) => method.id !== id,
    );
    tenant.bootstrap.orders = tenant.bootstrap.orders.map((order) =>
      order.paymentMethodId === id
        ? { ...order, paymentMethodId: "", paymentMethod: null }
        : order,
    );
    return { id };
  },
};

export const ordersApi = {
  async listOrders(tenantSlug) {
    const tenant = findTenantRecord(tenantSlug);
    return clone(tenant.bootstrap.orders);
  },
  async saveOrder(tenantSlug, payload) {
    const tenant = findTenantRecord(tenantSlug);
    const items = Array.isArray(payload.items) ? clone(payload.items) : [];
    const subtotal =
      Number(
        payload.subtotal ||
          items.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0),
      ) || 0;
    const deliveryFee = Number(payload.deliveryFee) || 0;
    const discount = Number(payload.discount) || 0;
    const order = {
      id: payload.id || createId("order"),
      customerId: payload.customerId || "",
      paymentMethodId: payload.paymentMethodId || "",
      orderNumber: String(payload.orderNumber || "").trim(),
      channel: String(payload.channel || "manual").trim(),
      externalSource: String(payload.externalSource || "").trim(),
      externalId: String(payload.externalId || "").trim(),
      externalPayload: payload.externalPayload || {},
      orderType: ["delivery", "pickup", "dine_in"].includes(payload.orderType)
        ? payload.orderType
        : "delivery",
      status: [
        "draft",
        "placed",
        "accepted",
        "preparing",
        "ready",
        "dispatched",
        "delivered",
        "cancelled",
      ].includes(payload.status)
        ? payload.status
        : "draft",
      subtotal,
      deliveryFee,
      discount,
      total: Number(payload.total || subtotal + deliveryFee - discount) || 0,
      platformFee: Number(payload.platformFee) || 0,
      paidAmount: Number(payload.paidAmount) || 0,
      changeAmount: Number(payload.changeAmount) || 0,
      notes: String(payload.notes || "").trim(),
      items,
      customer:
        tenant.bootstrap.customers.find(
          (customer) => customer.id === payload.customerId,
        ) || null,
      paymentMethod:
        tenant.bootstrap.paymentMethods.find(
          (method) => method.id === payload.paymentMethodId,
        ) || null,
    };

    tenant.bootstrap.orders = payload.id
      ? tenant.bootstrap.orders.map((current) =>
          current.id === payload.id ? order : current,
        )
      : [order, ...tenant.bootstrap.orders];

    return clone(order);
  },
  async deleteOrder(tenantSlug, id) {
    const tenant = findTenantRecord(tenantSlug);
    tenant.bootstrap.orders = tenant.bootstrap.orders.filter(
      (order) => order.id !== id,
    );
    return { id };
  },
};

export const deliveryApi = {
  async saveDriver(tenantSlug, payload) {
    const tenant = findTenantRecord(tenantSlug);
    const driver = {
      id: payload.id || createId("driver"),
      name: String(payload.name || payload.fullName || "").trim(),
      phone: String(payload.phone || "").trim(),
      vehicle: String(payload.vehicle || "moto").trim(),
      dailyRate: Number(payload.dailyRate) || 0,
      perDeliveryRate: Number(payload.perDeliveryRate) || 0,
      status: payload.status === "inactive" ? "inactive" : "active",
      notes: String(payload.notes || "").trim(),
    };

    if (!driver.name) throw new Error("Nome do motoboy é obrigatório.");

    tenant.bootstrap.deliveryDrivers = payload.id
      ? tenant.bootstrap.deliveryDrivers.map((current) =>
          current.id === payload.id ? driver : current,
        )
      : [...tenant.bootstrap.deliveryDrivers, driver];

    return clone(driver);
  },
  async deleteDriver(tenantSlug, id) {
    const tenant = findTenantRecord(tenantSlug);
    tenant.bootstrap.deliveryDrivers = tenant.bootstrap.deliveryDrivers.filter(
      (driver) => driver.id !== id,
    );
    tenant.bootstrap.orders = tenant.bootstrap.orders.map((order) =>
      order.deliveryDriverId === id
        ? {
            ...order,
            deliveryDriverId: "",
            deliveryDriver: null,
            deliveryStatus: "waiting",
          }
        : order,
    );
    return { id };
  },
};

export const integrationsApi = {
  async importIfoodOrders(tenantSlug, orders) {
    const results = [];

    for (const externalOrder of Array.isArray(orders) ? orders : []) {
      const externalId = String(
        externalOrder.externalId ||
          externalOrder.id ||
          externalOrder.orderId ||
          "",
      ).trim();
      const order = await ordersApi.saveOrder(tenantSlug, {
        orderNumber:
          externalOrder.orderNumber || `IFOOD-${externalId || Date.now()}`,
        channel: "ifood",
        externalSource: "ifood",
        externalId,
        externalPayload: externalOrder,
        orderType: externalOrder.orderType || "delivery",
        status: externalOrder.status === "delivered" ? "delivered" : "placed",
        deliveryFee: Number(externalOrder.deliveryFee) || 0,
        discount: Number(externalOrder.discount) || 0,
        total: Number(externalOrder.total) || 0,
        platformFee: Number(externalOrder.platformFee) || 0,
        paidAmount:
          Number(externalOrder.paidAmount || externalOrder.total) || 0,
        notes: externalOrder.notes || "",
        items: externalOrder.items || [],
      });

      results.push({ externalId, status: "imported", order });
    }

    return {
      source: "ifood",
      imported: results.length,
      updated: 0,
      failed: 0,
      results,
    };
  },
};

export const publicMenuApi = {
  async getMenu(tenantSlug) {
    const tenant = findTenantRecord(tenantSlug);
    const visibleItems = tenant.bootstrap.menuItems
      .filter((item) => item.status === "active" || item.status === "seasonal")
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const visibleCategoryNames = new Set(
      visibleItems.map((item) => item.category).filter(Boolean),
    );

    return {
      tenant: {
        slug: tenant.slug,
        name: tenant.name,
        businessName: tenant.businessName,
      },
      categories: tenant.bootstrap.menuCategories
        .filter((category) => visibleCategoryNames.has(category.name))
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
      items: clone(visibleItems),
      paymentMethods: clone(
        tenant.bootstrap.paymentMethods.filter(
          (method) => method.status === "active",
        ),
      ),
    };
  },
  async getCustomerByPhone(tenantSlug, phone) {
    const tenant = findTenantRecord(tenantSlug);
    const normalizedPhone = onlyDigits(phone);
    const customer =
      tenant.bootstrap.customers.find(
        (item) => onlyDigits(item.phone) === normalizedPhone,
      ) || null;
    return {
      customer: customer
        ? clone({ ...customer, phone: onlyDigits(customer.phone) })
        : null,
    };
  },
  async createOrder(tenantSlug, payload) {
    const tenant = findTenantRecord(tenantSlug);
    const customerPayload = payload.customer || {};
    const phone = onlyDigits(customerPayload.phone);
    if (phone.length < 10 || phone.length > 11)
      throw new Error("Telefone com DDD é obrigatório.");
    const existingCustomer = customerPayload.id
      ? null
      : tenant.bootstrap.customers.find(
          (item) => onlyDigits(item.phone) === phone,
        );
    const customer = await customersApi.saveCustomer(tenantSlug, {
      ...customerPayload,
      id: customerPayload.id || existingCustomer?.id,
      phone,
    });
    const order = await ordersApi.saveOrder(tenantSlug, {
      ...payload,
      customerId: customer.id,
      orderNumber: `WEB-${Date.now().toString().slice(-6)}`,
      channel: "proprio",
      status: "placed",
    });

    return { customer, order };
  },
};

export const hrApi = {
  async getFixedPayroll(tenantSlug, month) {
    const tenant = findTenantRecord(tenantSlug);
    return clone({ competenceMonth: month, statements: [], scheduledDaysOff: tenant.bootstrap.employees.flatMap((employee) => employee.scheduledDaysOff || []), adjustments: (tenant.bootstrap.payrollAdjustments || []).filter((item) => item.competenceMonth === month) });
  },
  async saveScheduledDayOff(tenantSlug, payload) {
    const tenant = findTenantRecord(tenantSlug);
    const row = { ...clone(payload), id: payload.id || createId('day-off'), active: true };
    tenant.bootstrap.employees = tenant.bootstrap.employees.map((employee) => String(employee.id) === String(payload.employeeId) ? { ...employee, scheduledDaysOff: [...(employee.scheduledDaysOff || []).filter((item) => item.id !== row.id), row] } : employee);
    return clone(row);
  },
  async cancelScheduledDayOff(tenantSlug, payload) {
    const tenant = findTenantRecord(tenantSlug);
    let result;
    tenant.bootstrap.employees = tenant.bootstrap.employees.map((employee) => ({ ...employee, scheduledDaysOff: (employee.scheduledDaysOff || []).map((item) => item.id === payload.id ? (result = { ...item, active: false, cancellationReason: payload.reason }) : item) }));
    return clone(result);
  },
  async savePayrollAdjustment(tenantSlug, payload) {
    const tenant = findTenantRecord(tenantSlug);
    const row = { ...clone(payload), id: payload.id || createId('payroll-adjustment'), status: 'ACTIVE' };
    tenant.bootstrap.payrollAdjustments = [...(tenant.bootstrap.payrollAdjustments || []).filter((item) => item.id !== row.id), row];
    return clone(row);
  },
  async cancelPayrollAdjustment(tenantSlug, payload) {
    const tenant = findTenantRecord(tenantSlug);
    tenant.bootstrap.payrollAdjustments = (tenant.bootstrap.payrollAdjustments || []).map((item) => item.id === payload.id ? { ...item, status: 'CANCELLED', cancellationReason: payload.reason } : item);
    return clone(tenant.bootstrap.payrollAdjustments.find((item) => item.id === payload.id));
  },
  async saveEmployee(tenantSlug, payload) {
    const tenant = findTenantRecord(tenantSlug);
    const dailyRateTypes =
      payload.employmentType === "external"
        ? (payload.dailyRateTypes || []).map((type) => ({
            ...clone(type),
            id: type.id || createId("daily-rate-type"),
            amount: Number(type.amount || 0),
            active: type.active !== false,
            appliesWeekdays: type.appliesWeekdays !== false,
            appliesWeekends: type.appliesWeekends !== false,
          }))
        : [];
    const nextEmployee = payload.id
      ? { ...clone(payload), dailyRateTypes }
      : { ...clone(payload), dailyRateTypes, id: Date.now() };

    tenant.bootstrap.employees = payload.id
      ? tenant.bootstrap.employees.map((employee) =>
          employee.id === payload.id ? nextEmployee : employee,
        )
      : [...tenant.bootstrap.employees, nextEmployee];

    return clone(nextEmployee);
  },
  async deleteEmployee(tenantSlug, id) {
    const tenant = findTenantRecord(tenantSlug);
    tenant.bootstrap.employees = tenant.bootstrap.employees.filter(
      (employee) => employee.id !== id,
    );
    return true;
  },
  async saveWorkLog(tenantSlug, payload) {
    const tenant = findTenantRecord(tenantSlug);
    const current = tenant.bootstrap.employeeWorkLogs || [];
    const existing = current.find(
      (log) =>
        log.id === payload.id ||
        (String(log.employeeId) === String(payload.employeeId) &&
          log.workDate === payload.workDate),
    );
    const employee = tenant.bootstrap.employees.find(
      (item) => String(item.id) === String(payload.employeeId),
    );
    const motoboy = /moto|entrega/i.test(String(employee?.role || ""));
    const config = tenant.bootstrap.payrollConfig || {};
    let rateTypes = [];
    let dailyRate = 0;
    if (payload.worked !== false && employee?.employmentType === "external") {
      const configuredTypes = (employee.dailyRateTypes || []).filter(
        (type) => type.active !== false,
      );
      let selectedIds = Array.isArray(payload.dailyRateTypeIds)
        ? payload.dailyRateTypeIds.map(String)
        : (existing?.rateTypes || []).map((type) =>
            String(type.dailyRateTypeId),
          );
      if (!selectedIds.length) {
        const weekend = [0, 6].includes(
          new Date(`${payload.workDate}T12:00:00`).getDay(),
        );
        const applicable = configuredTypes.filter((type) =>
          weekend
            ? type.appliesWeekends !== false
            : type.appliesWeekdays !== false,
        );
        if (applicable.length === 1) selectedIds = [String(applicable[0].id)];
      }
      if (!selectedIds.length)
        throw new Error("Selecione ao menos um Tipo de Diária.");
      rateTypes = selectedIds.map((id) => {
        const type = configuredTypes.find((item) => String(item.id) === id);
        if (!type) throw new Error("Tipo de Diária inválido ou inativo.");
        const historical = (existing?.rateTypes || []).find(
          (item) => String(item.dailyRateTypeId) === id,
        );
        return {
          id: historical?.id || createId("work-log-rate-type"),
          dailyRateTypeId: type.id,
          typeName: historical?.typeName || type.name,
          amountSnapshot: Number(
            historical?.amountSnapshot ?? type.amount ?? 0,
          ),
        };
      });
      dailyRate = rateTypes.reduce((sum, type) => sum + type.amountSnapshot, 0);
    }
    const log = {
      ...existing,
      ...clone(payload),
      id: existing?.id || Date.now(),
      dailyRate: payload.worked === false ? 0 : dailyRate,
      rateTypes: payload.worked === false ? [] : rateTypes,
      mealCost:
        payload.worked === false
          ? 0
          : existing?.mealCost || config.mealCostPerWorkday || 15,
      deliveryFee:
        payload.worked === false || !motoboy
          ? 0
          : Number(payload.deliveryFee ?? existing?.deliveryFee ?? 0),
    };
    tenant.bootstrap.employeeWorkLogs = existing
      ? current.map((item) => (item.id === existing.id ? log : item))
      : [log, ...current];
    return clone(log);
  },
  async updateWeeklyClosingPayment(tenantSlug, payload) {
    const tenant = findTenantRecord(tenantSlug);
    tenant.bootstrap.extraWeeklyClosings = (
      tenant.bootstrap.extraWeeklyClosings || []
    ).map((closing) =>
      closing.id === payload.id
        ? {
            ...closing,
            paidAmount: payload.paidAmount,
            paidAt: payload.paidAt,
            status:
              Number(payload.paidAmount) >= Number(closing.totalPayment)
                ? "paid"
                : "partial",
            note: payload.note || "",
          }
        : closing,
    );
    return clone(
      tenant.bootstrap.extraWeeklyClosings.find(
        (closing) => closing.id === payload.id,
      ),
    );
  },
  async savePayrollConfig(tenantSlug, payload) {
    const tenant = findTenantRecord(tenantSlug);
    tenant.bootstrap.payrollConfig = clone(payload);
    return clone(payload);
  },
};

export const menuApi = {
  async saveCategory(tenantSlug, payload) {
    const tenant = findTenantRecord(tenantSlug);
    const name = String(payload.name || "").trim();

    if (!name) {
      throw new Error("Nome da categoria é obrigatório.");
    }

    if (payload.id) {
      const previous = tenant.bootstrap.menuCategories.find(
        (category) => category.id === payload.id,
      );
      tenant.bootstrap.menuCategories = tenant.bootstrap.menuCategories.map(
        (category) =>
          category.id === payload.id
            ? {
                ...category,
                name,
                sortOrder: payload.sortOrder ?? category.sortOrder ?? 0,
              }
            : category,
      );

      if (previous && previous.name !== name) {
        tenant.bootstrap.menuItems = tenant.bootstrap.menuItems.map((item) =>
          item.category === previous.name ? { ...item, category: name } : item,
        );
      }

      return clone(
        tenant.bootstrap.menuCategories.find(
          (category) => category.id === payload.id,
        ),
      );
    }

    const category = {
      id: createId("cat"),
      name,
      sortOrder: Number.isInteger(payload.sortOrder)
        ? payload.sortOrder
        : tenant.bootstrap.menuCategories.length,
    };

    tenant.bootstrap.menuCategories = [
      ...tenant.bootstrap.menuCategories,
      category,
    ];
    return clone(category);
  },
  async deleteCategory(tenantSlug, id) {
    const tenant = findTenantRecord(tenantSlug);
    const category = tenant.bootstrap.menuCategories.find(
      (item) => item.id === id,
    );

    tenant.bootstrap.menuCategories = tenant.bootstrap.menuCategories.filter(
      (item) => item.id !== id,
    );

    if (category) {
      tenant.bootstrap.menuItems = tenant.bootstrap.menuItems.map((item) =>
        item.category === category.name ? { ...item, category: "" } : item,
      );
    }

    return { id };
  },
  async reorderCategories(tenantSlug, items = []) {
    const tenant = findTenantRecord(tenantSlug);
    const orderMap = new Map(
      items.map((item, index) => [
        String(item.id),
        Number.isInteger(item.sortOrder) ? item.sortOrder : index,
      ]),
    );

    tenant.bootstrap.menuCategories = tenant.bootstrap.menuCategories
      .map((category) => ({
        ...category,
        sortOrder: orderMap.has(String(category.id))
          ? orderMap.get(String(category.id))
          : (category.sortOrder ?? 0),
      }))
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    return clone(tenant.bootstrap.menuCategories);
  },
  async saveItem(tenantSlug, payload) {
    const tenant = findTenantRecord(tenantSlug);
    const comboGroups =
      payload.itemType === "combo"
        ? clone(payload.comboGroups || []).map((group) => ({
            ...group,
            options: (group.options || []).map((option) => {
              const linkedCategoryNames = normalizeLinkedCategoryNames(option);
              const linkedComponentRefs = normalizeLinkedComponentRefs(option);
              return {
                ...option,
                linkedCategoryName: linkedCategoryNames[0] || "",
                linkedCategoryNames,
                linkedComponentRef: linkedComponentRefs[0] || "",
                linkedComponentRefs,
              };
            }),
          }))
        : [];
    const item = {
      ...clone(payload),
      id: payload.id || createId("menu"),
      itemType: payload.itemType === "combo" ? "combo" : "regular",
      sortOrder: Number.isInteger(payload.sortOrder)
        ? payload.sortOrder
        : payload.id
          ? (tenant.bootstrap.menuItems.find(
              (current) => current.id === payload.id,
            )?.sortOrder ?? 0)
          : tenant.bootstrap.menuItems.filter(
              (current) => current.category === payload.category,
            ).length,
      comboGroups,
      linkedComponents:
        payload.itemType === "combo"
          ? []
          : clone(payload.linkedComponents || []),
    };

    tenant.bootstrap.menuItems = payload.id
      ? tenant.bootstrap.menuItems.map((current) =>
          current.id === payload.id ? item : current,
        )
      : [...tenant.bootstrap.menuItems, item];

    return clone(item);
  },
  async deleteItem(tenantSlug, id) {
    const tenant = findTenantRecord(tenantSlug);
    tenant.bootstrap.menuItems = tenant.bootstrap.menuItems
      .filter((item) => item.id !== id)
      .map((item) =>
        item.itemType === "combo"
          ? {
              ...item,
              comboGroups: (item.comboGroups || []).map((group) => ({
                ...group,
                options: (group.options || []).map((option) =>
                  option.linkedComponentRef === `menu-item:${id}`
                    ? {
                        ...option,
                        linkedComponentRef: "",
                        linkedCategoryName: "",
                        linkedCategoryNames: [],
                      }
                    : option,
                ),
              })),
            }
          : item,
      );

    return { id };
  },
  async reorderItems(tenantSlug, items = []) {
    const tenant = findTenantRecord(tenantSlug);
    const orderMap = new Map(
      items.map((item, index) => [
        String(item.id),
        Number.isInteger(item.sortOrder) ? item.sortOrder : index,
      ]),
    );

    tenant.bootstrap.menuItems = tenant.bootstrap.menuItems
      .map((item) => ({
        ...item,
        sortOrder: orderMap.has(String(item.id))
          ? orderMap.get(String(item.id))
          : (item.sortOrder ?? 0),
      }))
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    return clone(tenant.bootstrap.menuItems);
  },
};

export const catalogApi = {
  async saveUnit() {
    throw new Error("As unidades são fixas e não podem ser alteradas.");
  },
  async deleteUnit() {
    throw new Error("As unidades são fixas e não podem ser excluídas.");
  },
  async saveIngredient(tenantSlug, payload) {
    const tenant = findTenantRecord(tenantSlug);
    const packageCost = Number(payload.packageCost ?? payload.unitCost) || 0;
    const packageQuantity = Number(payload.packageQuantity) || 1;
    const fallbackUnitCost =
      packageQuantity > 0 ? packageCost / packageQuantity : packageCost;
    const unitCost = Number(payload.unitCost) || fallbackUnitCost;
    const ingredient = {
      id: payload.id || createId("ingredient"),
      name: normalizeCatalogName(payload.name),
      unit: payload.unit
        ? assertIngredientUnitLabel(payload.unit, "Unidade do insumo inválida.")
        : "",
      packageQuantity,
      packageCost,
      unitCost,
    };

    if (!ingredient.name || !ingredient.unit)
      throw new Error("Nome e unidade do insumo são obrigatórios.");
    if (ingredient.unitCost <= 0)
      throw new Error("Custo do insumo é obrigatório.");

    tenant.bootstrap.ingredients = payload.id
      ? tenant.bootstrap.ingredients.map((current) =>
          current.id === payload.id ? ingredient : current,
        )
      : [...tenant.bootstrap.ingredients, ingredient];

    return clone(ingredient);
  },
  async deleteIngredient(tenantSlug, id) {
    const tenant = findTenantRecord(tenantSlug);

    const isUsed =
      tenant.bootstrap.preparations.some((preparation) =>
        hasRecipeComponent(preparation.recipe, "ingredient", id),
      ) ||
      tenant.bootstrap.products.some((product) =>
        hasRecipeComponent(product.recipe, "ingredient", id),
      ) ||
      tenant.bootstrap.menuItems.some((item) =>
        hasLinkedComponent(item.linkedComponents, "ingredient", id),
      );

    if (isUsed) {
      throw createCatalogDependencyError(
        "Este insumo está em uso em fichas técnicas ou itens do cardápio. Remova os vínculos antes de excluir.",
      );
    }

    tenant.bootstrap.ingredients = tenant.bootstrap.ingredients.filter(
      (ingredient) => ingredient.id !== id,
    );

    return { id };
  },
  async savePreparation(tenantSlug, payload) {
    const tenant = findTenantRecord(tenantSlug);
    const preparation = {
      id: payload.id || createId("preparation"),
      name: normalizeCatalogName(payload.name),
      yieldQuantity: Number(payload.yieldQuantity) || 0,
      yieldUnit: payload.yieldUnit
        ? assertIngredientUnitLabel(
            payload.yieldUnit,
            "Unidade de rendimento inválida.",
          )
        : "",
      recipe: normalizeRecipe(payload.recipe, { validateUnits: true }),
    };

    if (!preparation.name || !preparation.yieldUnit)
      throw new Error("Nome e unidade da receita base são obrigatórios.");

    tenant.bootstrap.preparations = payload.id
      ? tenant.bootstrap.preparations.map((current) =>
          current.id === payload.id ? preparation : current,
        )
      : [...tenant.bootstrap.preparations, preparation];

    return clone(preparation);
  },
  async deletePreparation(tenantSlug, id) {
    const tenant = findTenantRecord(tenantSlug);

    const isUsed =
      tenant.bootstrap.preparations.some(
        (preparation) =>
          String(preparation.id) !== String(id) &&
          hasRecipeComponent(preparation.recipe, "preparation", id),
      ) ||
      tenant.bootstrap.products.some((product) =>
        hasRecipeComponent(product.recipe, "preparation", id),
      ) ||
      tenant.bootstrap.menuItems.some((item) =>
        hasLinkedComponent(item.linkedComponents, "preparation", id),
      );

    if (isUsed) {
      throw createCatalogDependencyError(
        "Esta receita base está em uso em outras fichas técnicas ou itens do cardápio. Remova os vínculos antes de excluir.",
      );
    }

    tenant.bootstrap.preparations = tenant.bootstrap.preparations.filter(
      (preparation) => preparation.id !== id,
    );

    return { id };
  },
  async saveProduct(tenantSlug, payload) {
    const tenant = findTenantRecord(tenantSlug);
    const product = {
      id: payload.id || createId("product"),
      name: normalizeCatalogName(payload.name),
      salePrice: Number(payload.salePrice) || 0,
      yieldQuantity: Number(payload.yieldQuantity) || 1,
      targetCmvPercent: Number(payload.targetCmvPercent) || 0,
      recipe: normalizeRecipe(payload.recipe, { validateUnits: true }),
    };

    if (!product.name) throw new Error("Nome do produto é obrigatório.");

    tenant.bootstrap.products = payload.id
      ? tenant.bootstrap.products.map((current) =>
          current.id === payload.id ? product : current,
        )
      : [...tenant.bootstrap.products, product];

    return clone(product);
  },
  async deleteProduct(tenantSlug, id) {
    const tenant = findTenantRecord(tenantSlug);

    const isUsed =
      tenant.bootstrap.menuItems.some((item) =>
        hasLinkedComponent(item.linkedComponents, "product", id),
      ) ||
      hasComboLinkedComponentRef(tenant.bootstrap.menuItems, "product", id);

    if (isUsed) {
      throw createCatalogDependencyError(
        "Este produto está em uso no cardápio ou em combos. Remova os vínculos antes de excluir.",
      );
    }

    tenant.bootstrap.products = tenant.bootstrap.products.filter(
      (product) => product.id !== id,
    );

    return { id };
  },
};

export const supplyChainApi = {
  async getData() {
    return {
      suppliers: [],
      orders: [],
      inventoryCounts: [],
      inventory: {
        stock: [],
        totalValue: 0,
        ingredientCount: 0,
        belowMinimumCount: 0,
        lastInventory: "",
        receivedPurchaseCount: 0,
      },
      monthlyInventorySummaries: [],
      priceHistory: [],
      auditEvents: [],
    };
  },
  async saveSupplier(_tenantSlug, payload) {
    return {
      ...payload,
      id: payload.id || createId("supplier"),
      ingredientLinks: (payload.ingredientIds || []).map((ingredientId) => ({
        ingredientId,
        active: true,
      })),
    };
  },
  async deleteSupplier(_tenantSlug, id) {
    return { id };
  },
  async saveOrder(_tenantSlug, payload) {
    return {
      ...payload,
      id: payload.id || createId("purchase"),
      status: payload.status || "DRAFT",
      receipts: [],
    };
  },
  async changeOrderStatus(_tenantSlug, payload) {
    return payload;
  },
  async receiveOrder(_tenantSlug, payload) {
    return payload;
  },
  async reverseReceipt(_tenantSlug, payload) {
    return payload;
  },
  async saveInventory(_tenantSlug, payload) {
    return {
      ...payload,
      id: payload.id || createId("inventory"),
      status: "DRAFT",
    };
  },
  async changeInventoryStatus(_tenantSlug, payload) {
    return payload;
  },
};

export const adminApi = {
  async getBootstrap(tenantSlug) {
    return buildAdminBootstrap(tenantSlug);
  },
  async createCompany(payload) {
    const name = String(payload.name || "").trim();
    const slug = slugify(payload.slug || name);
    const branchName = String(payload.branchName || name).trim();
    const branchCode = String(payload.branchCode || branchName).trim();
    const branchSlug = slugify(branchCode || branchName);

    if (!name) {
      throw new Error("Nome da empresa é obrigatório.");
    }

    if (!slug) {
      throw new Error("Slug da empresa é obrigatório.");
    }

    if (state.companies.some((company) => company.slug === slug)) {
      throw new Error("Já existe uma empresa com esse slug.");
    }

    if (!branchName) {
      throw new Error("Nome da filial matriz é obrigatório.");
    }

    if (!branchSlug) {
      throw new Error("ID/código da filial matriz é obrigatório.");
    }

    if (state.tenants.some((tenant) => tenant.slug === branchSlug)) {
      throw new Error("Já existe uma filial com esse código.");
    }

    const created = {
      id: createId("cmp"),
      slug,
      name,
      businessName: String(payload.businessName || name).trim(),
      legalName: String(
        payload.legalName || payload.businessName || name,
      ).trim(),
      cnpj: String(payload.cnpj || "").trim(),
      address: String(payload.address || "").trim(),
      status: "active",
    };

    state.companies.push(created);

    const tenant = {
      id: createId("ten"),
      slug: branchSlug,
      name: branchName,
      businessName: created.businessName || created.name,
      companyId: created.id,
      companySlug: created.slug,
      companyName: created.name,
      branchCode,
      branchName,
      isHeadquarters: true,
      bootstrap: createEmptyTenantBootstrap(
        created.businessName || created.name,
      ),
    };

    state.tenants.push(tenant);

    const tenantOption = {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      businessName: tenant.businessName,
      companyId: created.id,
      branchCode: tenant.branchCode,
      branchName: tenant.branchName,
      isHeadquarters: true,
      company: clone(created),
    };

    return {
      company: clone(created),
      tenant: tenantOption,
    };
  },
  async updateCompany(companyId, payload) {
    const company = state.companies.find((item) => item.id === companyId);

    if (!company) {
      throw new Error("Empresa não encontrada.");
    }

    const name = String(payload.name || company.name).trim();
    const slug = slugify(payload.slug || company.slug || name);

    if (!name || !slug) {
      throw new Error("Nome e slug da empresa são obrigatórios.");
    }

    company.name = name;
    company.slug = slug;
    company.businessName = String(payload.businessName || name).trim();
    company.legalName = String(
      payload.legalName || company.businessName || name,
    ).trim();
    company.cnpj = String(payload.cnpj || "").trim();
    company.address = String(payload.address || "").trim();

    state.tenants.forEach((tenant) => {
      if (tenant.companyId !== company.id) return;
      tenant.companyName = company.name;
      tenant.companySlug = company.slug;
      tenant.companyBusinessName = company.businessName;
      tenant.companyLegalName = company.legalName;
      tenant.companyCnpj = company.cnpj;
      tenant.companyAddress = company.address;
    });

    return clone(company);
  },
  async deleteCompany(companyId) {
    const company = state.companies.find((item) => item.id === companyId);

    if (!company) {
      throw new Error("Empresa não encontrada.");
    }

    const branchSlugs = state.tenants
      .filter((tenant) => tenant.companyId === company.id)
      .map((tenant) => tenant.slug);

    state.tenants.splice(
      0,
      state.tenants.length,
      ...state.tenants.filter((tenant) => tenant.companyId !== company.id),
    );
    state.users.splice(
      0,
      state.users.length,
      ...state.users.filter(
        (user) =>
          user.companyId !== company.id &&
          !branchSlugs.includes(user.tenantSlug),
      ),
    );
    state.companies.splice(
      state.companies.findIndex((item) => item.id === company.id),
      1,
    );

    return clone(company);
  },
  async createTenant(payload) {
    const name = String(payload.name || payload.branchName || "").trim();
    const slug = slugify(payload.slug || payload.branchCode || name);
    const selectedCompany = listAvailableCompanies().find(
      (company) => company.id === payload.companyId,
    );

    if (!name) {
      throw new Error("Nome da filial é obrigatório.");
    }

    if (!slug) {
      throw new Error("Slug da filial é obrigatório.");
    }

    if (!selectedCompany) {
      throw new Error("Selecione uma empresa antes de criar a filial.");
    }

    if (state.tenants.some((tenant) => tenant.slug === slug)) {
      throw new Error("Já existe uma filial com esse slug.");
    }

    const importOptions = {
      importMenuFromHeadquarters: Boolean(payload.importMenuFromHeadquarters),
      importCmvFromHeadquarters: Boolean(payload.importCmvFromHeadquarters),
    };
    const headquartersTenant = state.tenants.find(
      (tenant) =>
        tenant.companyId === selectedCompany.id &&
        tenant.isHeadquarters &&
        tenant.slug !== slug,
    );

    if (
      (importOptions.importMenuFromHeadquarters ||
        importOptions.importCmvFromHeadquarters) &&
      !headquartersTenant
    ) {
      throw new Error(
        "Essa empresa não tem filial matriz para importar dados.",
      );
    }

    const created = {
      id: createId("ten"),
      slug,
      name,
      businessName:
        payload.businessName ||
        selectedCompany.businessName ||
        selectedCompany.name,
      companyId: selectedCompany.id,
      companySlug: selectedCompany.slug,
      companyName: selectedCompany.name,
      branchCode: payload.branchCode || slug,
      branchName: payload.branchName || name,
      isHeadquarters: Boolean(payload.isHeadquarters),
      bootstrap: createEmptyTenantBootstrap(
        payload.businessName ||
          selectedCompany.businessName ||
          selectedCompany.name,
      ),
    };

    if (headquartersTenant) {
      importHeadquartersData(created, headquartersTenant, importOptions);
    }

    state.tenants.push(created);

    return {
      id: created.id,
      slug: created.slug,
      name: created.name,
    };
  },
  async updateTenant(tenantSlug, payload) {
    const tenant = findTenantRecord(tenantSlug);
    const selectedCompany = listAvailableCompanies().find(
      (company) => company.id === payload.companyId,
    );
    tenant.name = String(payload.name || tenant.name).trim();
    tenant.businessName = String(
      payload.businessName || tenant.businessName || tenant.name,
    ).trim();
    tenant.companyId =
      selectedCompany?.id ||
      payload.companyId ||
      tenant.companyId ||
      getTenantCompany(tenant).id;
    tenant.companyName =
      selectedCompany?.name ||
      String(
        payload.companyName ||
          tenant.companyName ||
          tenant.businessName ||
          tenant.name,
      ).trim();
    tenant.companySlug =
      selectedCompany?.slug ||
      slugify(payload.companySlug || tenant.companySlug || tenant.companyName);
    tenant.branchCode = String(
      payload.branchCode || tenant.branchCode || tenant.slug,
    ).trim();
    tenant.branchName = String(
      payload.branchName || tenant.branchName || tenant.name,
    ).trim();
    tenant.isHeadquarters = Boolean(payload.isHeadquarters);
    tenant.bootstrap.settings = {
      ...tenant.bootstrap.settings,
      businessName: tenant.businessName,
    };

    return buildAdminTenantSnapshot(tenantSlug);
  },
  async deleteTenant(tenantSlug) {
    const tenant = findTenantRecord(tenantSlug);
    state.tenants.splice(
      state.tenants.findIndex((item) => item.slug === tenantSlug),
      1,
    );
    state.users.splice(
      0,
      state.users.length,
      ...state.users.filter((user) => user.tenantSlug !== tenantSlug),
    );

    return {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
    };
  },
  async saveTenantUser(tenantSlug, payload) {
    const tenant = findTenantRecord(tenantSlug);
    const company = getTenantCompany(tenant);
    const roleProfile =
      state.roleProfiles.find(
        (profile) => profile.id === payload.roleProfileId,
      ) ||
      state.roleProfiles.find(
        (profile) =>
          profile.tenantSlug === tenantSlug &&
          profile.baseRole === payload.role,
      ) ||
      state.roleProfiles.find(
        (profile) =>
          profile.tenantSlug === tenantSlug && profile.key === "staff",
      );
    const role =
      roleProfile?.baseRole === "tenant_admin"
        ? "tenant_admin"
        : "tenant_staff";
    const accessScope =
      role === "tenant_admin" && payload.accessScope === "company"
        ? "company"
        : "branch";

    const normalized = {
      id: payload.id || createId("usr"),
      email: String(payload.email || "")
        .trim()
        .toLowerCase(),
      fullName: String(payload.name || "").trim(),
      role,
      roleProfileId: roleProfile?.id || "",
      tenantSlug: accessScope === "company" ? null : tenantSlug,
      companyId: company.id,
      accessScope,
    };

    if (!normalized.email || !normalized.fullName) {
      throw new Error("Nome e e-mail são obrigatórios.");
    }

    const duplicated = state.users.find(
      (user) => user.email === normalized.email && user.id !== normalized.id,
    );
    if (duplicated) {
      throw new Error("Já existe um usuário com esse e-mail.");
    }

    const existingIndex = state.users.findIndex(
      (user) => user.id === normalized.id,
    );
    if (existingIndex >= 0) {
      state.users[existingIndex] = normalized;
    } else {
      state.users.push(normalized);
    }

    return buildAdminTenantSnapshot(tenantSlug);
  },
  async saveRoleProfile(tenantSlug, payload) {
    const tenant = findTenantRecord(tenantSlug);
    const name = String(payload.name || "").trim();
    if (!name) throw new Error("Nome do perfil é obrigatório.");

    const current = payload.id
      ? state.roleProfiles.find(
          (profile) =>
            profile.id === payload.id && profile.tenantSlug === tenantSlug,
        )
      : null;
    const baseRole =
      payload.baseRole === "tenant_admin" ? "tenant_admin" : "tenant_staff";
    const profile = {
      id: current?.id || createId("role"),
      tenantSlug,
      key: current?.key || slugify(name),
      name,
      isSystem: Boolean(current?.isSystem),
      baseRole: current?.isSystem ? current.baseRole : baseRole,
      permissions: normalizePermissionMap(
        payload.permissions,
        current?.isSystem ? current.baseRole : baseRole,
      ),
    };

    if (current) {
      Object.assign(current, profile);
    } else {
      profile.tenantSlug = tenant.slug;
      state.roleProfiles.push(profile);
    }

    return buildAdminTenantSnapshot(tenantSlug);
  },
  async deleteRoleProfile(tenantSlug, profileId) {
    const profile = state.roleProfiles.find(
      (item) => item.id === profileId && item.tenantSlug === tenantSlug,
    );
    if (!profile) throw new Error("Perfil não encontrado.");
    if (profile.isSystem)
      throw new Error("Perfis padrão não podem ser excluídos.");
    if (state.users.some((user) => user.roleProfileId === profileId)) {
      throw new Error("Realoque os usuários desse perfil antes de excluir.");
    }

    state.roleProfiles = state.roleProfiles.filter(
      (item) => item.id !== profileId,
    );
    return buildAdminTenantSnapshot(tenantSlug);
  },
  async deleteTenantUser(tenantSlug, id) {
    const tenant = findTenantRecord(tenantSlug);
    const company = getTenantCompany(tenant);
    state.users.splice(
      0,
      state.users.length,
      ...state.users.filter(
        (user) =>
          !(
            user.id === id &&
            (user.tenantSlug === tenantSlug ||
              (user.accessScope === "company" && user.companyId === company.id))
          ),
      ),
    );
    return buildAdminTenantSnapshot(tenantSlug);
  },
};

export const roleProfilesApi = {
  async saveRoleProfile(tenantSlug, payload) {
    await adminApi.saveRoleProfile(tenantSlug, payload);
    const currentUser = await getCurrentMockUser();
    return {
      ...buildTenantBootstrap(tenantSlug),
      currentUserPermissions: getUserPermissionMap(tenantSlug, currentUser),
    };
  },
  async deleteRoleProfile(tenantSlug, id) {
    await adminApi.deleteRoleProfile(tenantSlug, id);
    const currentUser = await getCurrentMockUser();
    return {
      ...buildTenantBootstrap(tenantSlug),
      currentUserPermissions: getUserPermissionMap(tenantSlug, currentUser),
    };
  },
};
