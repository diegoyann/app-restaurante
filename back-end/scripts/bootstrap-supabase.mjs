import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MOCK_TENANT_RECORDS, MOCK_USERS } from '../../shared/mock-data/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, 'utf8');

  for (const rawLine of content.split(/\r?\n/u)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) continue;

    const key = line.slice(0, separatorIndex).trim();
    if (!key || process.env[key] !== undefined) continue;

    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadEnvFile(resolve(projectRoot, '.env'));

const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Variável ausente: ${name}`);
  return value;
};

const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || 'TroqueEssaSenhaAgora123!';

const supabase = createClient(required('SUPABASE_URL'), required('SUPABASE_SECRET_KEY'), {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function ensureCompany(tenant) {
  const existing = await supabase
    .from('companies')
    .select('*')
    .eq('slug', tenant.slug)
    .maybeSingle();

  if (existing.error && existing.status !== 406) throw existing.error;

  const companyPayload = {
    name: tenant.businessName,
    business_name: tenant.businessName,
    status: 'active'
  };

  if (existing.data) {
    const { data, error } = await supabase
      .from('companies')
      .update(companyPayload)
      .eq('id', existing.data.id)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('companies')
    .insert({ slug: tenant.slug, ...companyPayload })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

async function ensureTenant(tenant) {
  const company = await ensureCompany(tenant);
  const existing = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', tenant.slug)
    .maybeSingle();

  if (existing.error && existing.status !== 406) throw existing.error;

  if (existing.data) {
    const { data, error } = await supabase
      .from('tenants')
      .update({
        name: tenant.name,
        business_name: tenant.businessName,
        company_id: company.id,
        branch_code: tenant.slug,
        branch_name: tenant.name,
        is_headquarters: true
      })
      .eq('id', existing.data.id)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('tenants')
    .insert({
      slug: tenant.slug,
      name: tenant.name,
      business_name: tenant.businessName,
      company_id: company.id,
      branch_code: tenant.slug,
      branch_name: tenant.name,
      is_headquarters: true
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

async function ensureTenantSettings(tenantId, bootstrap) {
  const { error } = await supabase
    .from('tenant_settings')
    .upsert(
      {
        tenant_id: tenantId,
        business_name: bootstrap.settings.businessName,
        ifood_tax: bootstrap.settings.ifoodTax,
        anotaai_tax: bootstrap.settings.anotaaiTax,
        alert_days_before: bootstrap.settings.alertDaysBefore
      },
      { onConflict: 'tenant_id' }
    );

  if (error) throw error;
}

async function clearTenantBootstrapData(tenantId) {
  const tables = [
    'combo_options',
    'combo_groups',
    'menu_items',
    'menu_categories',
    'reviews',
    'products',
    'preparations',
    'ingredients',
    'ingredient_units',
    'transactions',
    'employee_discounts',
    'employees',
    'discount_categories',
    'employee_roles',
    'recurring_costs',
    'finance_expense_categories',
    'sales_channels'
  ];

  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq('tenant_id', tenantId);
    if (error) throw error;
  }
}

async function insertRows(table, rows) {
  if (!rows.length) return [];

  const { data, error } = await supabase.from(table).insert(rows).select('*');
  if (error) throw error;

  return data || [];
}

function mapInsertedIds(sourceRows, insertedRows) {
  return new Map(sourceRows.map((row, index) => [row.id, insertedRows[index]?.id]).filter(([, id]) => id));
}

function remapRecipe(recipe = [], maps) {
  return recipe.map((line) => ({
    ...line,
    componentId: maps[line.componentType]?.get(line.componentId) || line.componentId
  }));
}

function remapLinkedComponents(components = [], maps) {
  return components.map((component) => ({
    ...component,
    id: maps[component.type]?.get(component.id) || component.id
  }));
}

function remapLinkedComponentRef(ref, maps) {
  if (!ref) return '';

  const [type, rawId] = String(ref).split(':');
  const numericId = Number(rawId);
  const mappedId = maps[type]?.get(Number.isNaN(numericId) ? rawId : numericId);

  return mappedId ? `${type}:${mappedId}` : ref;
}

async function ensureTenantBootstrapData(tenantId, bootstrap) {
  await clearTenantBootstrapData(tenantId);

  await insertRows('sales_channels', (bootstrap.salesChannels || []).map((item) => ({
    tenant_id: tenantId,
    name: item.name
  })));

  await insertRows('finance_expense_categories', (bootstrap.financeExpenseCategories || []).map((item) => ({
    tenant_id: tenantId,
    name: item.name
  })));

  await insertRows('recurring_costs', (bootstrap.recurringCosts || []).map((item) => ({
    tenant_id: tenantId,
    description: item.desc,
    amount: item.amount,
    due_day: item.dueDay,
    last_paid_month: item.lastPaidMonth || ''
  })));

  await insertRows('employee_roles', (bootstrap.employeeRoles || []).map((item) => ({
    tenant_id: tenantId,
    name: item.name
  })));

  await insertRows('discount_categories', (bootstrap.discountCategories || []).map((item) => ({
    tenant_id: tenantId,
    name: item.name
  })));

  const employees = bootstrap.employees || [];
  const insertedEmployees = await insertRows('employees', employees.map((item) => ({
    tenant_id: tenantId,
    full_name: item.name,
    phone: item.phone || '',
    email: item.email || '',
    address: item.address || '',
    marital_status: item.maritalStatus || '',
    role: item.role || '',
    notes: item.notes || '',
    employment_type: item.employmentType || 'fixed',
    status: item.status || 'active',
    salary: item.salary || 0,
    admission_date: item.admissionDate || null,
    payment_mode: item.paymentMode || 'weekly',
    base_amount: item.baseAmount || 0,
    weekday: item.weekday || '1',
    specific_date: item.specificDate || null,
    start_date: item.startDate || null
  })));
  const employeeIds = mapInsertedIds(employees, insertedEmployees);

  await insertRows('employee_discounts', employees.flatMap((employee) => (
    (employee.discounts || []).map((discount) => ({
      tenant_id: tenantId,
      employee_id: employeeIds.get(employee.id),
      category: discount.category,
      amount: discount.amount
    })).filter((discount) => discount.employee_id)
  )));

  await insertRows('transactions', (bootstrap.transactions || []).map((item) => ({
    tenant_id: tenantId,
    transaction_date: item.date,
    platform: item.platform,
    payment: item.payment,
    amount: item.amount,
    tax: item.tax,
    net_amount: item.net,
    type: item.type,
    category: item.category,
    note: item.note || ''
  })));

  const ingredientUnits = bootstrap.ingredientUnits || [];
  await insertRows('ingredient_units', ingredientUnits.map((item) => ({
    tenant_id: tenantId,
    label: item.label
  })));

  const ingredients = bootstrap.ingredients || [];
  const insertedIngredients = await insertRows('ingredients', ingredients.map((item) => ({
    tenant_id: tenantId,
    name: item.name,
    unit: item.unit,
    package_quantity: item.packageQuantity || 1,
    package_cost: item.packageCost ?? item.unitCost ?? 0,
    unit_cost: item.unitCost ?? (
      Number(item.packageQuantity || 0) > 0
        ? Number(item.packageCost || 0) / Number(item.packageQuantity || 1)
        : 0
    )
  })));
  const ingredientIds = mapInsertedIds(ingredients, insertedIngredients);

  const preparations = bootstrap.preparations || [];
  const insertedPreparations = await insertRows('preparations', preparations.map((item) => ({
    tenant_id: tenantId,
    name: item.name,
    yield_quantity: item.yieldQuantity,
    yield_unit: item.yieldUnit,
    recipe: remapRecipe(item.recipe, { ingredient: ingredientIds })
  })));
  const preparationIds = mapInsertedIds(preparations, insertedPreparations);

  const products = bootstrap.products || [];
  const insertedProducts = await insertRows('products', products.map((item) => ({
    tenant_id: tenantId,
    name: item.name,
    sale_price: item.salePrice,
    yield_quantity: item.yieldQuantity,
    target_cmv_percent: item.targetCmvPercent,
    recipe: remapRecipe(item.recipe, { ingredient: ingredientIds, preparation: preparationIds })
  })));
  const productIds = mapInsertedIds(products, insertedProducts);

  const menuCategories = bootstrap.menuCategories || [];
  const insertedMenuCategories = await insertRows('menu_categories', menuCategories.map((item) => ({
    tenant_id: tenantId,
    name: item.name
  })));
  const menuCategoryIds = mapInsertedIds(menuCategories, insertedMenuCategories);
  const menuCategoryIdsByName = new Map(menuCategories.map((item) => [item.name, menuCategoryIds.get(item.id)]));

  const menuItems = bootstrap.menuItems || [];
  const insertedMenuItems = await insertRows('menu_items', menuItems.map((item) => ({
    tenant_id: tenantId,
    category_id: menuCategoryIdsByName.get(item.category) || null,
    item_type: item.itemType === 'combo' ? 'combo' : 'single',
    name: item.name,
    description: item.description || '',
    status: item.status || 'active',
    sale_price: item.salePrice || 0,
    base_price: item.basePrice || 0,
    photo_preview: item.photoPreview || '',
    linked_component_ids: remapLinkedComponents(item.linkedComponents, {
      ingredient: ingredientIds,
      preparation: preparationIds,
      product: productIds
    })
  })));
  const menuItemIds = mapInsertedIds(menuItems, insertedMenuItems);

  for (const item of menuItems.filter((menuItem) => menuItem.itemType === 'combo')) {
    const menuItemId = menuItemIds.get(item.id);
    if (!menuItemId) continue;

    const groups = item.comboGroups || [];
    const insertedGroups = await insertRows('combo_groups', groups.map((group, index) => ({
      tenant_id: tenantId,
      menu_item_id: menuItemId,
      name: group.name,
      min_select: Number(group.minSelect) || 0,
      max_select: Number(group.maxSelect) || 0,
      sort_order: index
    })));

    for (const [groupIndex, group] of groups.entries()) {
      const groupId = insertedGroups[groupIndex]?.id;
      if (!groupId) continue;

      await insertRows('combo_options', (group.options || []).map((option, optionIndex) => ({
        tenant_id: tenantId,
        combo_group_id: groupId,
        name: option.name,
        photo_preview: option.photoPreview || '',
        extra_price: Number(option.extraPrice) || 0,
        max_qty: Number(option.maxQty) || 1,
        is_available: option.isAvailable !== false,
        linked_category_name: option.linkedCategoryName || '',
        linked_component_ref: remapLinkedComponentRef(option.linkedComponentRef, {
          ingredient: ingredientIds,
          preparation: preparationIds,
          product: productIds,
          'menu-item': menuItemIds
        }),
        sort_order: optionIndex
      })));
    }
  }

  await insertRows('reviews', (bootstrap.reviews || []).map((item) => ({
    tenant_id: tenantId,
    source: item.source,
    source_review_id: item.sourceReviewId || '',
    company_key: item.companyKey || '',
    company_label: item.companyLabel || '',
    unit_label: item.unitLabel || '',
    channel_label: item.channelLabel || '',
    reviewer_name: item.reviewerName,
    reviewer_initials: item.reviewerInitials || '',
    reviewer_location: item.reviewerLocation || '',
    rating: item.rating,
    sentiment: item.sentiment,
    status: item.status,
    resolution_type: item.resolutionType || null,
    created_at_label: item.createdAtLabel || '',
    published_reply: item.publishedReply || '',
    tags: item.tags || [],
    comment: item.comment || '',
    ai_suggestion: item.aiSuggestion || '',
    integration_status: item.integrationStatus || 'draft'
  })));
}

async function ensureTenantAiSettings(tenantId, bootstrap) {
  const { error } = await supabase
    .from('tenant_ai_settings')
    .upsert(
      {
        tenant_id: tenantId,
        positive_tone: bootstrap.aiBehaviorSettings.positiveTone,
        crisis_strategy: bootstrap.aiBehaviorSettings.crisisStrategy,
        additional_instructions: bootstrap.aiBehaviorSettings.additionalInstructions,
        auto_publish_positive: bootstrap.aiBehaviorSettings.autoPublishPositive
      },
      { onConflict: 'tenant_id' }
    );

  if (error) throw error;
}

async function ensurePayrollConfig(tenantId, bootstrap) {
  const { error } = await supabase
    .from('payroll_configs')
    .upsert(
      {
        tenant_id: tenantId,
        salary_percentage: bootstrap.payrollConfig.salaryPercentage,
        salary_business_day_ordinal: bootstrap.payrollConfig.salaryBusinessDayOrdinal,
        advance_percentage: bootstrap.payrollConfig.advancePercentage,
        advance_fixed_day: bootstrap.payrollConfig.advanceFixedDay,
        advance_business_day_policy: bootstrap.payrollConfig.advanceBusinessDayPolicy,
        holiday_dates: bootstrap.payrollConfig.holidayDates || []
      },
      { onConflict: 'tenant_id' }
    );

  if (error) throw error;
}

async function findUserIdByEmail(email) {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;
  return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase())?.id || null;
}

async function ensureUser(user, tenantMap) {
  const created = await supabase.auth.admin.createUser({
    email: user.email,
    password: defaultPassword,
    email_confirm: true,
    user_metadata: { full_name: user.fullName }
  });

  const userId = created.data.user?.id || await findUserIdByEmail(user.email);

  if (!userId) {
    throw created.error || new Error(`Falha ao preparar usuário ${user.email}`);
  }

  const tenantId = user.tenantSlug ? tenantMap.get(user.tenantSlug)?.id : null;
  const { error: membershipError } = await supabase.from('tenant_memberships').upsert(
    {
      user_id: userId,
      tenant_id: tenantId,
      role: user.role
    },
    { onConflict: 'user_id,tenant_id,role' }
  );

  if (membershipError) throw membershipError;
}

async function main() {
  const tenantMap = new Map();
  const selectedTenantSlug = String(process.env.SEED_TENANT_SLUG || '').trim();
  const tenantsToSeed = selectedTenantSlug
    ? MOCK_TENANT_RECORDS.filter((tenant) => tenant.slug === selectedTenantSlug)
    : MOCK_TENANT_RECORDS;

  if (selectedTenantSlug && tenantsToSeed.length === 0) {
    throw new Error(`Tenant não encontrado no dataset compartilhado: ${selectedTenantSlug}`);
  }

  for (const tenant of tenantsToSeed) {
    const savedTenant = await ensureTenant(tenant);
    tenantMap.set(savedTenant.slug, savedTenant);
    await ensureTenantSettings(savedTenant.id, tenant.bootstrap);
    await ensureTenantAiSettings(savedTenant.id, tenant.bootstrap);
    await ensurePayrollConfig(savedTenant.id, tenant.bootstrap);
    await ensureTenantBootstrapData(savedTenant.id, tenant.bootstrap);
  }

  const usersToSeed = selectedTenantSlug
    ? MOCK_USERS.filter((user) => !user.tenantSlug || user.tenantSlug === selectedTenantSlug)
    : MOCK_USERS;

  for (const user of usersToSeed) {
    await ensureUser(user, tenantMap);
  }

  console.log(
    `Seed carregado do dataset compartilhado${selectedTenantSlug ? ` para ${selectedTenantSlug}` : ''}. Senha temporária usada: ${process.env.SEED_DEFAULT_PASSWORD ? 'SEED_DEFAULT_PASSWORD' : 'fallback local'}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
