import { supabaseAdmin } from '../lib/supabaseAdmin.js';

function ensureOk(result, fallbackMessage) {
  if (result.error) {
    const error = new Error(result.error.message || fallbackMessage);
    error.statusCode = result.status || 500;
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

async function getTenantRowBySlug(slug) {
  const tenant = maybeSingle(
    await supabaseAdmin
      .from('tenants')
      .select('id, slug, name, business_name, status')
      .eq('slug', slug)
      .maybeSingle(),
    'Falha ao carregar tenant.'
  );

  if (!tenant) {
    const error = new Error('Tenant não encontrado.');
    error.statusCode = 404;
    throw error;
  }

  return tenant;
}

function mapEmployee(row) {
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
    admissionDate: row.admission_date || '',
    paymentMode: row.payment_mode,
    baseAmount: Number(row.base_amount || 0),
    weekday: row.weekday,
    specificDate: row.specific_date || '',
    startDate: row.start_date || ''
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
    note: row.note
  };
}

function mapRecurringCost(row) {
  return {
    id: row.id,
    desc: row.description,
    amount: Number(row.amount || 0),
    dueDay: row.due_day,
    lastPaidMonth: row.last_paid_month || ''
  };
}

function mapSimpleName(row) {
  return { id: row.id, name: row.name };
}

function mapMenuCategory(row) {
  return { id: row.id, name: row.name };
}

function mapMenuItem(row) {
  return {
    id: row.id,
    category: row.menu_categories?.name || '',
    description: row.description,
    status: row.status,
    salePrice: Number(row.sale_price || 0),
    basePrice: Number(row.base_price || 0),
    photoPreview: row.photo_preview || '',
    linkedComponentIds: Array.isArray(row.linked_component_ids) ? row.linked_component_ids : [],
    itemType: row.item_type,
    name: row.name,
    comboGroups: (row.combo_groups || []).map((group) => ({
      id: group.id,
      name: group.name,
      minSelect: String(group.min_select),
      maxSelect: String(group.max_select),
      options: (group.combo_options || [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((option) => ({
          id: option.id,
          name: option.name,
          photoPreview: option.photo_preview || '',
          extraPrice: String(Number(option.extra_price || 0)),
          maxQty: String(option.max_qty || 1),
          isAvailable: option.is_available,
          linkedCategoryName: option.linked_category_name || '',
          linkedComponentRef: option.linked_component_ref || ''
        }))
    }))
  };
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
    integrationStatus: row.integration_status
  };
}

function mapPreparation(row) {
  return {
    id: row.id,
    name: row.name,
    yieldQuantity: Number(row.yield_quantity || 0),
    yieldUnit: row.yield_unit,
    recipe: Array.isArray(row.recipe) ? row.recipe : []
  };
}

function mapProduct(row) {
  return {
    id: row.id,
    name: row.name,
    salePrice: Number(row.sale_price || 0),
    yieldQuantity: Number(row.yield_quantity || 0),
    targetCmvPercent: Number(row.target_cmv_percent || 0),
    recipe: Array.isArray(row.recipe) ? row.recipe : []
  };
}

function mapIngredient(row) {
  return {
    id: row.id,
    name: row.name,
    unit: row.unit,
    packageQuantity: Number(row.package_quantity || 0),
    packageCost: Number(row.package_cost || 0)
  };
}

function mapMembership(row) {
  return {
    id: row.id,
    role: row.role,
    tenant: row.tenants
      ? {
          id: row.tenants.id,
          slug: row.tenants.slug,
          name: row.tenants.name,
          businessName: row.tenants.business_name,
          status: row.tenants.status
        }
      : null
  };
}

async function getDiscountsByEmployee(tenantId) {
  const rows = ensureOk(
    await supabaseAdmin
      .from('employee_discounts')
      .select('*')
      .eq('tenant_id', tenantId),
    'Falha ao carregar descontos de funcionários.'
  );

  return rows.reduce((acc, row) => {
    const employeeId = row.employee_id;
    if (!acc[employeeId]) acc[employeeId] = [];
    acc[employeeId].push({
      id: row.id,
      category: row.category,
      amount: Number(row.amount || 0)
    });
    return acc;
  }, {});
}

export async function getAuthSession(identity) {
  const memberships = ensureOk(
    await supabaseAdmin
      .from('tenant_memberships')
      .select(`
        id,
        role,
        tenants:tenant_id (
          id,
          slug,
          name,
          business_name,
          status
        )
      `)
      .eq('user_id', identity.user.id),
    'Falha ao carregar memberships.'
  ).map(mapMembership);

  const currentTenant = memberships.find((item) => item.tenant && item.role !== 'super_admin')?.tenant || null;

  return {
    user: {
      id: identity.user.id,
      email: identity.user.email,
      name: identity.user.metadata.full_name || identity.user.email,
      role: identity.isSuperAdmin ? 'super_admin' : memberships[0]?.role || 'tenant_staff'
    },
    memberships,
    currentTenant
  };
}

export async function getTenantBootstrap(tenantSlug) {
  const tenant = await getTenantRowBySlug(tenantSlug);

  const [
    settings,
    aiSettings,
    payrollConfig,
    employees,
    discountsByEmployee,
    recurringCosts,
    salesChannels,
    financeExpenseCategories,
    transactions,
    employeeRoles,
    discountCategories,
    ingredients,
    ingredientUnits,
    preparations,
    products,
    menuCategories,
    menuItems,
    reviews
  ] = await Promise.all([
    maybeSingle(await supabaseAdmin.from('tenant_settings').select('*').eq('tenant_id', tenant.id).maybeSingle(), 'Falha ao carregar settings.'),
    maybeSingle(await supabaseAdmin.from('tenant_ai_settings').select('*').eq('tenant_id', tenant.id).maybeSingle(), 'Falha ao carregar IA.'),
    maybeSingle(await supabaseAdmin.from('payroll_configs').select('*').eq('tenant_id', tenant.id).maybeSingle(), 'Falha ao carregar folha.'),
    ensureOk(await supabaseAdmin.from('employees').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: true }), 'Falha ao carregar funcionários.'),
    getDiscountsByEmployee(tenant.id),
    ensureOk(await supabaseAdmin.from('recurring_costs').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: true }), 'Falha ao carregar custos fixos.'),
    ensureOk(await supabaseAdmin.from('sales_channels').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: true }), 'Falha ao carregar canais.'),
    ensureOk(await supabaseAdmin.from('finance_expense_categories').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: true }), 'Falha ao carregar categorias financeiras.'),
    ensureOk(await supabaseAdmin.from('transactions').select('*').eq('tenant_id', tenant.id).order('transaction_date', { ascending: false }), 'Falha ao carregar transações.'),
    ensureOk(await supabaseAdmin.from('employee_roles').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: true }), 'Falha ao carregar cargos.'),
    ensureOk(await supabaseAdmin.from('discount_categories').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: true }), 'Falha ao carregar categorias de desconto.'),
    ensureOk(await supabaseAdmin.from('ingredients').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: true }), 'Falha ao carregar insumos.'),
    ensureOk(await supabaseAdmin.from('ingredient_units').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: true }), 'Falha ao carregar unidades.'),
    ensureOk(await supabaseAdmin.from('preparations').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: true }), 'Falha ao carregar preparações.'),
    ensureOk(await supabaseAdmin.from('products').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: true }), 'Falha ao carregar produtos.'),
    ensureOk(await supabaseAdmin.from('menu_categories').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: true }), 'Falha ao carregar categorias de menu.'),
    ensureOk(
      await supabaseAdmin
        .from('menu_items')
        .select(`
          *,
          menu_categories ( name ),
          combo_groups (
            *,
            combo_options ( * )
          )
        `)
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: true }),
      'Falha ao carregar itens do menu.'
    ),
    ensureOk(await supabaseAdmin.from('reviews').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: false }), 'Falha ao carregar avaliações.')
  ]);

  return {
    tenant: {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name
    },
    settings: settings
      ? {
          ifoodTax: Number(settings.ifood_tax || 0),
          anotaaiTax: Number(settings.anotaai_tax || 0),
          appPassword: '',
          passwordReminder: settings.app_password_hint || '',
          businessName: settings.business_name || tenant.business_name,
          alertDaysBefore: settings.alert_days_before || 0
        }
      : null,
    aiBehaviorSettings: aiSettings
      ? {
          positiveTone: aiSettings.positive_tone,
          crisisStrategy: aiSettings.crisis_strategy,
          additionalInstructions: aiSettings.additional_instructions,
          autoPublishPositive: aiSettings.auto_publish_positive
        }
      : null,
    payrollConfig: payrollConfig
      ? {
          salaryPercentage: Number(payrollConfig.salary_percentage || 0),
          salaryBusinessDayOrdinal: payrollConfig.salary_business_day_ordinal,
          advancePercentage: Number(payrollConfig.advance_percentage || 0),
          advanceFixedDay: payrollConfig.advance_fixed_day,
          advanceBusinessDayPolicy: payrollConfig.advance_business_day_policy,
          holidayDates: Array.isArray(payrollConfig.holiday_dates) ? payrollConfig.holiday_dates : []
        }
      : null,
    employees: employees.map((row) => ({
      ...mapEmployee(row),
      discounts: discountsByEmployee[row.id] || []
    })),
    recurringCosts: recurringCosts.map(mapRecurringCost),
    salesChannels: salesChannels.map(mapSimpleName),
    financeExpenseCategories: financeExpenseCategories.map(mapSimpleName),
    transactions: transactions.map(mapTransaction),
    employeeRoles: employeeRoles.map(mapSimpleName),
    discountCategories: discountCategories.map(mapSimpleName),
    ingredients: ingredients.map(mapIngredient),
    ingredientUnits: ingredientUnits.map((row) => ({ id: row.id, label: row.label })),
    preparations: preparations.map(mapPreparation),
    products: products.map(mapProduct),
    menuCategories: menuCategories.map(mapMenuCategory),
    menuItems: menuItems.map(mapMenuItem),
    reviews: reviews.map(mapReview)
  };
}

export async function getAdminBootstrap(selectedTenantSlug = '') {
  const tenants = ensureOk(
    await supabaseAdmin
      .from('tenants')
      .select('id, slug, name, business_name, status')
      .order('created_at', { ascending: true }),
    'Falha ao carregar tenants.'
  );

  const chosenSlug = selectedTenantSlug || tenants[0]?.slug || '';

  return {
    availableTenants: tenants.map((tenant) => ({
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name
    })),
    selectedTenantSlug: chosenSlug,
    selectedTenant: chosenSlug ? await getAdminTenantSnapshot(chosenSlug) : null
  };
}

export async function getAdminTenantSnapshot(tenantSlug) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const bootstrap = await getTenantBootstrap(tenantSlug);
  const memberships = ensureOk(
    await supabaseAdmin
      .from('tenant_memberships')
      .select('id, role, user_id')
      .eq('tenant_id', tenant.id),
    'Falha ao carregar usuários do tenant.'
  );
  const profileIds = [...new Set(memberships.map((row) => row.user_id).filter(Boolean))];
  const profiles = profileIds.length === 0
    ? []
    : ensureOk(
        await supabaseAdmin
          .from('profiles')
          .select('id, full_name, email')
          .in('id', profileIds),
        'Falha ao carregar perfis dos usuários.'
      );
  const profilesById = new Map(
    profiles.map((profile) => [
      profile.id,
      {
        fullName: profile.full_name || '',
        email: profile.email || ''
      }
    ])
  );

  return {
    tenant: {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name
    },
    summary: {
      users: memberships.length,
      employees: bootstrap.employees.length,
      salesChannels: bootstrap.salesChannels.length,
      recurringCosts: bootstrap.recurringCosts.length,
      transactions: bootstrap.transactions.length
    },
    users: memberships.map((row) => {
      const profile = profilesById.get(row.user_id);

      return {
        id: row.user_id,
        name: profile?.fullName || profile?.email || 'Usuário',
        email: profile?.email || '',
        role: row.role,
        tenantSlug
      };
    }),
    data: {
      settings: bootstrap.settings,
      aiBehaviorSettings: bootstrap.aiBehaviorSettings,
      payrollConfig: bootstrap.payrollConfig,
      employees: bootstrap.employees,
      recurringCosts: bootstrap.recurringCosts,
      salesChannels: bootstrap.salesChannels,
      financeExpenseCategories: bootstrap.financeExpenseCategories,
      transactions: bootstrap.transactions
    }
  };
}

export async function upsertTenant({ tenantSlug, name, businessName }) {
  const current = tenantSlug ? await getTenantRowBySlug(tenantSlug) : null;

  const payload = {
    slug: tenantSlug,
    name,
    business_name: businessName || name,
    status: 'active'
  };

  const tenant = ensureOk(
    await supabaseAdmin
      .from('tenants')
      .upsert(current ? { ...payload, id: current.id } : payload)
      .select('*')
      .single(),
    'Falha ao salvar tenant.'
  );

  await supabaseAdmin
    .from('tenant_settings')
    .upsert({
      tenant_id: tenant.id,
      business_name: businessName || name
    });

  return tenant;
}

export async function deleteTenantBySlug(tenantSlug) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  ensureOk(await supabaseAdmin.from('tenant_memberships').delete().eq('tenant_id', tenant.id), 'Falha ao remover memberships.');
  ensureOk(await supabaseAdmin.from('tenants').delete().eq('id', tenant.id), 'Falha ao remover tenant.');
  return tenant;
}

export async function saveTenantUser({ tenantSlug, payload }) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  let userId = payload.id;

  if (!userId) {
    const createdUser = await supabaseAdmin.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true,
      user_metadata: {
        full_name: payload.name
      }
    });

    if (createdUser.error || !createdUser.data.user) {
      throw new Error(createdUser.error?.message || 'Falha ao criar usuário.');
    }

    userId = createdUser.data.user.id;
  } else {
    const updated = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email: payload.email,
      password: payload.password || undefined,
      user_metadata: {
        full_name: payload.name
      }
    });

    if (updated.error) {
      throw new Error(updated.error.message || 'Falha ao atualizar usuário.');
    }
  }

  ensureOk(
    await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        full_name: payload.name,
        email: payload.email,
        status: 'active'
      }),
    'Falha ao sincronizar perfil.'
  );

  ensureOk(
    await supabaseAdmin
      .from('tenant_memberships')
      .upsert({
        user_id: userId,
        tenant_id: tenant.id,
        role: payload.role
      }),
    'Falha ao salvar membership.'
  );

  return getAdminTenantSnapshot(tenantSlug);
}

export async function deleteTenantUserById({ tenantSlug, userId }) {
  const tenant = await getTenantRowBySlug(tenantSlug);

  ensureOk(
    await supabaseAdmin
      .from('tenant_memberships')
      .delete()
      .eq('tenant_id', tenant.id)
      .eq('user_id', userId),
    'Falha ao remover membership.'
  );

  return getAdminTenantSnapshot(tenantSlug);
}

export async function saveSettings(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const row = ensureOk(
    await supabaseAdmin
      .from('tenant_settings')
      .upsert({
        tenant_id: tenant.id,
        ifood_tax: payload.ifoodTax,
        anotaai_tax: payload.anotaaiTax,
        app_password_hint: payload.passwordReminder || '',
        business_name: payload.businessName,
        alert_days_before: payload.alertDaysBefore
      })
      .select('*')
      .single(),
    'Falha ao salvar settings.'
  );

  return {
    ifoodTax: Number(row.ifood_tax || 0),
    anotaaiTax: Number(row.anotaai_tax || 0),
    appPassword: '',
    passwordReminder: row.app_password_hint || '',
    businessName: row.business_name,
    alertDaysBefore: row.alert_days_before
  };
}

export async function saveAiSettings(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const row = ensureOk(
    await supabaseAdmin
      .from('tenant_ai_settings')
      .upsert({
        tenant_id: tenant.id,
        positive_tone: payload.positiveTone,
        crisis_strategy: payload.crisisStrategy,
        additional_instructions: payload.additionalInstructions,
        auto_publish_positive: payload.autoPublishPositive
      })
      .select('*')
      .single(),
    'Falha ao salvar comportamento da IA.'
  );

  return {
    positiveTone: row.positive_tone,
    crisisStrategy: row.crisis_strategy,
    additionalInstructions: row.additional_instructions,
    autoPublishPositive: row.auto_publish_positive
  };
}

export async function savePayrollConfig(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const row = ensureOk(
    await supabaseAdmin
      .from('payroll_configs')
      .upsert({
        tenant_id: tenant.id,
        salary_percentage: payload.salaryPercentage,
        salary_business_day_ordinal: payload.salaryBusinessDayOrdinal,
        advance_percentage: payload.advancePercentage,
        advance_fixed_day: payload.advanceFixedDay,
        advance_business_day_policy: payload.advanceBusinessDayPolicy,
        holiday_dates: payload.holidayDates || []
      })
      .select('*')
      .single(),
    'Falha ao salvar configuração de folha.'
  );

  return {
    salaryPercentage: Number(row.salary_percentage || 0),
    salaryBusinessDayOrdinal: row.salary_business_day_ordinal,
    advancePercentage: Number(row.advance_percentage || 0),
    advanceFixedDay: row.advance_fixed_day,
    advanceBusinessDayPolicy: row.advance_business_day_policy,
    holidayDates: Array.isArray(row.holiday_dates) ? row.holiday_dates : []
  };
}

export async function saveEmployee(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);

  const employeeRow = ensureOk(
    await supabaseAdmin
      .from('employees')
      .upsert({
        id: payload.id || undefined,
        tenant_id: tenant.id,
        full_name: payload.name,
        phone: payload.phone || '',
        email: payload.email || '',
        address: payload.address || '',
        marital_status: payload.maritalStatus || '',
        role: payload.role || '',
        notes: payload.notes || '',
        employment_type: payload.employmentType,
        status: payload.status || 'active',
        salary: payload.salary || 0,
        admission_date: payload.admissionDate || null,
        payment_mode: payload.paymentMode || 'weekly',
        base_amount: payload.baseAmount || 0,
        weekday: payload.weekday || '1',
        specific_date: payload.specificDate || null,
        start_date: payload.startDate || null
      })
      .select('*')
      .single(),
    'Falha ao salvar funcionário.'
  );

  ensureOk(
    await supabaseAdmin.from('employee_discounts').delete().eq('employee_id', employeeRow.id),
    'Falha ao limpar descontos.'
  );

  if (Array.isArray(payload.discounts) && payload.discounts.length > 0) {
    ensureOk(
      await supabaseAdmin
        .from('employee_discounts')
        .insert(payload.discounts.map((discount) => ({
          tenant_id: tenant.id,
          employee_id: employeeRow.id,
          category: discount.category,
          amount: discount.amount
        }))),
      'Falha ao salvar descontos.'
    );
  }

  const discountRows = ensureOk(
    await supabaseAdmin.from('employee_discounts').select('*').eq('employee_id', employeeRow.id),
    'Falha ao recarregar descontos.'
  );

  return {
    ...mapEmployee(employeeRow),
    discounts: discountRows.map((discount) => ({
      id: discount.id,
      category: discount.category,
      amount: Number(discount.amount || 0)
    }))
  };
}

export async function deleteEmployeeById(tenantSlug, employeeId) {
  ensureOk(await supabaseAdmin.from('employees').delete().eq('id', employeeId), 'Falha ao remover funcionário.');
  return true;
}

export async function saveTransaction(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const row = ensureOk(
    await supabaseAdmin
      .from('transactions')
      .insert({
        tenant_id: tenant.id,
        transaction_date: payload.date,
        platform: payload.platform,
        payment: payload.payment,
        amount: payload.amount,
        tax: payload.tax,
        net_amount: payload.net,
        type: payload.type,
        category: payload.category,
        note: payload.note || ''
      })
      .select('*')
      .single(),
    'Falha ao salvar transação.'
  );

  return mapTransaction(row);
}

export async function saveRecurringCost(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const row = ensureOk(
    await supabaseAdmin
      .from('recurring_costs')
      .upsert({
        id: payload.id || undefined,
        tenant_id: tenant.id,
        description: payload.desc,
        amount: payload.amount,
        due_day: payload.dueDay,
        last_paid_month: payload.lastPaidMonth || ''
      })
      .select('*')
      .single(),
    'Falha ao salvar custo fixo.'
  );

  return mapRecurringCost(row);
}
