import { supabaseAdmin } from "../lib/supabaseAdmin.js";
import {
  defaultPermissionMap,
  normalizePermissionMap,
} from "../auth/permissions.js";
import { getTenantBootstrap as getTenantBootstrapReadModel } from "../modules/app/tenantBootstrapReadModel.js";
import {
  DEFAULT_INGREDIENT_UNIT_LABELS,
  assertIngredientUnitLabel,
} from "../modules/shared/ingredientUnits.js";
import { getInvalidComboGroup } from "../modules/menu/comboValidation.js";
import { randomUUID } from "node:crypto";

function ensureOk(result, fallbackMessage) {
  if (result.error) {
    const error = new Error(
      result.error.code === "23505"
        ? fallbackMessage
        : result.error.message || fallbackMessage,
    );
    error.statusCode =
      result.error.code === "23505" ? 409 : result.status || 500;
    throw error;
  }

  return result.data;
}

function maybeSingle(result, fallbackMessage) {
  if (result.error && result.status !== 406) {
    const error = new Error(result.error.message || fallbackMessage);
    error.statusCode = result.status || 500;
    throw error;
  }

  return result.data || null;
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

async function getTenantRowBySlug(slug) {
  const tenant = maybeSingle(
    await supabaseAdmin
      .from("tenants")
      .select(
        `
        id,
        slug,
        name,
        business_name,
        company_id,
        branch_code,
        branch_name,
        is_headquarters,
        status,
        companies:company_id (
          id,
          slug,
          name,
          business_name,
          legal_name,
          cnpj,
          address_line,
          status
        )
      `,
      )
      .eq("slug", slug)
      .maybeSingle(),
    "Falha ao carregar tenant.",
  );

  if (!tenant) {
    const error = new Error("Tenant não encontrado.");
    error.statusCode = 404;
    throw error;
  }

  return tenant;
}

function mapEmployee(row, dailyRateTypes = [], scheduledDaysOff = []) {
  return {
    id: row.id,
    name: row.full_name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    maritalStatus: row.marital_status,
    role: row.role,
    notes: row.notes,
    employmentType: row.employment_type,
    status: row.status,
    salary: Number(row.salary || 0),
    admissionDate: row.admission_date || "",
    paymentMode: row.payment_mode,
    baseAmount: Number(row.base_amount || 0),
    weekday: row.weekday,
    specificDate: row.specific_date || "",
    startDate: row.start_date || "",
    controlAttendance: Boolean(row.control_attendance),
    attendanceControlFrom: row.attendance_control_from || "",
    weeklyDayOff: row.weekly_day_off == null ? "" : Number(row.weekly_day_off),
    monthlySundayOffOrdinal:
      row.monthly_sunday_off_ordinal == null
        ? ""
        : Number(row.monthly_sunday_off_ordinal),
    firstPaymentPercentage:
      row.first_payment_percentage == null
        ? null
        : Number(row.first_payment_percentage),
    finalPaymentPercentage:
      row.final_payment_percentage == null
        ? null
        : Number(row.final_payment_percentage),
    dailyRateTypes,
    scheduledDaysOff,
  };
}

function mapTransaction(row) {
  return {
    id: row.id,
    date: row.transaction_date,
    platform: row.platform,
    payment: row.payment,
    amount: Number(row.amount || 0),
    tax: Number(row.tax || 0),
    net: Number(row.net_amount || 0),
    type: row.type,
    category: row.category,
    note: row.note,
    sourceType: row.source_type || "manual",
    sourceId: row.source_id || "",
  };
}

function mapFinancialClosing(row) {
  return {
    id: row.id,
    periodType: row.period_type,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    grossRevenue: Number(row.gross_revenue || 0),
    netRevenue: Number(row.net_revenue || 0),
    orderIncome: Number(row.order_income || 0),
    manualIncome: Number(row.manual_income || 0),
    manualExpenses: Number(row.manual_expenses || 0),
    fixedCosts: Number(row.fixed_costs || 0),
    payrollCosts: Number(row.payroll_costs || 0),
    deliveryCosts: Number(row.delivery_costs || 0),
    channelFees: Number(row.channel_fees || 0),
    totalExpenses: Number(row.total_expenses || 0),
    balance: Number(row.balance || 0),
    status: row.status,
    snapshot: row.snapshot || {},
    closedAt: row.closed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRecurringCost(row) {
  return {
    id: row.id,
    desc: row.description,
    amount: Number(row.amount || 0),
    dueDay: row.due_day,
    lastPaidMonth: row.last_paid_month || "",
  };
}

function mapCustomer(row) {
  return {
    id: row.id,
    name: row.full_name,
    phone: row.phone,
    email: row.email,
    document: row.document,
    addressLine: row.address_line,
    addressNumber: row.address_number,
    addressComplement: row.address_complement,
    district: row.district,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    notes: row.notes,
    status: row.status,
  };
}

function mapPaymentMethod(row) {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    requiresChange: Boolean(row.requires_change),
    status: row.status,
  };
}

function mapDeliveryDriver(row) {
  return {
    id: row.id,
    name: row.full_name,
    phone: row.phone,
    vehicle: row.vehicle,
    dailyRate: Number(row.daily_rate || 0),
    perDeliveryRate: Number(row.per_delivery_rate || 0),
    status: row.status,
    notes: row.notes,
  };
}

function mapOrderItem(row) {
  return {
    id: row.id,
    menuItemId: row.menu_item_id || "",
    productId: row.product_id || "",
    name: row.item_name,
    category: row.item_category || "",
    section: row.item_section || "food",
    quantity: Number(row.quantity || 0),
    unitPrice: Number(row.unit_price || 0),
    totalPrice: Number(row.total_price || 0),
    notes: row.notes,
    sortOrder: row.sort_order,
  };
}

function mapOrder(row) {
  return {
    id: row.id,
    customerId: row.customer_id || "",
    paymentMethodId: row.payment_method_id || "",
    orderNumber: row.order_number,
    channel: row.channel,
    externalSource: row.external_source || "",
    externalId: row.external_id || "",
    externalPayload: row.external_payload || {},
    orderType: row.order_type,
    status: row.status,
    subtotal: Number(row.subtotal_amount || 0),
    deliveryFee: Number(row.delivery_fee || 0),
    discount: Number(row.discount_amount || 0),
    total: Number(row.total_amount || 0),
    platformFee: Number(row.platform_fee_amount || 0),
    paidAmount: Number(row.paid_amount || 0),
    changeAmount: Number(row.change_amount || 0),
    deliveryDriverId: row.delivery_driver_id || "",
    deliveryStatus: row.delivery_status || "waiting",
    dispatchedAt: row.dispatched_at || "",
    deliveredAt: row.delivered_at || "",
    deliveryCost: Number(row.delivery_cost || 0),
    driverDailyAmount: Number(row.driver_daily_amount || 0),
    driverDeliveryAmount: Number(row.driver_delivery_amount || 0),
    cashChangeRequired: Number(row.cash_change_required || 0),
    cardMachineCode: row.card_machine_code || "",
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    customer: row.customers ? mapCustomer(row.customers) : null,
    paymentMethod: row.payment_methods
      ? mapPaymentMethod(row.payment_methods)
      : null,
    deliveryDriver: row.delivery_drivers
      ? mapDeliveryDriver(row.delivery_drivers)
      : null,
    items: (row.order_items || [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(mapOrderItem),
  };
}

function mapSimpleName(row) {
  return { id: row.id, name: row.name };
}

function mapMenuCategory(row) {
  return { id: row.id, name: row.name, sortOrder: Number(row.sort_order || 0) };
}

function mapMenuItem(row) {
  return {
    id: row.id,
    category: row.menu_categories?.name || "",
    description: row.description,
    status: row.status,
    sortOrder: Number(row.sort_order || 0),
    salePrice: Number(row.sale_price || 0),
    basePrice: Number(row.base_price || 0),
    photoPreview: row.photo_preview || "",
    linkedComponents: Array.isArray(row.linked_component_ids)
      ? row.linked_component_ids
      : [],
    itemType: row.item_type === "combo" ? "combo" : "regular",
    name: row.name,
    comboGroups: (row.combo_groups || [])
      .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
      .map((group) => ({
        id: group.id,
        name: group.name,
        minSelect: String(group.min_select),
        maxSelect: String(group.max_select),
        sortOrder: Number(group.sort_order || 0),
        options: (group.combo_options || [])
          .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
          .map((option) => ({
            id: option.id,
            name: option.name,
            sortOrder: Number(option.sort_order || 0),
            photoPreview: option.photo_preview || "",
            extraPrice: String(Number(option.extra_price || 0)),
            maxQty: String(option.max_qty || 1),
            isAvailable: option.is_available,
            linkedCategoryName: normalizeLinkedCategoryNames(option)[0] || "",
            linkedCategoryNames: normalizeLinkedCategoryNames(option),
            linkedComponentRef: option.linked_component_ref || "",
            linkedComponentRefs: option.linked_component_ref
              ? [option.linked_component_ref]
              : [],
          })),
      })),
  };
}

function mapMenuItemType(itemType) {
  return itemType === "combo" ? "combo" : "single";
}

function sanitizeJsonArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeLinkedCategoryNames(option = {}) {
  const categoryNames = sanitizeJsonArray(
    option.linkedCategoryNames || option.linked_category_names,
  );
  const fallback = option.linkedCategoryName || option.linked_category_name;

  return [...categoryNames, fallback].reduce((acc, categoryName) => {
    const normalized = String(categoryName || "").trim();
    if (normalized && !acc.includes(normalized)) acc.push(normalized);
    return acc;
  }, []);
}

function normalizeLinkedComponentRefs(option = {}) {
  const componentRefs = sanitizeJsonArray(
    option.linkedComponentRefs || option.linked_component_refs,
  );
  const fallback = option.linkedComponentRef || option.linked_component_ref;

  return [...componentRefs, fallback].reduce((acc, componentRef) => {
    const normalized = String(componentRef || "").trim();
    if (normalized && !acc.includes(normalized)) acc.push(normalized);
    return acc;
  }, []);
}

function normalizeLinkedComponentRef(option = {}) {
  return normalizeLinkedComponentRefs(option)[0] || "";
}

function normalizeCatalogName(value) {
  return String(value || "")
    .trim()
    .toLocaleUpperCase("pt-BR");
}

function normalizeRecipe(value, { validateUnits = false } = {}) {
  return sanitizeJsonArray(value).map((line) => ({
    componentType:
      line.componentType === "preparation" ? "preparation" : "ingredient",
    componentId: line.componentId,
    quantity: Number(line.quantity) || 0,
    quantityUnit: validateUnits
      ? assertIngredientUnitLabel(
          line.quantityUnit,
          "Unidade da ficha técnica inválida.",
        )
      : line.quantityUnit || "",
  }));
}

function createCatalogDependencyError(message) {
  const error = new Error(message);
  error.statusCode = 409;
  return error;
}

function hasRecipeComponent(recipe, componentType, componentId) {
  return sanitizeJsonArray(recipe).some(
    (line) =>
      line.componentType === componentType &&
      String(line.componentId) === String(componentId),
  );
}

function hasLinkedComponentId(linkedComponentIds, type, id) {
  return sanitizeJsonArray(linkedComponentIds).some((component) => {
    if (typeof component === "string") return component === `${type}:${id}`;
    return component?.type === type && String(component?.id) === String(id);
  });
}

function hasLinkedComponentRef(linkedComponentRef, type, id) {
  return String(linkedComponentRef || "") === `${type}:${id}`;
}

async function getMenuItemById(tenantId, itemId) {
  return maybeSingle(
    await supabaseAdmin
      .from("menu_items")
      .select(
        `
        *,
        menu_categories!menu_items_category_id_fkey ( name ),
        combo_groups!combo_groups_menu_item_id_fkey (
          *,
          combo_options!combo_options_combo_group_id_fkey ( * )
        )
      `,
      )
      .eq("tenant_id", tenantId)
      .eq("id", itemId)
      .maybeSingle(),
    "Falha ao carregar item do menu.",
  );
}

async function resolveMenuCategoryId(tenantId, categoryName) {
  const normalizedName = String(categoryName || "").trim();
  if (!normalizedName) return null;

  const existing = maybeSingle(
    await supabaseAdmin
      .from("menu_categories")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("name", normalizedName)
      .maybeSingle(),
    "Falha ao localizar categoria do menu.",
  );

  if (existing) return existing.id;

  const created = ensureOk(
    await supabaseAdmin
      .from("menu_categories")
      .insert({
        tenant_id: tenantId,
        name: normalizedName,
        sort_order: await getNextMenuCategorySortOrder(tenantId),
      })
      .select("*")
      .single(),
    "Falha ao criar categoria do menu.",
  );

  return created.id;
}

async function getNextMenuCategorySortOrder(tenantId) {
  const row = maybeSingle(
    await supabaseAdmin
      .from("menu_categories")
      .select("sort_order")
      .eq("tenant_id", tenantId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle(),
    "Falha ao calcular ordem da categoria.",
  );

  return Number(row?.sort_order || 0) + 1;
}

async function getNextMenuItemSortOrder(tenantId, categoryId) {
  let query = supabaseAdmin
    .from("menu_items")
    .select("sort_order")
    .eq("tenant_id", tenantId)
    .order("sort_order", { ascending: false })
    .limit(1);

  query = categoryId
    ? query.eq("category_id", categoryId)
    : query.is("category_id", null);

  const row = maybeSingle(
    await query.maybeSingle(),
    "Falha ao calcular ordem do item.",
  );

  return Number(row?.sort_order || 0) + 1;
}

async function replaceComboGroups({ tenantId, menuItemId, comboGroups = [] }) {
  ensureOk(
    await supabaseAdmin
      .from("combo_groups")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("menu_item_id", menuItemId),
    "Falha ao limpar grupos do combo.",
  );

  const groupRows = sanitizeJsonArray(comboGroups).map((group, groupIndex) => ({
    tenant_id: tenantId,
    menu_item_id: menuItemId,
    name: String(group.name || "").trim(),
    min_select: Number(group.minSelect) || 0,
    max_select: Number(group.maxSelect) || 1,
    sort_order: groupIndex,
  }));

  if (groupRows.length === 0) return;

  const savedGroups = ensureOk(
    await supabaseAdmin
      .from("combo_groups")
      .insert(groupRows)
      .select("id, sort_order"),
    "Falha ao salvar grupos do combo.",
  );

  const groupIdBySortOrder = new Map(
    savedGroups.map((group) => [Number(group.sort_order || 0), group.id]),
  );

  const options = sanitizeJsonArray(comboGroups)
    .flatMap((group, groupIndex) =>
      sanitizeJsonArray(group.options).map((option, optionIndex) => ({
        tenant_id: tenantId,
        combo_group_id: groupIdBySortOrder.get(groupIndex),
        name: String(option.name || "").trim(),
        photo_preview: option.photoPreview || "",
        extra_price: Number(option.extraPrice) || 0,
        max_qty: Number(option.maxQty) || 1,
        is_available: option.isAvailable !== false,
        linked_category_name: normalizeLinkedCategoryNames(option)[0] || "",
        linked_category_names: normalizeLinkedCategoryNames(option),
        linked_component_ref: normalizeLinkedComponentRef(option),
        sort_order: optionIndex,
      })),
    )
    .filter((option) => option.combo_group_id);

  if (options.length > 0) {
    ensureOk(
      await supabaseAdmin.from("combo_options").insert(options),
      "Falha ao salvar opções do combo.",
    );
  }
}

function mapReview(row) {
  return {
    id: row.id,
    source: row.source,
    sourceReviewId: row.source_review_id,
    companyKey: row.company_key,
    companyLabel: row.company_label,
    unitLabel: row.unit_label,
    channelLabel: row.channel_label,
    reviewerName: row.reviewer_name,
    reviewerInitials: row.reviewer_initials,
    reviewerLocation: row.reviewer_location,
    rating: row.rating,
    sentiment: row.sentiment,
    status: row.status,
    resolutionType: row.resolution_type,
    createdAtLabel: row.created_at_label,
    publishedReply: row.published_reply,
    tags: Array.isArray(row.tags) ? row.tags : [],
    comment: row.comment,
    aiSuggestion: row.ai_suggestion,
    integrationStatus: row.integration_status,
  };
}

function mapPreparation(row) {
  return {
    id: row.id,
    name: row.name,
    yieldQuantity: Number(row.yield_quantity || 0),
    yieldUnit: row.yield_unit,
    recipe: Array.isArray(row.recipe) ? row.recipe : [],
  };
}

function mapProduct(row) {
  return {
    id: row.id,
    name: row.name,
    salePrice: Number(row.sale_price || 0),
    yieldQuantity: Number(row.yield_quantity || 0),
    targetCmvPercent: Number(row.target_cmv_percent || 0),
    recipe: Array.isArray(row.recipe) ? row.recipe : [],
  };
}

function mapIngredient(row) {
  const packageQuantity = Number(row.package_quantity || 0);
  const packageCost = Number(row.package_cost || 0);
  const fallbackUnitCost =
    packageQuantity > 0 ? packageCost / packageQuantity : packageCost;

  return {
    id: row.id,
    name: row.name,
    unit: row.unit,
    packageQuantity,
    packageCost,
    unitCost: Number(row.unit_cost || fallbackUnitCost),
    category: row.category || "GERAL",
    primarySupplierId: row.primary_supplier_id || "",
    stockMinimum: row.stock_minimum == null ? null : Number(row.stock_minimum),
    active: row.active !== false,
  };
}

async function ensureDefaultIngredientUnits(tenantId) {
  const existingUnits = ensureOk(
    await supabaseAdmin
      .from("ingredient_units")
      .select("label")
      .eq("tenant_id", tenantId),
    "Falha ao carregar unidades padrão.",
  );
  const existingLabels = new Set(
    existingUnits.map((unit) =>
      String(unit.label || "")
        .trim()
        .toLowerCase(),
    ),
  );
  const missingRows = DEFAULT_INGREDIENT_UNIT_LABELS.filter(
    (label) => !existingLabels.has(label.toLowerCase()),
  ).map((label) => ({
    id: randomUUID(),
    tenant_id: tenantId,
    label,
  }));

  if (missingRows.length > 0) {
    ensureOk(
      await supabaseAdmin.from("ingredient_units").insert(missingRows),
      "Falha ao criar unidades padrão.",
    );
  }
}

function mapMembership(row) {
  return {
    id: row.id,
    role: row.role,
    roleProfileId: row.role_profile_id || "",
    company: row.companies
      ? {
          id: row.companies.id,
          slug: row.companies.slug,
          name: row.companies.name,
          businessName: row.companies.business_name,
          legalName:
            row.companies.legal_name || row.companies.business_name || "",
          cnpj: row.companies.cnpj || "",
          address: row.companies.address_line || "",
          status: row.companies.status,
        }
      : null,
    tenant: row.tenants
      ? {
          id: row.tenants.id,
          slug: row.tenants.slug,
          name: row.tenants.name,
          businessName: row.tenants.business_name,
          companyId: row.tenants.company_id,
          status: row.tenants.status,
        }
      : null,
  };
}

function mapTenantOption(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    businessName: row.business_name,
    companyId: row.company_id,
    branchCode: row.branch_code || row.slug,
    branchName: row.branch_name || row.name,
    isHeadquarters: Boolean(row.is_headquarters),
    status: row.status,
    company: row.companies
      ? {
          id: row.companies.id,
          slug: row.companies.slug,
          name: row.companies.name,
          businessName: row.companies.business_name,
          status: row.companies.status,
        }
      : null,
  };
}

function mapCompanyOption(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    businessName: row.business_name,
    legalName: row.legal_name || row.business_name || "",
    cnpj: row.cnpj || "",
    address: row.address_line || "",
    status: row.status,
  };
}

function mapRoleProfile(row, permissionsByProfileId = new Map()) {
  const permissionRows = permissionsByProfileId.get(row.id) || [];
  const permissionMap = Object.fromEntries(
    permissionRows.map((permission) => [
      permission.permission_key,
      Boolean(permission.enabled),
    ]),
  );

  return {
    id: row.id,
    key: row.key,
    name: row.name,
    isSystem: Boolean(row.is_system),
    baseRole: row.base_role,
    permissions: normalizePermissionMap(permissionMap, row.base_role),
  };
}

async function ensureTenantRoleProfiles(tenant) {
  const defaults = [
    {
      tenant_id: tenant.id,
      key: "admin",
      name: "Admin",
      is_system: true,
      base_role: "tenant_admin",
    },
    {
      tenant_id: tenant.id,
      key: "staff",
      name: "Staff",
      is_system: true,
      base_role: "tenant_staff",
    },
  ];

  ensureOk(
    await supabaseAdmin
      .from("tenant_role_profiles")
      .upsert(defaults, { onConflict: "tenant_id,key" }),
    "Falha ao garantir perfis padrão.",
  );

  const rows = ensureOk(
    await supabaseAdmin
      .from("tenant_role_profiles")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("is_system", { ascending: false })
      .order("created_at", { ascending: true }),
    "Falha ao carregar perfis de permissões.",
  );

  const existingPermissionRows =
    rows.length === 0
      ? []
      : ensureOk(
          await supabaseAdmin
            .from("tenant_role_permissions")
            .select("*")
            .in(
              "tenant_role_profile_id",
              rows.map((row) => row.id),
            ),
          "Falha ao carregar permissões dos perfis.",
        );

  const existingPairs = new Set(
    existingPermissionRows.map(
      (row) => `${row.tenant_role_profile_id}:${row.permission_key}`,
    ),
  );
  const missingPermissionRows = rows.flatMap((row) => {
    const defaultsForRole = defaultPermissionMap(row.base_role);
    return Object.entries(defaultsForRole)
      .filter(
        ([permissionKey]) => !existingPairs.has(`${row.id}:${permissionKey}`),
      )
      .map(([permissionKey, enabled]) => ({
        tenant_role_profile_id: row.id,
        permission_key: permissionKey,
        enabled,
      }));
  });

  if (missingPermissionRows.length > 0) {
    ensureOk(
      await supabaseAdmin
        .from("tenant_role_permissions")
        .insert(missingPermissionRows),
      "Falha ao criar permissões padrão.",
    );
  }

  const permissionRows =
    missingPermissionRows.length === 0
      ? existingPermissionRows
      : ensureOk(
          await supabaseAdmin
            .from("tenant_role_permissions")
            .select("*")
            .in(
              "tenant_role_profile_id",
              rows.map((row) => row.id),
            ),
          "Falha ao recarregar permissões dos perfis.",
        );
  const permissionsByProfileId = permissionRows.reduce((acc, row) => {
    if (!acc.has(row.tenant_role_profile_id))
      acc.set(row.tenant_role_profile_id, []);
    acc.get(row.tenant_role_profile_id).push(row);
    return acc;
  }, new Map());

  return rows.map((row) => mapRoleProfile(row, permissionsByProfileId));
}

async function getOptionalTenantRowBySlug(slug) {
  if (!slug) return null;

  return maybeSingle(
    await supabaseAdmin
      .from("tenants")
      .select(
        `
        id,
        slug,
        name,
        business_name,
        company_id,
        branch_code,
        branch_name,
        is_headquarters,
        status,
        companies:company_id (
          id,
          slug,
          name,
          business_name,
          legal_name,
          cnpj,
          address_line,
          status
        )
      `,
      )
      .eq("slug", slug)
      .maybeSingle(),
    "Falha ao carregar tenant.",
  );
}

async function getDiscountsByEmployee(tenantId) {
  const rows = ensureOk(
    await supabaseAdmin
      .from("employee_discounts")
      .select("*")
      .eq("tenant_id", tenantId),
    "Falha ao carregar descontos de funcionários.",
  );

  return rows.reduce((acc, row) => {
    const employeeId = row.employee_id;
    if (!acc[employeeId]) acc[employeeId] = [];
    acc[employeeId].push({
      id: row.id,
      category: row.category,
      amount: Number(row.amount || 0),
    });
    return acc;
  }, {});
}

export async function getAuthSession(identity) {
  const directMemberships = ensureOk(
    await supabaseAdmin
      .from("tenant_memberships")
      .select(
        `
        id,
        role,
        role_profile_id,
        companies:company_id (
          id,
          slug,
          name,
          business_name,
          status
        ),
        tenants:tenant_id (
          id,
          slug,
          name,
          business_name,
          company_id,
          status
        )
      `,
      )
      .eq("user_id", identity.user.id),
    "Falha ao carregar memberships.",
  ).map(mapMembership);

  const companyAdminIds = [
    ...new Set(
      directMemberships
        .filter(
          (membership) =>
            membership.role === "tenant_admin" && membership.company?.id,
        )
        .map((membership) => membership.company.id),
    ),
  ];
  const companyBranches =
    companyAdminIds.length === 0
      ? []
      : ensureOk(
          await supabaseAdmin
            .from("tenants")
            .select(
              `
            id,
            slug,
            name,
            business_name,
            company_id,
              branch_code,
              branch_name,
              is_headquarters,
              status,
            companies:company_id (
              id,
              slug,
              name,
              business_name,
              status
            )
          `,
            )
            .in("company_id", companyAdminIds),
          "Falha ao carregar filiais da empresa.",
        );
  const membershipByTenantSlug = new Map();

  directMemberships.forEach((membership) => {
    if (membership.tenant?.slug) {
      membershipByTenantSlug.set(membership.tenant.slug, membership);
    }
  });

  companyBranches.forEach((tenant) => {
    if (!membershipByTenantSlug.has(tenant.slug)) {
      membershipByTenantSlug.set(tenant.slug, {
        id: `company:${tenant.company_id}:tenant:${tenant.id}`,
        role: "tenant_admin",
        roleProfileId: "",
        company: mapTenantOption(tenant).company,
        tenant: mapTenantOption(tenant),
      });
    }
  });

  const memberships = [
    ...directMemberships.filter((membership) => !membership.tenant),
    ...membershipByTenantSlug.values(),
  ];
  const currentTenant =
    memberships.find((item) => item.tenant && item.role !== "super_admin")
      ?.tenant || null;

  return {
    user: {
      id: identity.user.id,
      email: identity.user.email,
      name: identity.user.metadata.full_name || identity.user.email,
      role: identity.isSuperAdmin
        ? "super_admin"
        : memberships[0]?.role || "tenant_staff",
    },
    memberships,
    accessibleTenants: memberships
      .filter((membership) => membership.tenant)
      .map((membership) => ({
        slug: membership.tenant.slug,
        role: membership.role,
        roleProfileId: membership.roleProfileId || "",
      })),
    currentTenant,
  };
}

export async function getTenantBootstrap(tenantSlug) {
  return getTenantBootstrapReadModel(tenantSlug);
}

export async function getAdminBootstrap(selectedTenantSlug = "") {
  const [companies, tenants] = await Promise.all([
    ensureOk(
      await supabaseAdmin
        .from("companies")
        .select(
          "id, slug, name, business_name, legal_name, cnpj, address_line, status",
        )
        .order("created_at", { ascending: true }),
      "Falha ao carregar empresas.",
    ),
    ensureOk(
      await supabaseAdmin
        .from("tenants")
        .select(
          `
          id,
          slug,
          name,
          business_name,
          company_id,
          branch_code,
          branch_name,
          is_headquarters,
          status,
          companies:company_id (
            id,
            slug,
            name,
            business_name,
            legal_name,
            cnpj,
            address_line,
            status
          )
        `,
        )
        .order("created_at", { ascending: true }),
      "Falha ao carregar tenants.",
    ),
  ]);

  const chosenSlug = selectedTenantSlug || tenants[0]?.slug || "";

  return {
    availableCompanies: companies.map(mapCompanyOption),
    availableTenants: tenants.map(mapTenantOption),
    selectedTenantSlug: chosenSlug,
    selectedTenant: chosenSlug
      ? await getAdminTenantSnapshot(chosenSlug)
      : null,
  };
}

export async function getAdminTenantSnapshot(tenantSlug) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const bootstrap = await getTenantBootstrap(tenantSlug);
  const branchMemberships = ensureOk(
    await supabaseAdmin
      .from("tenant_memberships")
      .select("id, role, role_profile_id, user_id, tenant_id, company_id")
      .eq("tenant_id", tenant.id),
    "Falha ao carregar usuários do tenant.",
  );
  const companyMemberships = ensureOk(
    await supabaseAdmin
      .from("tenant_memberships")
      .select("id, role, role_profile_id, user_id, tenant_id, company_id")
      .eq("company_id", tenant.company_id)
      .is("tenant_id", null),
    "Falha ao carregar usuários da empresa.",
  );
  const memberships = [...branchMemberships, ...companyMemberships];
  const roleProfilesById = new Map(
    (bootstrap.roleProfiles || []).map((profile) => [profile.id, profile]),
  );
  const profileIds = [
    ...new Set(memberships.map((row) => row.user_id).filter(Boolean)),
  ];
  const profiles =
    profileIds.length === 0
      ? []
      : ensureOk(
          await supabaseAdmin
            .from("profiles")
            .select("id, full_name, email")
            .in("id", profileIds),
          "Falha ao carregar perfis dos usuários.",
        );
  const profilesById = new Map(
    profiles.map((profile) => [
      profile.id,
      {
        fullName: profile.full_name || "",
        email: profile.email || "",
      },
    ]),
  );

  return {
    tenant: {
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
            status: tenant.companies.status,
          }
        : null,
    },
    summary: {
      users: memberships.length,
      employees: bootstrap.employees.length,
      salesChannels: bootstrap.salesChannels.length,
      recurringCosts: bootstrap.recurringCosts.length,
      transactions: bootstrap.transactions.length,
    },
    users: memberships.map((row) => {
      const profile = profilesById.get(row.user_id);
      const roleProfile =
        roleProfilesById.get(row.role_profile_id) ||
        (bootstrap.roleProfiles || []).find(
          (item) => item.baseRole === row.role,
        );

      return {
        id: row.user_id,
        name: profile?.fullName || profile?.email || "Usuário",
        email: profile?.email || "",
        role: row.role,
        roleProfileId: roleProfile?.id || "",
        roleProfileName: roleProfile?.name || "",
        tenantSlug,
        accessScope: row.tenant_id ? "branch" : "company",
      };
    }),
    roleProfiles: bootstrap.roleProfiles,
    data: {
      settings: bootstrap.settings,
      aiBehaviorSettings: bootstrap.aiBehaviorSettings,
      payrollConfig: bootstrap.payrollConfig,
      employees: bootstrap.employees,
      recurringCosts: bootstrap.recurringCosts,
      salesChannels: bootstrap.salesChannels,
      financeExpenseCategories: bootstrap.financeExpenseCategories,
      transactions: bootstrap.transactions,
    },
  };
}

function remapRecipeIds(
  recipe,
  { ingredientIds = new Map(), preparationIds = new Map() },
) {
  return sanitizeJsonArray(recipe)
    .map((line) => {
      if (line.componentType === "ingredient") {
        const componentId = ingredientIds.get(String(line.componentId));
        return componentId ? { ...line, componentId } : null;
      }

      if (line.componentType === "preparation") {
        const componentId = preparationIds.get(String(line.componentId));
        return componentId ? { ...line, componentId } : null;
      }

      return null;
    })
    .filter(Boolean);
}

function remapLinkedComponentsForTenant(components, maps, allowCmv) {
  if (!allowCmv) return [];

  return sanitizeJsonArray(components)
    .map((component) => {
      const type =
        typeof component === "string"
          ? component.split(":")[0]
          : component?.type;
      const id =
        typeof component === "string" ? component.split(":")[1] : component?.id;
      const componentId = maps[`${type}Ids`]?.get(String(id));
      return componentId ? { type, id: componentId } : null;
    })
    .filter(Boolean);
}

function remapLinkedComponentRefForTenant(
  ref,
  maps,
  { allowCmv = false, allowMenu = false } = {},
) {
  const [type, id] = String(ref || "").split(":");
  if (!type || !id) return "";

  if (type === "menu-item" && allowMenu) {
    const nextId = maps.menuItemIds?.get(String(id));
    return nextId ? `menu-item:${nextId}` : "";
  }

  if (!allowCmv) return "";

  const nextId = maps[`${type}Ids`]?.get(String(id));
  return nextId ? `${type}:${nextId}` : "";
}

async function findHeadquartersTenant(companyId, targetTenantId) {
  return maybeSingle(
    await supabaseAdmin
      .from("tenants")
      .select("id, slug")
      .eq("company_id", companyId)
      .eq("is_headquarters", true)
      .neq("id", targetTenantId)
      .limit(1)
      .maybeSingle(),
    "Falha ao localizar matriz.",
  );
}

async function copyCmvFromTenant(sourceTenantId, targetTenantId) {
  const maps = {
    ingredientIds: new Map(),
    preparationIds: new Map(),
    productIds: new Map(),
  };

  const [ingredients, preparations, products] = await Promise.all([
    ensureOk(
      await supabaseAdmin
        .from("ingredients")
        .select("*")
        .eq("tenant_id", sourceTenantId),
      "Falha ao carregar insumos da matriz.",
    ),
    ensureOk(
      await supabaseAdmin
        .from("preparations")
        .select("*")
        .eq("tenant_id", sourceTenantId),
      "Falha ao carregar receitas da matriz.",
    ),
    ensureOk(
      await supabaseAdmin
        .from("products")
        .select("*")
        .eq("tenant_id", sourceTenantId),
      "Falha ao carregar produtos da matriz.",
    ),
  ]);

  const ingredientRows = ingredients.map((ingredient) => {
    const id = randomUUID();
    maps.ingredientIds.set(String(ingredient.id), id);
    return {
      id,
      tenant_id: targetTenantId,
      name: ingredient.name,
      unit: ingredient.unit,
      package_quantity: ingredient.package_quantity,
      package_cost: ingredient.package_cost,
      unit_cost: ingredient.unit_cost,
    };
  });
  if (ingredientRows.length > 0) {
    ensureOk(
      await supabaseAdmin.from("ingredients").insert(ingredientRows),
      "Falha ao importar insumos da matriz.",
    );
  }

  const preparationRows = preparations.map((preparation) => {
    const id = randomUUID();
    maps.preparationIds.set(String(preparation.id), id);
    return {
      id,
      tenant_id: targetTenantId,
      name: preparation.name,
      yield_quantity: preparation.yield_quantity,
      yield_unit: preparation.yield_unit,
      recipe: [],
    };
  });
  if (preparationRows.length > 0) {
    ensureOk(
      await supabaseAdmin.from("preparations").insert(preparationRows),
      "Falha ao importar receitas da matriz.",
    );
  }
  for (const preparation of preparations) {
    ensureOk(
      await supabaseAdmin
        .from("preparations")
        .update({ recipe: remapRecipeIds(preparation.recipe, maps) })
        .eq("tenant_id", targetTenantId)
        .eq("id", maps.preparationIds.get(String(preparation.id))),
      "Falha ao remapear receitas da matriz.",
    );
  }

  const productRows = products.map((product) => {
    const id = randomUUID();
    maps.productIds.set(String(product.id), id);
    return {
      id,
      tenant_id: targetTenantId,
      name: product.name,
      sale_price: product.sale_price,
      yield_quantity: product.yield_quantity,
      target_cmv_percent: product.target_cmv_percent,
      recipe: remapRecipeIds(product.recipe, maps),
    };
  });
  if (productRows.length > 0) {
    ensureOk(
      await supabaseAdmin.from("products").insert(productRows),
      "Falha ao importar produtos da matriz.",
    );
  }

  return maps;
}

async function copyMenuFromTenant(
  sourceTenantId,
  targetTenantId,
  maps,
  allowCmv,
) {
  const [categories, items, groups, options] = await Promise.all([
    ensureOk(
      await supabaseAdmin
        .from("menu_categories")
        .select("*")
        .eq("tenant_id", sourceTenantId),
      "Falha ao carregar categorias da matriz.",
    ),
    ensureOk(
      await supabaseAdmin
        .from("menu_items")
        .select("*")
        .eq("tenant_id", sourceTenantId),
      "Falha ao carregar cardápio da matriz.",
    ),
    ensureOk(
      await supabaseAdmin
        .from("combo_groups")
        .select("*")
        .eq("tenant_id", sourceTenantId),
      "Falha ao carregar grupos de combo da matriz.",
    ),
    ensureOk(
      await supabaseAdmin
        .from("combo_options")
        .select("*")
        .eq("tenant_id", sourceTenantId),
      "Falha ao carregar opções de combo da matriz.",
    ),
  ]);

  const categoryIds = new Map();
  const categoryRows = categories.map((category) => {
    const id = randomUUID();
    categoryIds.set(String(category.id), id);
    return {
      id,
      tenant_id: targetTenantId,
      name: category.name,
    };
  });
  if (categoryRows.length > 0) {
    ensureOk(
      await supabaseAdmin.from("menu_categories").insert(categoryRows),
      "Falha ao importar categorias da matriz.",
    );
  }

  const menuItemIds = new Map();
  const itemRows = items.map((item) => {
    const id = randomUUID();
    menuItemIds.set(String(item.id), id);
    return {
      id,
      tenant_id: targetTenantId,
      category_id: item.category_id
        ? categoryIds.get(String(item.category_id)) || null
        : null,
      item_type: item.item_type,
      name: item.name,
      description: item.description,
      status: item.status,
      sale_price: item.sale_price,
      base_price: item.base_price,
      photo_preview: item.photo_preview,
      linked_component_ids: remapLinkedComponentsForTenant(
        item.linked_component_ids,
        maps,
        allowCmv,
      ),
    };
  });
  if (itemRows.length > 0) {
    ensureOk(
      await supabaseAdmin.from("menu_items").insert(itemRows),
      "Falha ao importar itens do cardápio da matriz.",
    );
  }

  const groupIds = new Map();
  const groupRows = groups
    .filter((group) => menuItemIds.has(String(group.menu_item_id)))
    .map((group) => {
      const id = randomUUID();
      groupIds.set(String(group.id), id);
      return {
        id,
        tenant_id: targetTenantId,
        menu_item_id: menuItemIds.get(String(group.menu_item_id)),
        name: group.name,
        min_select: group.min_select,
        max_select: group.max_select,
        sort_order: group.sort_order,
      };
    });
  if (groupRows.length > 0) {
    ensureOk(
      await supabaseAdmin.from("combo_groups").insert(groupRows),
      "Falha ao importar grupos de combo da matriz.",
    );
  }

  const refMaps = { ...maps, menuItemIds };
  const optionRows = options
    .filter((option) => groupIds.has(String(option.combo_group_id)))
    .map((option) => ({
      id: randomUUID(),
      tenant_id: targetTenantId,
      combo_group_id: groupIds.get(String(option.combo_group_id)),
      name: option.name,
      photo_preview: option.photo_preview,
      extra_price: option.extra_price,
      max_qty: option.max_qty,
      is_available: option.is_available,
      linked_category_name: option.linked_category_name,
      linked_category_names: normalizeLinkedCategoryNames(option),
      linked_component_ref: remapLinkedComponentRefForTenant(
        option.linked_component_ref,
        refMaps,
        {
          allowCmv,
          allowMenu: true,
        },
      ),
      sort_order: option.sort_order,
    }));
  if (optionRows.length > 0) {
    ensureOk(
      await supabaseAdmin.from("combo_options").insert(optionRows),
      "Falha ao importar opções de combo da matriz.",
    );
  }
}

async function importHeadquartersBootstrap({
  companyId,
  tenantId,
  importMenuFromHeadquarters,
  importCmvFromHeadquarters,
}) {
  if (!importMenuFromHeadquarters && !importCmvFromHeadquarters) return;

  const sourceTenant = await findHeadquartersTenant(companyId, tenantId);
  if (!sourceTenant) {
    const error = new Error(
      "Essa empresa não tem filial matriz para importar dados.",
    );
    error.statusCode = 400;
    throw error;
  }

  const maps = importCmvFromHeadquarters
    ? await copyCmvFromTenant(sourceTenant.id, tenantId)
    : {
        ingredientIds: new Map(),
        preparationIds: new Map(),
        productIds: new Map(),
      };

  if (importMenuFromHeadquarters) {
    await copyMenuFromTenant(
      sourceTenant.id,
      tenantId,
      maps,
      importCmvFromHeadquarters,
    );
  }
}

export async function upsertTenant({
  tenantSlug,
  name,
  businessName,
  companyId = "",
  companySlug = "",
  companyName = "",
  branchCode = "",
  branchName = "",
  isHeadquarters,
  importMenuFromHeadquarters = false,
  importCmvFromHeadquarters = false,
}) {
  const normalizedTenantSlug = slugify(
    tenantSlug || branchCode || branchName || name,
  );

  if (!normalizedTenantSlug) {
    throw new Error("Slug do tenant é obrigatório.");
  }

  const current =
    (await getOptionalTenantRowBySlug(normalizedTenantSlug)) ||
    (await getOptionalTenantRowBySlug(tenantSlug));
  let company = null;

  if (companyId) {
    company = maybeSingle(
      await supabaseAdmin
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .maybeSingle(),
      "Falha ao localizar empresa.",
    );

    if (!company) {
      const error = new Error("Empresa não encontrada.");
      error.statusCode = 404;
      throw error;
    }
  } else {
    const resolvedCompanySlug =
      current?.companies?.slug ||
      slugify(companySlug || businessName || companyName || name || tenantSlug);
    const resolvedCompanyName = companyName || businessName || name;

    company = ensureOk(
      await supabaseAdmin
        .from("companies")
        .upsert(
          {
            id: current?.company_id || undefined,
            slug: resolvedCompanySlug,
            name: resolvedCompanyName,
            business_name: businessName || resolvedCompanyName,
            status: "active",
          },
          { onConflict: "slug" },
        )
        .select("*")
        .single(),
      "Falha ao salvar empresa.",
    );
  }

  const payload = {
    slug: normalizedTenantSlug,
    name,
    business_name: businessName || name,
    company_id: company.id,
    branch_code: branchCode
      ? slugify(branchCode)
      : current?.branch_code || normalizedTenantSlug,
    branch_name: branchName || current?.branch_name || name,
    is_headquarters:
      typeof isHeadquarters === "boolean"
        ? isHeadquarters
        : (current?.is_headquarters ?? false),
    status: "active",
  };

  const tenant = ensureOk(
    await supabaseAdmin
      .from("tenants")
      .upsert(current ? { ...payload, id: current.id } : payload)
      .select("*")
      .single(),
    "Falha ao salvar tenant.",
  );

  await supabaseAdmin.from("tenant_settings").upsert({
    tenant_id: tenant.id,
    business_name: businessName || name,
  });

  if (!current) {
    await importHeadquartersBootstrap({
      companyId: company.id,
      tenantId: tenant.id,
      importMenuFromHeadquarters,
      importCmvFromHeadquarters,
    });
    await ensureDefaultIngredientUnits(tenant.id);
  }

  return tenant;
}

export async function upsertCompany({
  id = "",
  name,
  slug = "",
  businessName = "",
  legalName = "",
  cnpj = "",
  address = "",
}) {
  const normalizedName = String(name || "").trim();
  const normalizedSlug = slugify(slug || normalizedName);

  if (!normalizedName) {
    throw new Error("Nome da empresa é obrigatório.");
  }

  if (!normalizedSlug) {
    throw new Error("Slug da empresa é obrigatório.");
  }

  const row = ensureOk(
    await supabaseAdmin
      .from("companies")
      .upsert(
        {
          id: id || undefined,
          slug: normalizedSlug,
          name: normalizedName,
          business_name: String(businessName || normalizedName).trim(),
          legal_name: String(
            legalName || businessName || normalizedName,
          ).trim(),
          cnpj: String(cnpj || "").trim(),
          address_line: String(address || "").trim(),
          status: "active",
        },
        { onConflict: id ? "id" : "slug" },
      )
      .select("*")
      .single(),
    "Falha ao salvar empresa.",
  );

  return mapCompanyOption(row);
}

export async function deleteCompanyById(companyId) {
  const company = maybeSingle(
    await supabaseAdmin
      .from("companies")
      .select(
        "id, slug, name, business_name, legal_name, cnpj, address_line, status",
      )
      .eq("id", companyId)
      .maybeSingle(),
    "Falha ao localizar empresa.",
  );

  if (!company) {
    const error = new Error("Empresa não encontrada.");
    error.statusCode = 404;
    throw error;
  }

  const tenants = ensureOk(
    await supabaseAdmin
      .from("tenants")
      .select("id")
      .eq("company_id", company.id),
    "Falha ao carregar filiais da empresa.",
  );
  const tenantIds = tenants.map((tenant) => tenant.id);

  if (tenantIds.length > 0) {
    ensureOk(
      await supabaseAdmin
        .from("tenant_memberships")
        .delete()
        .in("tenant_id", tenantIds),
      "Falha ao remover memberships das filiais.",
    );
  }

  ensureOk(
    await supabaseAdmin
      .from("tenant_memberships")
      .delete()
      .eq("company_id", company.id),
    "Falha ao remover memberships da empresa.",
  );
  ensureOk(
    await supabaseAdmin.from("tenants").delete().eq("company_id", company.id),
    "Falha ao remover filiais da empresa.",
  );
  ensureOk(
    await supabaseAdmin.from("companies").delete().eq("id", company.id),
    "Falha ao remover empresa.",
  );

  return mapCompanyOption(company);
}

export async function deleteTenantBySlug(tenantSlug) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  ensureOk(
    await supabaseAdmin
      .from("tenant_memberships")
      .delete()
      .eq("tenant_id", tenant.id),
    "Falha ao remover memberships.",
  );
  ensureOk(
    await supabaseAdmin.from("tenants").delete().eq("id", tenant.id),
    "Falha ao remover tenant.",
  );
  return tenant;
}

export async function saveTenantUser({ tenantSlug, payload }) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const roleProfiles = await ensureTenantRoleProfiles(tenant);
  let userId = payload.id;

  if (!userId) {
    const createdUser = await supabaseAdmin.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true,
      user_metadata: {
        full_name: payload.name,
      },
    });

    if (createdUser.error || !createdUser.data.user) {
      throw new Error(createdUser.error?.message || "Falha ao criar usuário.");
    }

    userId = createdUser.data.user.id;
  } else {
    const updated = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email: payload.email,
      password: payload.password || undefined,
      user_metadata: {
        full_name: payload.name,
      },
    });

    if (updated.error) {
      throw new Error(updated.error.message || "Falha ao atualizar usuário.");
    }
  }

  ensureOk(
    await supabaseAdmin.from("profiles").upsert({
      id: userId,
      full_name: payload.name,
      email: payload.email,
      status: "active",
    }),
    "Falha ao sincronizar perfil.",
  );

  const roleProfile =
    roleProfiles.find((profile) => profile.id === payload.roleProfileId) ||
    roleProfiles.find((profile) => profile.baseRole === payload.role) ||
    roleProfiles.find((profile) => profile.key === "staff");
  const membershipRole =
    roleProfile?.baseRole === "tenant_admin" ? "tenant_admin" : "tenant_staff";
  const accessScope =
    payload.accessScope === "company" && membershipRole === "tenant_admin"
      ? "company"
      : "branch";

  if (accessScope === "company") {
    ensureOk(
      await supabaseAdmin
        .from("tenant_memberships")
        .delete()
        .eq("user_id", userId)
        .eq("company_id", tenant.company_id)
        .is("tenant_id", null),
      "Falha ao substituir membership da empresa.",
    );
    ensureOk(
      await supabaseAdmin.from("tenant_memberships").insert({
        user_id: userId,
        company_id: tenant.company_id,
        tenant_id: null,
        role: membershipRole,
        role_profile_id: roleProfile?.id || null,
      }),
      "Falha ao salvar membership da empresa.",
    );
  } else {
    ensureOk(
      await supabaseAdmin
        .from("tenant_memberships")
        .delete()
        .eq("user_id", userId)
        .eq("tenant_id", tenant.id),
      "Falha ao substituir membership da filial.",
    );
    ensureOk(
      await supabaseAdmin.from("tenant_memberships").insert({
        user_id: userId,
        company_id: tenant.company_id,
        tenant_id: tenant.id,
        role: membershipRole,
        role_profile_id: roleProfile?.id || null,
      }),
      "Falha ao salvar membership.",
    );
  }

  return getAdminTenantSnapshot(tenantSlug);
}

export async function deleteTenantUserById({ tenantSlug, userId }) {
  const tenant = await getTenantRowBySlug(tenantSlug);

  ensureOk(
    await supabaseAdmin
      .from("tenant_memberships")
      .delete()
      .eq("user_id", userId)
      .eq("tenant_id", tenant.id),
    "Falha ao remover membership.",
  );
  ensureOk(
    await supabaseAdmin
      .from("tenant_memberships")
      .delete()
      .eq("user_id", userId)
      .eq("company_id", tenant.company_id)
      .is("tenant_id", null),
    "Falha ao remover membership da empresa.",
  );

  return getAdminTenantSnapshot(tenantSlug);
}

export async function saveTenantRoleProfile({ tenantSlug, payload }) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  await ensureTenantRoleProfiles(tenant);
  const name = String(payload.name || "").trim();

  if (!name) {
    throw new Error("Nome do perfil é obrigatório.");
  }

  const current = payload.id
    ? maybeSingle(
        await supabaseAdmin
          .from("tenant_role_profiles")
          .select("*")
          .eq("id", payload.id)
          .eq("tenant_id", tenant.id)
          .maybeSingle(),
        "Falha ao localizar perfil.",
      )
    : null;
  const baseRole =
    payload.baseRole === "tenant_admin" ? "tenant_admin" : "tenant_staff";
  const profileRow = ensureOk(
    await supabaseAdmin
      .from("tenant_role_profiles")
      .upsert(
        {
          id: current?.id || undefined,
          tenant_id: tenant.id,
          key: current?.key || slugify(name),
          name,
          is_system: Boolean(current?.is_system),
          base_role: current?.is_system ? current.base_role : baseRole,
        },
        { onConflict: current ? "id" : "tenant_id,key" },
      )
      .select("*")
      .single(),
    "Falha ao salvar perfil de permissões.",
  );
  const permissionMap = normalizePermissionMap(
    payload.permissions,
    profileRow.base_role,
  );

  ensureOk(
    await supabaseAdmin
      .from("tenant_role_permissions")
      .delete()
      .eq("tenant_role_profile_id", profileRow.id),
    "Falha ao substituir permissões do perfil.",
  );
  ensureOk(
    await supabaseAdmin.from("tenant_role_permissions").insert(
      Object.entries(permissionMap).map(([permissionKey, enabled]) => ({
        tenant_role_profile_id: profileRow.id,
        permission_key: permissionKey,
        enabled,
      })),
    ),
    "Falha ao salvar permissões do perfil.",
  );

  return getAdminTenantSnapshot(tenantSlug);
}

export async function deleteTenantRoleProfile({ tenantSlug, profileId }) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const profile = maybeSingle(
    await supabaseAdmin
      .from("tenant_role_profiles")
      .select("*")
      .eq("id", profileId)
      .eq("tenant_id", tenant.id)
      .maybeSingle(),
    "Falha ao localizar perfil.",
  );

  if (!profile) {
    const error = new Error("Perfil não encontrado.");
    error.statusCode = 404;
    throw error;
  }

  if (profile.is_system) {
    throw new Error("Perfis padrão não podem ser excluídos.");
  }

  const linkedMemberships = ensureOk(
    await supabaseAdmin
      .from("tenant_memberships")
      .select("id")
      .eq("role_profile_id", profile.id)
      .limit(1),
    "Falha ao validar uso do perfil.",
  );

  if (linkedMemberships.length > 0) {
    throw new Error("Realoque os usuários desse perfil antes de excluir.");
  }

  ensureOk(
    await supabaseAdmin
      .from("tenant_role_profiles")
      .delete()
      .eq("id", profile.id),
    "Falha ao excluir perfil.",
  );

  return getAdminTenantSnapshot(tenantSlug);
}

export function resolveEffectivePermissionsFromBootstrap(identity, tenant, roleProfiles) {
  if (identity.isSuperAdmin) {
    return defaultPermissionMap("tenant_admin");
  }

  const tenantSlug = tenant.slug;
  const companyId = tenant.companyId || tenant.company_id;
  const membership =
    identity.memberships.find((item) => item.tenant?.slug === tenantSlug) ||
    identity.memberships.find(
      (item) =>
        item.companyId === companyId ||
        item.company?.id === companyId,
    );
  const roleProfile =
    roleProfiles.find((profile) => profile.id === membership?.roleProfileId) ||
    roleProfiles.find((profile) => profile.baseRole === membership?.role) ||
    roleProfiles.find((profile) => profile.key === "staff");

  return normalizePermissionMap(
    roleProfile?.permissions,
    roleProfile?.baseRole || membership?.role || "tenant_staff",
  );
}

export async function getEffectivePermissionsForIdentity(identity, tenantSlug, bootstrapContext) {
  if (identity.isSuperAdmin) {
    return defaultPermissionMap("tenant_admin");
  }

  const tenant = bootstrapContext?.tenant || await getTenantRowBySlug(tenantSlug);
  const roleProfiles = bootstrapContext?.roleProfiles || await ensureTenantRoleProfiles(tenant);
  return resolveEffectivePermissionsFromBootstrap(identity, tenant, roleProfiles);
}

export async function saveSettings(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const row = ensureOk(
    await supabaseAdmin
      .from("tenant_settings")
      .upsert({
        tenant_id: tenant.id,
        ifood_tax: payload.ifoodTax,
        anotaai_tax: payload.anotaaiTax,
        business_name: payload.businessName,
        alert_days_before: payload.alertDaysBefore,
      })
      .select("*")
      .single(),
    "Falha ao salvar settings.",
  );

  return {
    ifoodTax: Number(row.ifood_tax || 0),
    anotaaiTax: Number(row.anotaai_tax || 0),
    businessName: row.business_name,
    alertDaysBefore: row.alert_days_before,
  };
}

export async function saveAiSettings(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const row = ensureOk(
    await supabaseAdmin
      .from("tenant_ai_settings")
      .upsert({
        tenant_id: tenant.id,
        positive_tone: payload.positiveTone,
        crisis_strategy: payload.crisisStrategy,
        additional_instructions: payload.additionalInstructions,
        auto_publish_positive: payload.autoPublishPositive,
      })
      .select("*")
      .single(),
    "Falha ao salvar comportamento da IA.",
  );

  return {
    positiveTone: row.positive_tone,
    crisisStrategy: row.crisis_strategy,
    additionalInstructions: row.additional_instructions,
    autoPublishPositive: row.auto_publish_positive,
  };
}

export async function savePayrollConfig(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const effectiveMonth = new Date().toISOString().slice(0, 7);
  const row = ensureOk(
    await supabaseAdmin
      .from("payroll_configs")
      .upsert({
        tenant_id: tenant.id,
        salary_percentage: payload.salaryPercentage,
        salary_business_day_ordinal: payload.salaryBusinessDayOrdinal,
        advance_percentage: payload.advancePercentage,
        advance_fixed_day: payload.advanceFixedDay,
        advance_business_day_policy: payload.advanceBusinessDayPolicy,
        holiday_dates: payload.holidayDates || [],
        meal_cost_per_workday: payload.mealCostPerWorkday,
        extra_kitchen_daily_rate: payload.extraKitchenDailyRate,
        extra_motoboy_daily_rate: payload.extraMotoboyDailyRate,
      })
      .select("*")
      .single(),
    "Falha ao salvar configuração de folha.",
  );

  ensureOk(
    await supabaseAdmin.from("payroll_config_history").upsert({
      tenant_id: tenant.id,
      effective_month: effectiveMonth,
      salary_percentage: row.salary_percentage,
      salary_business_day_ordinal: row.salary_business_day_ordinal,
      advance_percentage: row.advance_percentage,
      advance_fixed_day: row.advance_fixed_day,
      advance_business_day_policy: row.advance_business_day_policy,
      holiday_dates: row.holiday_dates || [],
      meal_cost_per_workday: row.meal_cost_per_workday,
      extra_kitchen_daily_rate: row.extra_kitchen_daily_rate,
      extra_motoboy_daily_rate: row.extra_motoboy_daily_rate,
    }, { onConflict: "tenant_id,effective_month" }),
    "Falha ao preservar a vigência das regras da folha.",
  );

  return {
    salaryPercentage: Number(row.salary_percentage || 0),
    salaryBusinessDayOrdinal: row.salary_business_day_ordinal,
    advancePercentage: Number(row.advance_percentage || 0),
    advanceFixedDay: row.advance_fixed_day,
    advanceBusinessDayPolicy: row.advance_business_day_policy,
    holidayDates: Array.isArray(row.holiday_dates) ? row.holiday_dates : [],
    mealCostPerWorkday: Number(row.meal_cost_per_workday || 15),
    extraKitchenDailyRate: Number(row.extra_kitchen_daily_rate || 70),
    extraMotoboyDailyRate: Number(row.extra_motoboy_daily_rate || 60),
  };
}

export async function saveEmployee(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);

  const duplicate = maybeSingle(
    await supabaseAdmin
      .from("employees")
      .select("id")
      .eq("tenant_id", tenant.id)
      .ilike("full_name", String(payload.name || "").trim())
      .ilike("role", String(payload.role || "").trim())
      .eq("employment_type", payload.employmentType)
      .maybeSingle(),
    "Falha ao verificar duplicidade de funcionário.",
  );

  if (duplicate && String(duplicate.id) !== String(payload.id || "")) {
    const error = new Error(
      "Já existe um funcionário com este nome, cargo e tipo de vínculo nesta filial.",
    );
    error.statusCode = 409;
    throw error;
  }

  const employeeRow = ensureOk(
    await (
      payload.id
        ? supabaseAdmin
            .from("employees")
            .update({
              tenant_id: tenant.id,
              full_name: payload.name,
              phone: payload.phone || "",
              email: payload.email || "",
              address: payload.address || "",
              marital_status: payload.maritalStatus || "",
              role: payload.role || "",
              notes: payload.notes || "",
              employment_type: payload.employmentType,
              status: payload.status || "active",
              salary: payload.salary || 0,
              admission_date: payload.admissionDate || null,
              payment_mode: payload.paymentMode || "weekly",
              base_amount: payload.baseAmount || 0,
              weekday: payload.weekday || "1",
              specific_date: payload.specificDate || null,
              start_date: payload.startDate || null,
              control_attendance:
                payload.employmentType === "fixed" &&
                payload.controlAttendance === true,
              attendance_control_from:
                payload.employmentType === "fixed" &&
                payload.controlAttendance === true
                  ? payload.attendanceControlFrom || null
                  : null,
              weekly_day_off:
                payload.employmentType === "fixed" &&
                payload.controlAttendance === true
                  ? payload.weeklyDayOff
                  : null,
              monthly_sunday_off_ordinal:
                payload.employmentType === "fixed" &&
                payload.controlAttendance === true
                  ? payload.monthlySundayOffOrdinal
                  : null,
              first_payment_percentage:
                payload.employmentType === "fixed"
                  ? payload.firstPaymentPercentage
                  : null,
              final_payment_percentage:
                payload.employmentType === "fixed"
                  ? payload.finalPaymentPercentage
                  : null,
            })
            .eq("tenant_id", tenant.id)
            .eq("id", payload.id)
        : supabaseAdmin.from("employees").insert({
            tenant_id: tenant.id,
            full_name: payload.name,
            phone: payload.phone || "",
            email: payload.email || "",
            address: payload.address || "",
            marital_status: payload.maritalStatus || "",
            role: payload.role || "",
            notes: payload.notes || "",
            employment_type: payload.employmentType,
            status: payload.status || "active",
            salary: payload.salary || 0,
            admission_date: payload.admissionDate || null,
            payment_mode: payload.paymentMode || "weekly",
            base_amount: payload.baseAmount || 0,
            weekday: payload.weekday || "1",
            specific_date: payload.specificDate || null,
            start_date: payload.startDate || null,
            control_attendance:
              payload.employmentType === "fixed" &&
              payload.controlAttendance === true,
            attendance_control_from:
              payload.employmentType === "fixed" &&
              payload.controlAttendance === true
                ? payload.attendanceControlFrom || null
                : null,
            weekly_day_off:
              payload.employmentType === "fixed" &&
              payload.controlAttendance === true
                ? payload.weeklyDayOff
                : null,
            monthly_sunday_off_ordinal:
              payload.employmentType === "fixed" &&
              payload.controlAttendance === true
                ? payload.monthlySundayOffOrdinal
                : null,
            first_payment_percentage:
              payload.employmentType === "fixed"
                ? payload.firstPaymentPercentage
                : null,
            final_payment_percentage:
              payload.employmentType === "fixed"
                ? payload.finalPaymentPercentage
                : null,
          })
    )
      .select("*")
      .single(),
    "Falha ao salvar funcionário.",
  );

  ensureOk(
    await supabaseAdmin.from("employee_payroll_history").upsert({
      tenant_id: tenant.id,
      employee_id: employeeRow.id,
      effective_month: new Date().toISOString().slice(0, 7),
      full_name: employeeRow.full_name,
      role: employeeRow.role || "",
      employment_type: employeeRow.employment_type,
      status: employeeRow.status,
      salary: employeeRow.salary || 0,
      admission_date: employeeRow.admission_date,
      control_attendance: employeeRow.control_attendance === true,
      attendance_control_from: employeeRow.attendance_control_from,
      weekly_day_off: employeeRow.weekly_day_off,
      monthly_sunday_off_ordinal: employeeRow.monthly_sunday_off_ordinal,
      first_payment_percentage: employeeRow.first_payment_percentage,
      final_payment_percentage: employeeRow.final_payment_percentage,
    }, { onConflict: "tenant_id,employee_id,effective_month" }),
    "Falha ao preservar a vigência salarial do funcionário.",
  );

  let dailyRateTypeRows = [];
  ensureOk(
    await supabaseAdmin
      .from("employee_daily_rate_types")
      .update({ active: false })
      .eq("tenant_id", tenant.id)
      .eq("employee_id", employeeRow.id),
    "Falha ao atualizar Tipos de Diária.",
  );
  if (payload.employmentType === "external") {
    const dailyRateTypes = Array.isArray(payload.dailyRateTypes)
      ? payload.dailyRateTypes
      : [];
    for (const type of dailyRateTypes) {
      ensureOk(
        await supabaseAdmin.from("employee_daily_rate_types").upsert(
          {
            id: type.id || undefined,
            tenant_id: tenant.id,
            employee_id: employeeRow.id,
            name: type.name,
            amount: type.amount,
            applies_weekdays: type.appliesWeekdays !== false,
            applies_weekends: type.appliesWeekends !== false,
            active: type.active !== false,
          },
          { onConflict: type.id ? "id" : "tenant_id,employee_id,name" },
        ),
        "Falha ao salvar Tipo de Diária.",
      );
    }
    dailyRateTypeRows = ensureOk(
      await supabaseAdmin
        .from("employee_daily_rate_types")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("employee_id", employeeRow.id)
        .eq("active", true)
        .order("created_at"),
      "Falha ao recarregar Tipos de Diária.",
    );
  }

  ensureOk(
    await supabaseAdmin
      .from("employee_discounts")
      .delete()
      .eq("employee_id", employeeRow.id),
    "Falha ao limpar descontos.",
  );

  if (Array.isArray(payload.discounts) && payload.discounts.length > 0) {
    ensureOk(
      await supabaseAdmin.from("employee_discounts").insert(
        payload.discounts.map((discount) => ({
          tenant_id: tenant.id,
          employee_id: employeeRow.id,
          category: discount.category,
          amount: discount.amount,
        })),
      ),
      "Falha ao salvar descontos.",
    );
  }

  const discountRows = ensureOk(
    await supabaseAdmin
      .from("employee_discounts")
      .select("*")
      .eq("employee_id", employeeRow.id),
    "Falha ao recarregar descontos.",
  );

  return {
    ...mapEmployee(
      employeeRow,
      dailyRateTypeRows.map((type) => ({
        id: type.id,
        name: type.name,
        amount: Number(type.amount || 0),
        appliesWeekdays: Boolean(type.applies_weekdays),
        appliesWeekends: Boolean(type.applies_weekends),
        active: type.active !== false,
      })),
    ),
    discounts: discountRows.map((discount) => ({
      id: discount.id,
      category: discount.category,
      amount: Number(discount.amount || 0),
    })),
  };
}

export async function deleteEmployeeById(tenantSlug, employeeId) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const archived = maybeSingle(
    await supabaseAdmin
      .from("employees")
      .update({ status: "inactive" })
      .eq("tenant_id", tenant.id)
      .eq("id", employeeId)
      .select("*")
      .maybeSingle(),
    "Falha ao retirar funcionário da folha.",
  );
  if (!archived)
    throw new Error(
      "Funcionário não encontrado nesta filial. Atualize a página e tente novamente.",
    );
  ensureOk(
    await supabaseAdmin.from("employee_payroll_history").upsert({
      tenant_id: tenant.id,
      employee_id: archived.id,
      effective_month: new Date().toISOString().slice(0, 7),
      full_name: archived.full_name,
      role: archived.role || "",
      employment_type: archived.employment_type,
      status: "inactive",
      salary: archived.salary || 0,
      admission_date: archived.admission_date,
      control_attendance: archived.control_attendance === true,
      attendance_control_from: archived.attendance_control_from,
      weekly_day_off: archived.weekly_day_off,
      monthly_sunday_off_ordinal: archived.monthly_sunday_off_ordinal,
      first_payment_percentage: archived.first_payment_percentage,
      final_payment_percentage: archived.final_payment_percentage,
    }, { onConflict: "tenant_id,employee_id,effective_month" }),
    "Falha ao preservar a vigência do desligamento.",
  );
  return true;
}

export async function saveTransaction(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const sourceType = String(payload.sourceType || "manual").trim() || "manual";
  const sourceId = String(payload.sourceId || "").trim();
  const existingSource = sourceId
    ? maybeSingle(
        await supabaseAdmin
          .from("transactions")
          .select("id")
          .eq("tenant_id", tenant.id)
          .eq("source_type", sourceType)
          .eq("source_id", sourceId)
          .maybeSingle(),
        "Falha ao localizar lançamento automático.",
      )
    : null;

  const query = supabaseAdmin
    .from("transactions")
    .upsert({
      id: payload.id || existingSource?.id || undefined,
      tenant_id: tenant.id,
      transaction_date: payload.date,
      platform: payload.platform,
      payment: payload.payment,
      amount: payload.amount,
      tax: payload.tax,
      net_amount: payload.net,
      type: payload.type,
      category: payload.category,
      note: payload.note || "",
      source_type: sourceType,
      source_id: sourceId,
    })
    .select("*")
    .single();

  const row = ensureOk(await query, "Falha ao salvar transação.");

  return mapTransaction(row);
}

export async function deleteTransactionById(tenantSlug, transactionId) {
  const tenant = await getTenantRowBySlug(tenantSlug);

  ensureOk(
    await supabaseAdmin
      .from("transactions")
      .delete()
      .eq("tenant_id", tenant.id)
      .eq("id", transactionId),
    "Falha ao remover lançamento.",
  );

  return true;
}

async function deleteTransactionBySource(tenantId, sourceType, sourceId) {
  ensureOk(
    await supabaseAdmin
      .from("transactions")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("source_type", sourceType)
      .eq("source_id", sourceId),
    "Falha ao remover lançamento automático.",
  );
}

async function syncOrderFinancialTransaction(tenantId, order) {
  if (!order?.id) return null;

  if (order.status !== "delivered" || Number(order.total_amount || 0) <= 0) {
    await deleteTransactionBySource(tenantId, "order", order.id);
    return null;
  }

  const transactionDate = String(
    order.delivered_at ||
      order.updated_at ||
      order.created_at ||
      new Date().toISOString(),
  ).slice(0, 10);
  const payment = order.payment_methods?.name || "";
  const channel = String(order.channel || "proprio").trim() || "proprio";
  const amount = normalizeOrderMoney(order.total_amount);
  const platformFee = normalizeOrderMoney(order.platform_fee_amount);
  const netAmount = normalizeOrderMoney(amount - platformFee);

  const existing = maybeSingle(
    await supabaseAdmin
      .from("transactions")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("source_type", "order")
      .eq("source_id", order.id)
      .maybeSingle(),
    "Falha ao localizar receita do pedido.",
  );

  const payload = {
    tenant_id: tenantId,
    transaction_date: transactionDate,
    platform: channel,
    payment,
    amount,
    tax: platformFee,
    net_amount: netAmount,
    type: "receita",
    category: channel === "ifood" ? "pedido_ifood" : "pedido_proprio",
    note: `Pedido ${order.order_number || String(order.id).slice(0, 8)}`,
    source_type: "order",
    source_id: order.id,
  };

  const row = ensureOk(
    existing
      ? await supabaseAdmin
          .from("transactions")
          .update(payload)
          .eq("tenant_id", tenantId)
          .eq("id", existing.id)
          .select("*")
          .single()
      : await supabaseAdmin
          .from("transactions")
          .insert(payload)
          .select("*")
          .single(),
    "Falha ao sincronizar receita do pedido.",
  );

  return mapTransaction(row);
}

async function ensureDeliveredOrdersAreSynced(tenantId, orders) {
  for (const order of orders) {
    await syncOrderFinancialTransaction(tenantId, order);
  }
}

async function getOrdersInClosingRange(tenantId, periodStart, periodEnd) {
  return ensureOk(
    await supabaseAdmin
      .from("orders")
      .select(
        `
        *,
        customers!orders_customer_id_fkey ( * ),
        payment_methods!orders_payment_method_id_fkey ( * ),
        delivery_drivers!orders_delivery_driver_id_fkey ( * ),
        order_items!order_items_order_id_fkey ( * )
      `,
      )
      .eq("tenant_id", tenantId)
      .eq("status", "delivered")
      .gte("delivered_at", `${periodStart}T00:00:00`)
      .lte("delivered_at", `${periodEnd}T23:59:59`),
    "Falha ao carregar pedidos entregues para fechamento.",
  );
}

export async function saveRecurringCost(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const row = ensureOk(
    await supabaseAdmin
      .from("recurring_costs")
      .upsert({
        id: payload.id || undefined,
        tenant_id: tenant.id,
        description: payload.desc,
        amount: payload.amount,
        due_day: payload.dueDay,
        last_paid_month: payload.lastPaidMonth || "",
      })
      .select("*")
      .single(),
    "Falha ao salvar custo fixo.",
  );

  return mapRecurringCost(row);
}

export async function deleteRecurringCostById(tenantSlug, recurringCostId) {
  const tenant = await getTenantRowBySlug(tenantSlug);

  const archived = maybeSingle(
    await supabaseAdmin
      .from("recurring_costs")
      .update({ active: false })
      .eq("tenant_id", tenant.id)
      .eq("id", recurringCostId)
      .select("id,active")
      .maybeSingle(),
    "Falha ao remover custo fixo.",
  );
  if (!archived) throw new Error("Custo fixo não encontrado nesta filial.");

  return true;
}

export async function saveCustomer(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const name = String(payload.name || payload.fullName || "").trim();

  if (!name) throw new Error("Nome do cliente é obrigatório.");

  const phone = String(payload.phone || "").replace(/\D/g, "");
  const customerPayload = {
    tenant_id: tenant.id,
    full_name: name,
    phone,
    email: String(payload.email || "").trim(),
    document: String(payload.document || "").trim(),
    address_line: String(payload.addressLine || "").trim(),
    address_number: String(payload.addressNumber || "").trim(),
    address_complement: String(payload.addressComplement || "").trim(),
    district: String(payload.district || "").trim(),
    city: String(payload.city || "").trim(),
    state: String(payload.state || "").trim(),
    postal_code: String(payload.postalCode || "").trim(),
    notes: String(payload.notes || "").trim(),
    status: payload.status === "inactive" ? "inactive" : "active",
  };

  const row = ensureOk(
    payload.id
      ? await supabaseAdmin
          .from("customers")
          .update(customerPayload)
          .eq("tenant_id", tenant.id)
          .eq("id", payload.id)
          .select("*")
          .single()
      : await supabaseAdmin
          .from("customers")
          .insert(customerPayload)
          .select("*")
          .single(),
    "Falha ao salvar cliente.",
  );

  return mapCustomer(row);
}

export async function getCustomerByPhone(tenantSlug, phone) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const normalizedPhone = String(phone || "").replace(/\D/g, "");

  if (!normalizedPhone) return null;

  const row = maybeSingle(
    await supabaseAdmin
      .from("customers")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("phone", normalizedPhone)
      .maybeSingle(),
    "Falha ao carregar cliente.",
  );

  return row ? mapCustomer(row) : null;
}

export async function deleteCustomerById(tenantSlug, customerId) {
  const tenant = await getTenantRowBySlug(tenantSlug);

  ensureOk(
    await supabaseAdmin
      .from("customers")
      .delete()
      .eq("tenant_id", tenant.id)
      .eq("id", customerId),
    "Falha ao remover cliente.",
  );

  return true;
}

export async function savePaymentMethod(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const name = String(payload.name || "").trim();
  const allowedKinds = [
    "cash",
    "credit_card",
    "debit_card",
    "pix",
    "voucher",
    "other",
  ];
  const kind = allowedKinds.includes(payload.kind) ? payload.kind : "other";

  if (!name) throw new Error("Nome da forma de pagamento é obrigatório.");

  const paymentMethodPayload = {
    tenant_id: tenant.id,
    name,
    kind,
    requires_change: Boolean(payload.requiresChange),
    status: payload.status === "inactive" ? "inactive" : "active",
  };

  const row = ensureOk(
    payload.id
      ? await supabaseAdmin
          .from("payment_methods")
          .update(paymentMethodPayload)
          .eq("tenant_id", tenant.id)
          .eq("id", payload.id)
          .select("*")
          .single()
      : await supabaseAdmin
          .from("payment_methods")
          .insert(paymentMethodPayload)
          .select("*")
          .single(),
    "Falha ao salvar forma de pagamento.",
  );

  return mapPaymentMethod(row);
}

async function findOrCreatePaymentMethod(tenantId, paymentName) {
  const name = String(paymentName || "iFood").trim() || "iFood";
  const existing = maybeSingle(
    await supabaseAdmin
      .from("payment_methods")
      .select("*")
      .eq("tenant_id", tenantId)
      .ilike("name", name)
      .maybeSingle(),
    "Falha ao localizar forma de pagamento.",
  );

  if (existing) return existing;

  return ensureOk(
    await supabaseAdmin
      .from("payment_methods")
      .insert({
        tenant_id: tenantId,
        name,
        kind: "other",
        status: "active",
      })
      .select("*")
      .single(),
    "Falha ao criar forma de pagamento externa.",
  );
}

async function findOrCreateCustomer(tenantId, customer = {}) {
  const phone = String(customer.phone || "").trim();
  const name =
    String(customer.name || customer.fullName || "").trim() || "Cliente iFood";

  if (phone) {
    const existing = maybeSingle(
      await supabaseAdmin
        .from("customers")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("phone", phone)
        .maybeSingle(),
      "Falha ao localizar cliente externo.",
    );

    if (existing) return existing;
  }

  return ensureOk(
    await supabaseAdmin
      .from("customers")
      .insert({
        tenant_id: tenantId,
        full_name: name,
        phone,
        email: String(customer.email || "").trim(),
        document: String(customer.document || "").trim(),
        address_line: String(
          customer.addressLine || customer.street || "",
        ).trim(),
        address_number: String(
          customer.addressNumber || customer.number || "",
        ).trim(),
        address_complement: String(
          customer.addressComplement || customer.complement || "",
        ).trim(),
        district: String(
          customer.district || customer.neighborhood || "",
        ).trim(),
        city: String(customer.city || "").trim(),
        state: String(customer.state || "").trim(),
        postal_code: String(
          customer.postalCode || customer.zipCode || "",
        ).trim(),
        notes: String(customer.notes || "").trim(),
        status: "active",
      })
      .select("*")
      .single(),
    "Falha ao criar cliente externo.",
  );
}

export async function deletePaymentMethodById(tenantSlug, paymentMethodId) {
  const tenant = await getTenantRowBySlug(tenantSlug);

  ensureOk(
    await supabaseAdmin
      .from("payment_methods")
      .delete()
      .eq("tenant_id", tenant.id)
      .eq("id", paymentMethodId),
    "Falha ao remover forma de pagamento.",
  );

  return true;
}

export async function saveDeliveryDriver(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const name = String(payload.name || payload.fullName || "").trim();

  if (!name) throw new Error("Nome do motoboy é obrigatório.");

  const driverPayload = {
    tenant_id: tenant.id,
    full_name: name,
    phone: String(payload.phone || "").trim(),
    vehicle: String(payload.vehicle || "moto").trim(),
    daily_rate: normalizeOrderMoney(payload.dailyRate),
    per_delivery_rate: normalizeOrderMoney(payload.perDeliveryRate),
    status: payload.status === "inactive" ? "inactive" : "active",
    notes: String(payload.notes || "").trim(),
  };

  const row = ensureOk(
    payload.id
      ? await supabaseAdmin
          .from("delivery_drivers")
          .update(driverPayload)
          .eq("tenant_id", tenant.id)
          .eq("id", payload.id)
          .select("*")
          .single()
      : await supabaseAdmin
          .from("delivery_drivers")
          .insert(driverPayload)
          .select("*")
          .single(),
    "Falha ao salvar motoboy.",
  );

  return mapDeliveryDriver(row);
}

export async function deleteDeliveryDriverById(tenantSlug, driverId) {
  const tenant = await getTenantRowBySlug(tenantSlug);

  ensureOk(
    await supabaseAdmin
      .from("delivery_drivers")
      .delete()
      .eq("tenant_id", tenant.id)
      .eq("id", driverId),
    "Falha ao remover motoboy.",
  );

  return true;
}

function normalizeOrderMoney(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function normalizeOrderItems(items) {
  return sanitizeJsonArray(items).map((item, index) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = normalizeOrderMoney(item.unitPrice);
    const totalPrice = normalizeOrderMoney(
      item.totalPrice || quantity * unitPrice,
    );
    const name = String(item.name || item.itemName || "").trim();
    const section = ["food", "beverage", "other"].includes(item.section)
      ? item.section
      : "food";

    if (!name) throw new Error("Nome do item do pedido é obrigatório.");
    if (quantity <= 0)
      throw new Error(
        "Quantidade do item do pedido precisa ser maior que zero.",
      );

    return {
      menu_item_id: item.menuItemId || null,
      product_id: item.productId || null,
      item_name: name,
      item_category: String(item.category || "").trim(),
      item_section: section,
      quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      notes: String(item.notes || "").trim(),
      sort_order: Number.isInteger(item.sortOrder) ? item.sortOrder : index,
    };
  });
}

export async function saveOrder(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const existingOrder = payload.id
    ? maybeSingle(
        await supabaseAdmin
          .from("orders")
          .select(
            "external_source, external_id, external_payload, platform_fee_amount",
          )
          .eq("tenant_id", tenant.id)
          .eq("id", payload.id)
          .maybeSingle(),
        "Falha ao carregar pedido existente.",
      )
    : null;
  const items = normalizeOrderItems(payload.items);
  const subtotal = normalizeOrderMoney(
    payload.subtotal ||
      items.reduce((sum, item) => sum + Number(item.total_price || 0), 0),
  );
  const deliveryFee = normalizeOrderMoney(payload.deliveryFee);
  const discount = normalizeOrderMoney(payload.discount);
  const total = normalizeOrderMoney(
    payload.total || subtotal + deliveryFee - discount,
  );
  const paidAmount = normalizeOrderMoney(payload.paidAmount);
  const changeAmount = normalizeOrderMoney(payload.changeAmount);
  const deliveryCost = normalizeOrderMoney(payload.deliveryCost);
  const platformFee =
    payload.platformFee === undefined
      ? normalizeOrderMoney(existingOrder?.platform_fee_amount)
      : normalizeOrderMoney(payload.platformFee);
  const driverDailyAmount = normalizeOrderMoney(payload.driverDailyAmount);
  const driverDeliveryAmount = normalizeOrderMoney(
    payload.driverDeliveryAmount,
  );
  const cashChangeRequired = normalizeOrderMoney(payload.cashChangeRequired);
  const allowedTypes = ["delivery", "pickup", "dine_in"];
  const allowedStatuses = [
    "draft",
    "placed",
    "accepted",
    "preparing",
    "ready",
    "dispatched",
    "delivered",
    "cancelled",
  ];
  const allowedDeliveryStatuses = [
    "waiting",
    "assigned",
    "out_for_delivery",
    "delivered",
    "cancelled",
  ];

  const orderPayload = {
    tenant_id: tenant.id,
    customer_id: payload.customerId || null,
    payment_method_id: payload.paymentMethodId || null,
    order_number: String(payload.orderNumber || "").trim(),
    channel: String(payload.channel || "manual").trim(),
    external_source:
      payload.externalSource === undefined
        ? existingOrder?.external_source || ""
        : String(payload.externalSource || "").trim(),
    external_id:
      payload.externalId === undefined
        ? existingOrder?.external_id || ""
        : String(payload.externalId || "").trim(),
    external_payload:
      payload.externalPayload === undefined
        ? existingOrder?.external_payload || {}
        : payload.externalPayload && typeof payload.externalPayload === "object"
          ? payload.externalPayload
          : {},
    order_type: allowedTypes.includes(payload.orderType)
      ? payload.orderType
      : "delivery",
    status: allowedStatuses.includes(payload.status) ? payload.status : "draft",
    delivery_driver_id: payload.deliveryDriverId || null,
    delivery_status: allowedDeliveryStatuses.includes(payload.deliveryStatus)
      ? payload.deliveryStatus
      : "waiting",
    dispatched_at: payload.dispatchedAt || null,
    delivered_at: payload.deliveredAt || null,
    delivery_cost: deliveryCost,
    driver_daily_amount: driverDailyAmount,
    driver_delivery_amount: driverDeliveryAmount,
    cash_change_required: cashChangeRequired,
    card_machine_code: String(payload.cardMachineCode || "").trim(),
    subtotal_amount: subtotal,
    delivery_fee: deliveryFee,
    discount_amount: discount,
    total_amount: total,
    platform_fee_amount: platformFee,
    paid_amount: paidAmount,
    change_amount: changeAmount,
    notes: String(payload.notes || "").trim(),
  };

  const row = ensureOk(
    payload.id
      ? await supabaseAdmin
          .from("orders")
          .update(orderPayload)
          .eq("tenant_id", tenant.id)
          .eq("id", payload.id)
          .select("*")
          .single()
      : await supabaseAdmin
          .from("orders")
          .insert(orderPayload)
          .select("*")
          .single(),
    "Falha ao salvar pedido.",
  );

  ensureOk(
    await supabaseAdmin
      .from("order_items")
      .delete()
      .eq("tenant_id", tenant.id)
      .eq("order_id", row.id),
    "Falha ao limpar itens do pedido.",
  );

  if (items.length > 0) {
    ensureOk(
      await supabaseAdmin.from("order_items").insert(
        items.map((item) => ({
          ...item,
          tenant_id: tenant.id,
          order_id: row.id,
        })),
      ),
      "Falha ao salvar itens do pedido.",
    );
  }

  const savedOrder = await getOrderById(tenant.id, row.id);
  await syncOrderFinancialTransaction(tenant.id, savedOrder);
  return mapOrder(savedOrder);
}

async function getOrderById(tenantId, orderId) {
  return maybeSingle(
    await supabaseAdmin
      .from("orders")
      .select(
        `
        *,
        customers!orders_customer_id_fkey ( * ),
        payment_methods!orders_payment_method_id_fkey ( * ),
        delivery_drivers!orders_delivery_driver_id_fkey ( * ),
        order_items!order_items_order_id_fkey ( * )
      `,
      )
      .eq("tenant_id", tenantId)
      .eq("id", orderId)
      .maybeSingle(),
    "Falha ao carregar pedido.",
  );
}

export async function deleteOrderById(tenantSlug, orderId) {
  const tenant = await getTenantRowBySlug(tenantSlug);

  await deleteTransactionBySource(tenant.id, "order", orderId);

  ensureOk(
    await supabaseAdmin
      .from("orders")
      .delete()
      .eq("tenant_id", tenant.id)
      .eq("id", orderId),
    "Falha ao remover pedido.",
  );

  return true;
}

function normalizeIfoodStatus(value) {
  const status = String(value || "")
    .trim()
    .toLowerCase();
  const statusMap = {
    placed: "placed",
    confirmed: "accepted",
    accepted: "accepted",
    preparing: "preparing",
    ready: "ready",
    dispatched: "dispatched",
    delivered: "delivered",
    concluded: "delivered",
    cancelled: "cancelled",
    canceled: "cancelled",
  };

  return statusMap[status] || "placed";
}

function normalizeIfoodItems(order) {
  const items = Array.isArray(order.items) ? order.items : [];

  return items.map((item, index) => {
    const quantity = Number(item.quantity || 1);
    const total = normalizeOrderMoney(
      item.totalPrice ?? item.total ?? item.price,
    );
    const unitPrice = normalizeOrderMoney(
      item.unitPrice ?? (quantity > 0 ? total / quantity : total),
    );

    return {
      name: String(item.name || item.description || `Item ${index + 1}`).trim(),
      section: item.section || "food",
      category: String(item.category || "iFood").trim(),
      quantity,
      unitPrice,
      totalPrice: total || normalizeOrderMoney(unitPrice * quantity),
      notes: String(item.notes || item.observations || "").trim(),
      sortOrder: Number.isInteger(item.sortOrder) ? item.sortOrder : index,
    };
  });
}

function buildIfoodOrderNumber(externalId) {
  const suffix = String(externalId || "")
    .trim()
    .slice(-8)
    .toUpperCase();
  return suffix ? `IFOOD-${suffix}` : `IFOOD-${Date.now()}`;
}

async function getExistingExternalOrder(tenantId, source, externalId) {
  return maybeSingle(
    await supabaseAdmin
      .from("orders")
      .select("id, customer_id")
      .eq("tenant_id", tenantId)
      .eq("external_source", source)
      .eq("external_id", externalId)
      .maybeSingle(),
    "Falha ao localizar pedido externo.",
  );
}

export async function importIfoodOrders(tenantSlug, payload = {}) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const settings = maybeSingle(
    await supabaseAdmin
      .from("tenant_settings")
      .select("ifood_tax")
      .eq("tenant_id", tenant.id)
      .maybeSingle(),
    "Falha ao carregar configuração do iFood.",
  );
  const orders = Array.isArray(payload.orders) ? payload.orders : [];
  const results = [];

  if (orders.length === 0)
    throw new Error("Informe pelo menos um pedido em orders.");

  for (const externalOrder of orders) {
    const externalId = String(
      externalOrder.externalId ||
        externalOrder.id ||
        externalOrder.orderId ||
        "",
    ).trim();

    if (!externalId) {
      results.push({
        externalId: "",
        status: "failed",
        error: "externalId é obrigatório.",
      });
      continue;
    }

    try {
      const source = "ifood";
      const existing = await getExistingExternalOrder(
        tenant.id,
        source,
        externalId,
      );
      const customer = existing?.customer_id
        ? { id: existing.customer_id }
        : await findOrCreateCustomer(tenant.id, externalOrder.customer || {});
      const paymentMethod = await findOrCreatePaymentMethod(
        tenant.id,
        externalOrder.payment?.method || externalOrder.paymentMethod || "iFood",
      );
      const items = normalizeIfoodItems(externalOrder);
      const subtotal = normalizeOrderMoney(
        externalOrder.subtotal ??
          items.reduce((sum, item) => sum + item.totalPrice, 0),
      );
      const deliveryFee = normalizeOrderMoney(externalOrder.deliveryFee);
      const discount = normalizeOrderMoney(externalOrder.discount);
      const total = normalizeOrderMoney(
        externalOrder.total ?? subtotal + deliveryFee - discount,
      );
      const explicitPlatformFee =
        externalOrder.platformFee ??
        externalOrder.ifoodFee ??
        externalOrder.commissionAmount;
      const platformFee =
        explicitPlatformFee === undefined || explicitPlatformFee === null
          ? normalizeOrderMoney(
              total * (Number(settings?.ifood_tax || 0) / 100),
            )
          : normalizeOrderMoney(explicitPlatformFee);
      const status = normalizeIfoodStatus(externalOrder.status);
      const deliveredAt =
        externalOrder.deliveredAt ||
        (status === "delivered"
          ? externalOrder.updatedAt ||
            externalOrder.createdAt ||
            new Date().toISOString()
          : null);

      const order = await saveOrder(tenantSlug, {
        id: existing?.id,
        customerId: customer.id,
        paymentMethodId: paymentMethod.id,
        orderNumber: String(
          externalOrder.orderNumber || buildIfoodOrderNumber(externalId),
        ).trim(),
        channel: "ifood",
        externalSource: source,
        externalId,
        externalPayload: externalOrder,
        orderType: externalOrder.orderType || "delivery",
        status,
        deliveryStatus:
          status === "delivered"
            ? "delivered"
            : status === "cancelled"
              ? "cancelled"
              : "waiting",
        deliveredAt,
        subtotal,
        deliveryFee,
        discount,
        total,
        platformFee,
        paidAmount: normalizeOrderMoney(externalOrder.paidAmount ?? total),
        notes: String(externalOrder.notes || "").trim(),
        items,
      });

      ensureOk(
        await supabaseAdmin.from("external_order_imports").upsert(
          {
            tenant_id: tenant.id,
            source,
            external_id: externalId,
            order_id: order.id,
            status: existing ? "updated" : "imported",
            raw_payload: externalOrder,
          },
          { onConflict: "tenant_id,source,external_id" },
        ),
        "Falha ao registrar importação externa.",
      );

      results.push({
        externalId,
        status: existing ? "updated" : "imported",
        order,
      });
    } catch (error) {
      ensureOk(
        await supabaseAdmin.from("external_order_imports").upsert(
          {
            tenant_id: tenant.id,
            source: "ifood",
            external_id: externalId,
            status: "failed",
            raw_payload: {
              ...externalOrder,
              importError: error.message,
            },
          },
          { onConflict: "tenant_id,source,external_id" },
        ),
        "Falha ao registrar erro de importação externa.",
      );

      results.push({ externalId, status: "failed", error: error.message });
    }
  }

  return {
    source: "ifood",
    imported: results.filter((item) => item.status === "imported").length,
    updated: results.filter((item) => item.status === "updated").length,
    failed: results.filter((item) => item.status === "failed").length,
    results,
  };
}

function parseDateOnly(value, fallback = new Date()) {
  const raw = String(value || "").slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (!fallback) return "";
  return fallback.toISOString().slice(0, 10);
}

function normalizePeriodType(value) {
  if (value === "weekly" || value === "monthly") return value;
  return "daily";
}

function isDateInRange(value, startDate, endDate) {
  const date = parseDateOnly(value, null);
  return date >= startDate && date <= endDate;
}

function sumMoney(items, selector) {
  return normalizeOrderMoney(
    items.reduce((sum, item) => sum + Number(selector(item) || 0), 0),
  );
}

function buildClosingSnapshot({
  periodType,
  periodStart,
  periodEnd,
  bootstrap,
}) {
  const transactions = bootstrap.transactions.filter((transaction) =>
    isDateInRange(transaction.date, periodStart, periodEnd),
  );
  const automaticOrderTransactions = transactions.filter(
    (transaction) =>
      transaction.type === "receita" && transaction.sourceType === "order",
  );
  const manualIncomeTransactions = transactions.filter(
    (transaction) =>
      transaction.type === "receita" && transaction.sourceType !== "order",
  );
  const manualExpenseTransactions = transactions.filter(
    (transaction) => transaction.type === "despesa",
  );
  const deliveredOrders = bootstrap.orders.filter((order) => {
    const date = order.deliveredAt || order.updatedAt || order.createdAt;
    return (
      order.status === "delivered" &&
      isDateInRange(date, periodStart, periodEnd)
    );
  });

  const fixedCostEntries = bootstrap.recurringCosts.filter((cost) => {
    if (!cost.lastPaidMonth) return false;
    const [year, month] = String(cost.lastPaidMonth).split("-").map(Number);
    if (!year || !month) return false;
    const day = Math.min(
      Number(cost.dueDay) || 1,
      new Date(year, month, 0).getDate(),
    );
    return isDateInRange(
      `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      periodStart,
      periodEnd,
    );
  });

  const monthlyRangeKey =
    periodStart.slice(0, 7) === periodEnd.slice(0, 7)
      ? periodStart.slice(0, 7)
      : "";
  const payrollEmployees = bootstrap.employees.filter(
    (employee) => employee.status !== "inactive",
  );
  const payrollCosts = monthlyRangeKey
    ? sumMoney(payrollEmployees, (employee) =>
        employee.employmentType === "freelance"
          ? employee.baseAmount
          : employee.salary,
      )
    : 0;

  const orderIncome = sumMoney(
    automaticOrderTransactions,
    (transaction) => transaction.net,
  );
  const manualIncome = sumMoney(
    manualIncomeTransactions,
    (transaction) => transaction.net,
  );
  const grossRevenue = sumMoney(
    transactions.filter((transaction) => transaction.type === "receita"),
    (transaction) => transaction.amount,
  );
  const netRevenue = normalizeOrderMoney(orderIncome + manualIncome);
  const manualExpenses = sumMoney(
    manualExpenseTransactions,
    (transaction) => transaction.amount,
  );
  const fixedCosts = sumMoney(fixedCostEntries, (cost) => cost.amount);
  const deliveryCosts = sumMoney(
    deliveredOrders,
    (order) => order.deliveryCost,
  );
  const channelFees = normalizeOrderMoney(grossRevenue - netRevenue);
  const totalExpenses = normalizeOrderMoney(
    manualExpenses + fixedCosts + payrollCosts + deliveryCosts,
  );
  const balance = normalizeOrderMoney(netRevenue - totalExpenses);

  return {
    periodType,
    periodStart,
    periodEnd,
    grossRevenue,
    netRevenue,
    orderIncome,
    manualIncome,
    manualExpenses,
    fixedCosts,
    payrollCosts,
    deliveryCosts,
    channelFees,
    totalExpenses,
    balance,
    snapshot: {
      transactions,
      deliveredOrders: deliveredOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        deliveryCost: order.deliveryCost,
        deliveredAt: order.deliveredAt,
        payment: order.paymentMethod?.name || "",
      })),
      fixedCostEntries,
      payrollEmployees: payrollEmployees.map((employee) => ({
        id: employee.id,
        name: employee.name,
        employmentType: employee.employmentType,
        amount:
          employee.employmentType === "freelance"
            ? employee.baseAmount
            : employee.salary,
      })),
    },
  };
}

export async function saveFinancialClosing(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const periodType = normalizePeriodType(payload.periodType);
  const periodStart = parseDateOnly(payload.periodStart);
  const periodEnd = parseDateOnly(
    payload.periodEnd,
    new Date(`${periodStart}T00:00:00Z`),
  );

  if (periodEnd < periodStart)
    throw new Error("periodEnd precisa ser maior ou igual ao periodStart.");

  const deliveredRows = await getOrdersInClosingRange(
    tenant.id,
    periodStart,
    periodEnd,
  );
  await ensureDeliveredOrdersAreSynced(tenant.id, deliveredRows);
  const bootstrap = await getTenantBootstrap(tenantSlug);
  const summary = buildClosingSnapshot({
    periodType,
    periodStart,
    periodEnd,
    bootstrap,
  });

  const row = ensureOk(
    await supabaseAdmin
      .from("financial_closings")
      .upsert(
        {
          tenant_id: tenant.id,
          period_type: periodType,
          period_start: periodStart,
          period_end: periodEnd,
          gross_revenue: summary.grossRevenue,
          net_revenue: summary.netRevenue,
          order_income: summary.orderIncome,
          manual_income: summary.manualIncome,
          manual_expenses: summary.manualExpenses,
          fixed_costs: summary.fixedCosts,
          payroll_costs: summary.payrollCosts,
          delivery_costs: summary.deliveryCosts,
          channel_fees: summary.channelFees,
          total_expenses: summary.totalExpenses,
          balance: summary.balance,
          status: "closed",
          snapshot: summary.snapshot,
          closed_at: new Date().toISOString(),
        },
        { onConflict: "tenant_id,period_type,period_start,period_end" },
      )
      .select("*")
      .single(),
    "Falha ao salvar fechamento financeiro.",
  );

  return mapFinancialClosing(row);
}

export async function saveMenuCategory(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const name = String(payload.name || "").trim();
  const sortOrder = Number.isInteger(payload.sortOrder)
    ? payload.sortOrder
    : payload.id
      ? undefined
      : await getNextMenuCategorySortOrder(tenant.id);

  if (!name) {
    throw new Error("Nome da categoria é obrigatório.");
  }

  const categoryPayload = {
    id: payload.id || undefined,
    tenant_id: tenant.id,
    name,
  };

  if (sortOrder !== undefined) {
    categoryPayload.sort_order = sortOrder;
  }

  const row = ensureOk(
    await (
      payload.id
        ? supabaseAdmin
            .from("menu_categories")
            .update(categoryPayload)
            .eq("tenant_id", tenant.id)
            .eq("id", payload.id)
        : supabaseAdmin.from("menu_categories").insert(categoryPayload)
    )
      .select("*")
      .single(),
    "Já existe uma categoria com este nome.",
  );

  return mapMenuCategory(row);
}

export async function deleteMenuCategoryById(tenantSlug, categoryId) {
  const tenant = await getTenantRowBySlug(tenantSlug);

  const deleted = maybeSingle(
    await supabaseAdmin
      .from("menu_categories")
      .delete()
      .eq("tenant_id", tenant.id)
      .eq("id", categoryId)
      .select("id")
      .maybeSingle(),
    "Falha ao remover categoria do menu.",
  );
  if (!deleted)
    throw new Error(
      "Categoria não encontrada nesta filial. Atualize a página e tente novamente.",
    );

  return true;
}

export async function reorderMenuCategories(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const items = sanitizeJsonArray(payload.items);

  if (items.length === 0) {
    throw new Error("Informe as categorias para reordenar.");
  }

  await Promise.all(
    items.map(async (item, index) =>
      ensureOk(
        await supabaseAdmin
          .from("menu_categories")
          .update({
            sort_order: Number.isInteger(item.sortOrder)
              ? item.sortOrder
              : index,
          })
          .eq("tenant_id", tenant.id)
          .eq("id", item.id),
        "Falha ao reordenar categorias do menu.",
      ),
    ),
  );

  return getTenantBootstrap(tenantSlug);
}

export async function saveMenuItem(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const name = String(payload.name || "").trim();
  const description = String(payload.description || "").trim();

  if (!name) throw new Error("Nome do item é obrigatório.");
  if (!description) throw new Error("Descrição do item é obrigatória.");

  const categoryId = await resolveMenuCategoryId(tenant.id, payload.category);
  const isCombo = payload.itemType === "combo";
  const comboGroups = sanitizeJsonArray(payload.comboGroups);
  const invalidComboGroup = isCombo ? getInvalidComboGroup(comboGroups) : null;
  if (isCombo && comboGroups.length === 0)
    throw new Error("O combo precisa ter pelo menos um grupo de opções.");
  if (invalidComboGroup) {
    throw new Error(
      `O grupo "${invalidComboGroup.name || "sem nome"}" não possui opções disponíveis suficientes para atingir o mínimo exigido.`,
    );
  }
  const sortOrder = Number.isInteger(payload.sortOrder)
    ? payload.sortOrder
    : payload.id
      ? undefined
      : await getNextMenuItemSortOrder(tenant.id, categoryId);

  const itemPayload = {
    id: payload.id || undefined,
    tenant_id: tenant.id,
    category_id: categoryId,
    item_type: mapMenuItemType(payload.itemType),
    name,
    description,
    status: payload.status || "active",
    sale_price: isCombo ? 0 : Number(payload.salePrice) || 0,
    base_price: isCombo ? Number(payload.basePrice) || 0 : 0,
    photo_preview: payload.photoPreview || "",
    linked_component_ids: isCombo
      ? []
      : sanitizeJsonArray(payload.linkedComponents),
  };

  if (sortOrder !== undefined) {
    itemPayload.sort_order = sortOrder;
  }

  const row = ensureOk(
    await (
      payload.id
        ? supabaseAdmin
            .from("menu_items")
            .update(itemPayload)
            .eq("tenant_id", tenant.id)
            .eq("id", payload.id)
        : supabaseAdmin.from("menu_items").insert(itemPayload)
    )
      .select("*")
      .single(),
    "Falha ao salvar item do menu.",
  );

  if (isCombo) {
    await replaceComboGroups({
      tenantId: tenant.id,
      menuItemId: row.id,
      comboGroups,
    });
  } else {
    await replaceComboGroups({
      tenantId: tenant.id,
      menuItemId: row.id,
      comboGroups: [],
    });
  }

  return mapMenuItem(await getMenuItemById(tenant.id, row.id));
}

export async function deleteMenuItemById(tenantSlug, itemId) {
  const tenant = await getTenantRowBySlug(tenantSlug);

  ensureOk(
    await supabaseAdmin
      .from("combo_options")
      .update({
        linked_component_ref: "",
        linked_category_name: "",
        linked_category_names: [],
      })
      .eq("tenant_id", tenant.id)
      .eq("linked_component_ref", `menu-item:${itemId}`),
    "Falha ao limpar vínculos do item.",
  );

  ensureOk(
    await supabaseAdmin
      .from("menu_items")
      .delete()
      .eq("tenant_id", tenant.id)
      .eq("id", itemId),
    "Falha ao remover item do menu.",
  );

  return true;
}

export async function reorderMenuItems(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const items = sanitizeJsonArray(payload.items);

  if (items.length === 0) {
    throw new Error("Informe os itens para reordenar.");
  }

  await Promise.all(
    items.map(async (item, index) =>
      ensureOk(
        await supabaseAdmin
          .from("menu_items")
          .update({
            sort_order: Number.isInteger(item.sortOrder)
              ? item.sortOrder
              : index,
          })
          .eq("tenant_id", tenant.id)
          .eq("id", item.id),
        "Falha ao reordenar itens do menu.",
      ),
    ),
  );

  return getTenantBootstrap(tenantSlug);
}

export async function saveIngredientUnit() {
  const error = new Error("As unidades são fixas e não podem ser alteradas.");
  error.statusCode = 403;
  throw error;
}

export async function deleteIngredientUnitById() {
  const error = new Error("As unidades são fixas e não podem ser excluídas.");
  error.statusCode = 403;
  throw error;
}

export async function saveIngredient(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const name = normalizeCatalogName(payload.name);
  const unit = payload.unit
    ? assertIngredientUnitLabel(payload.unit, "Unidade do insumo inválida.")
    : "";
  const packageCost = Number(payload.packageCost ?? payload.unitCost) || 0;
  const packageQuantity = Number(payload.packageQuantity) || 1;
  const fallbackUnitCost =
    packageQuantity > 0 ? packageCost / packageQuantity : packageCost;
  const unitCost = Number(payload.unitCost) || fallbackUnitCost;

  if (!name) throw new Error("Nome do insumo é obrigatório.");
  if (!unit) throw new Error("Unidade do insumo é obrigatória.");
  if (unitCost <= 0) throw new Error("Custo do insumo é obrigatório.");

  const row = ensureOk(
    await (
      payload.id
        ? supabaseAdmin
            .from("ingredients")
            .update({
              tenant_id: tenant.id,
              name,
              unit,
              package_quantity: packageQuantity,
              package_cost: packageCost,
              unit_cost: unitCost,
              category: String(payload.category || "GERAL")
                .trim()
                .toUpperCase(),
              primary_supplier_id: payload.primarySupplierId || null,
              stock_minimum:
                payload.stockMinimum === "" || payload.stockMinimum == null
                  ? null
                  : Math.max(Number(payload.stockMinimum) || 0, 0),
              active: payload.active !== false,
            })
            .eq("tenant_id", tenant.id)
            .eq("id", payload.id)
        : supabaseAdmin.from("ingredients").insert({
            tenant_id: tenant.id,
            name,
            unit,
            package_quantity: packageQuantity,
            package_cost: packageCost,
            unit_cost: unitCost,
            category: String(payload.category || "GERAL")
              .trim()
              .toUpperCase(),
            primary_supplier_id: payload.primarySupplierId || null,
            stock_minimum:
              payload.stockMinimum === "" || payload.stockMinimum == null
                ? null
                : Math.max(Number(payload.stockMinimum) || 0, 0),
            active: payload.active !== false,
          })
    )
      .select("*")
      .single(),
    "Já existe um insumo com este nome e unidade.",
  );

  return mapIngredient(row);
}

export async function deleteIngredientById(tenantSlug, ingredientId) {
  const tenant = await getTenantRowBySlug(tenantSlug);

  const [preparations, products, menuItems] = await Promise.all([
    ensureOk(
      await supabaseAdmin
        .from("preparations")
        .select("id, recipe")
        .eq("tenant_id", tenant.id),
      "Falha ao carregar receitas base.",
    ),
    ensureOk(
      await supabaseAdmin
        .from("products")
        .select("id, recipe")
        .eq("tenant_id", tenant.id),
      "Falha ao carregar produtos.",
    ),
    ensureOk(
      await supabaseAdmin
        .from("menu_items")
        .select("id, linked_component_ids")
        .eq("tenant_id", tenant.id),
      "Falha ao carregar itens do menu.",
    ),
  ]);

  const isUsed =
    preparations.some((preparation) =>
      hasRecipeComponent(preparation.recipe, "ingredient", ingredientId),
    ) ||
    products.some((product) =>
      hasRecipeComponent(product.recipe, "ingredient", ingredientId),
    ) ||
    menuItems.some((item) =>
      hasLinkedComponentId(
        item.linked_component_ids,
        "ingredient",
        ingredientId,
      ),
    );

  if (isUsed) {
    throw createCatalogDependencyError(
      "Este insumo está em uso em fichas técnicas ou itens do cardápio. Remova os vínculos antes de excluir.",
    );
  }

  ensureOk(
    await supabaseAdmin
      .from("ingredients")
      .delete()
      .eq("tenant_id", tenant.id)
      .eq("id", ingredientId),
    "Falha ao remover insumo.",
  );

  return true;
}

export async function savePreparation(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const name = normalizeCatalogName(payload.name);
  const yieldUnit = payload.yieldUnit
    ? assertIngredientUnitLabel(
        payload.yieldUnit,
        "Unidade de rendimento inválida.",
      )
    : "";

  if (!name) throw new Error("Nome da receita base é obrigatório.");
  if (!yieldUnit) throw new Error("Unidade de rendimento é obrigatória.");

  const row = ensureOk(
    await (
      payload.id
        ? supabaseAdmin
            .from("preparations")
            .update({
              tenant_id: tenant.id,
              name,
              yield_quantity: Number(payload.yieldQuantity) || 0,
              yield_unit: yieldUnit,
              recipe: normalizeRecipe(payload.recipe, { validateUnits: true }),
            })
            .eq("tenant_id", tenant.id)
            .eq("id", payload.id)
        : supabaseAdmin.from("preparations").insert({
            tenant_id: tenant.id,
            name,
            yield_quantity: Number(payload.yieldQuantity) || 0,
            yield_unit: yieldUnit,
            recipe: normalizeRecipe(payload.recipe, { validateUnits: true }),
          })
    )
      .select("*")
      .single(),
    "Já existe uma receita base com este nome.",
  );

  return mapPreparation(row);
}

export async function deletePreparationById(tenantSlug, preparationId) {
  const tenant = await getTenantRowBySlug(tenantSlug);

  const [preparations, products, menuItems] = await Promise.all([
    ensureOk(
      await supabaseAdmin
        .from("preparations")
        .select("id, recipe")
        .eq("tenant_id", tenant.id),
      "Falha ao carregar receitas base.",
    ),
    ensureOk(
      await supabaseAdmin
        .from("products")
        .select("id, recipe")
        .eq("tenant_id", tenant.id),
      "Falha ao carregar produtos.",
    ),
    ensureOk(
      await supabaseAdmin
        .from("menu_items")
        .select("id, linked_component_ids")
        .eq("tenant_id", tenant.id),
      "Falha ao carregar itens do menu.",
    ),
  ]);

  const isUsed =
    preparations.some(
      (preparation) =>
        String(preparation.id) !== String(preparationId) &&
        hasRecipeComponent(preparation.recipe, "preparation", preparationId),
    ) ||
    products.some((product) =>
      hasRecipeComponent(product.recipe, "preparation", preparationId),
    ) ||
    menuItems.some((item) =>
      hasLinkedComponentId(
        item.linked_component_ids,
        "preparation",
        preparationId,
      ),
    );

  if (isUsed) {
    throw createCatalogDependencyError(
      "Esta receita base está em uso em outras fichas técnicas ou itens do cardápio. Remova os vínculos antes de excluir.",
    );
  }

  ensureOk(
    await supabaseAdmin
      .from("preparations")
      .delete()
      .eq("tenant_id", tenant.id)
      .eq("id", preparationId),
    "Falha ao remover receita base.",
  );

  return true;
}

export async function saveProduct(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const name = normalizeCatalogName(payload.name);

  if (!name) throw new Error("Nome do produto é obrigatório.");

  const row = ensureOk(
    await (
      payload.id
        ? supabaseAdmin
            .from("products")
            .update({
              tenant_id: tenant.id,
              name,
              sale_price: Number(payload.salePrice) || 0,
              yield_quantity: Number(payload.yieldQuantity) || 1,
              target_cmv_percent: Number(payload.targetCmvPercent) || 0,
              recipe: normalizeRecipe(payload.recipe, { validateUnits: true }),
            })
            .eq("tenant_id", tenant.id)
            .eq("id", payload.id)
        : supabaseAdmin.from("products").insert({
            tenant_id: tenant.id,
            name,
            sale_price: Number(payload.salePrice) || 0,
            yield_quantity: Number(payload.yieldQuantity) || 1,
            target_cmv_percent: Number(payload.targetCmvPercent) || 0,
            recipe: normalizeRecipe(payload.recipe, { validateUnits: true }),
          })
    )
      .select("*")
      .single(),
    "Já existe um produto com este nome.",
  );

  return mapProduct(row);
}

export async function deleteProductById(tenantSlug, productId) {
  const tenant = await getTenantRowBySlug(tenantSlug);

  const [menuItems, comboOptions] = await Promise.all([
    ensureOk(
      await supabaseAdmin
        .from("menu_items")
        .select("id, linked_component_ids")
        .eq("tenant_id", tenant.id),
      "Falha ao carregar itens do menu.",
    ),
    ensureOk(
      await supabaseAdmin
        .from("combo_options")
        .select("id, linked_component_ref")
        .eq("tenant_id", tenant.id),
      "Falha ao carregar opções de combo.",
    ),
  ]);

  const isUsed =
    menuItems.some((item) =>
      hasLinkedComponentId(item.linked_component_ids, "product", productId),
    ) ||
    comboOptions.some((option) =>
      hasLinkedComponentRef(option.linked_component_ref, "product", productId),
    );

  if (isUsed) {
    throw createCatalogDependencyError(
      "Este produto está em uso no cardápio ou em combos. Remova os vínculos antes de excluir.",
    );
  }

  ensureOk(
    await supabaseAdmin
      .from("products")
      .delete()
      .eq("tenant_id", tenant.id)
      .eq("id", productId),
    "Falha ao remover produto.",
  );

  return true;
}
