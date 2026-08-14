export function mapEmployee(row, dailyRateTypes = [], scheduledDaysOff = []) {
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
    startDate: row.start_date || '',
    controlAttendance: Boolean(row.control_attendance),
    attendanceControlFrom: row.attendance_control_from || '',
    weeklyDayOff: row.weekly_day_off == null ? '' : Number(row.weekly_day_off),
    monthlySundayOffOrdinal: row.monthly_sunday_off_ordinal == null ? '' : Number(row.monthly_sunday_off_ordinal),
    firstPaymentPercentage: row.first_payment_percentage == null ? null : Number(row.first_payment_percentage),
    finalPaymentPercentage: row.final_payment_percentage == null ? null : Number(row.final_payment_percentage),
    dailyRateTypes,
    scheduledDaysOff
  };
}

export function mapCustomer(row) {
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
    status: row.status
  };
}

export function mapPaymentMethod(row) {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    requiresChange: Boolean(row.requires_change),
    status: row.status
  };
}

export function mapDeliveryDriver(row) {
  return {
    id: row.id,
    name: row.full_name,
    phone: row.phone,
    vehicle: row.vehicle,
    dailyRate: Number(row.daily_rate || 0),
    perDeliveryRate: Number(row.per_delivery_rate || 0),
    status: row.status,
    notes: row.notes
  };
}

export function mapOrderItem(row) {
  return {
    id: row.id,
    menuItemId: row.menu_item_id || '',
    productId: row.product_id || '',
    name: row.item_name,
    category: row.item_category || '',
    section: row.item_section || 'food',
    quantity: Number(row.quantity || 0),
    unitPrice: Number(row.unit_price || 0),
    totalPrice: Number(row.total_price || 0),
    notes: row.notes,
    sortOrder: row.sort_order
  };
}

export function mapOrder(row) {
  return {
    id: row.id,
    customerId: row.customer_id || '',
    paymentMethodId: row.payment_method_id || '',
    orderNumber: row.order_number,
    channel: row.channel,
    externalSource: row.external_source || '',
    externalId: row.external_id || '',
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
    deliveryDriverId: row.delivery_driver_id || '',
    deliveryStatus: row.delivery_status || 'waiting',
    dispatchedAt: row.dispatched_at || '',
    deliveredAt: row.delivered_at || '',
    deliveryCost: Number(row.delivery_cost || 0),
    driverDailyAmount: Number(row.driver_daily_amount || 0),
    driverDeliveryAmount: Number(row.driver_delivery_amount || 0),
    cashChangeRequired: Number(row.cash_change_required || 0),
    cardMachineCode: row.card_machine_code || '',
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    customer: row.customers ? mapCustomer(row.customers) : null,
    paymentMethod: row.payment_methods ? mapPaymentMethod(row.payment_methods) : null,
    deliveryDriver: row.delivery_drivers ? mapDeliveryDriver(row.delivery_drivers) : null,
    items: (row.order_items || [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(mapOrderItem)
  };
}

export function mapTransaction(row) {
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
    sourceType: row.source_type || 'manual',
    sourceId: row.source_id || '',
    economicCategory: row.economic_category || '',
    financialOrigin: row.financial_origin || '',
    obligationId: row.obligation_id || '',
    paymentId: row.payment_id || '',
    batchId: row.batch_id || ''
  };
}

export function mapRecurringCost(row) {
  return {
    id: row.id,
    desc: row.description,
    amount: Number(row.amount || 0),
    dueDay: row.due_day,
    lastPaidMonth: row.last_paid_month || '',
    normalizedKey: row.normalized_key || '',
    category: row.category || 'CUSTO_FIXO',
    forecastType: row.forecast_type || 'FIXED',
    recurrence: row.recurrence || 'MONTHLY',
    weekday: row.weekday == null ? null : Number(row.weekday),
    effectiveFrom: row.effective_from || '',
    active: row.active !== false,
    aliases: row.aliases || [],
    sourceType: row.source_type || 'MANUAL',
    originalImportLabel: row.original_import_label || '',
    mergedIntoId: row.merged_into_id || '',
    requiresDuplicateReview: Boolean(row.requires_duplicate_review)
  };
}

export function mapFinancialClosing(row) {
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
    updatedAt: row.updated_at
  };
}

export function mapSimpleName(row) {
  return { id: row.id, name: row.name };
}

export function mapSalesChannel(row) {
  return {
    id: row.id,
    name: row.name,
    active: row.active !== false,
    feePercent: Number(row.fee_percent || 0),
    settlementType: row.settlement_type || 'IMMEDIATE',
    settlementFrequency: row.settlement_frequency || 'NONE',
    settlementWeekday: row.settlement_weekday == null ? null : Number(row.settlement_weekday),
    settlementDelayDays: Number(row.settlement_delay_days || 0),
    notes: row.notes || ''
  };
}

function normalizeLinkedCategoryNames(option = {}) {
  const categoryNames = Array.isArray(option.linkedCategoryNames || option.linked_category_names)
    ? option.linkedCategoryNames || option.linked_category_names
    : [];
  const fallback = option.linkedCategoryName || option.linked_category_name;

  return [...categoryNames, fallback].reduce((acc, categoryName) => {
    const normalized = String(categoryName || '').trim();
    if (normalized && !acc.includes(normalized)) acc.push(normalized);
    return acc;
  }, []);
}

export function mapMenuCategory(row) {
  return { id: row.id, name: row.name, sortOrder: Number(row.sort_order || 0) };
}

export function mapMenuItem(row) {
  return {
    id: row.id,
    category: row.menu_categories?.name || '',
    description: row.description,
    status: row.status,
    sortOrder: Number(row.sort_order || 0),
    salePrice: Number(row.sale_price || 0),
    basePrice: Number(row.base_price || 0),
    photoPreview: row.photo_preview || '',
    linkedComponents: Array.isArray(row.linked_component_ids) ? row.linked_component_ids : [],
    itemType: row.item_type === 'combo' ? 'combo' : 'regular',
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
          photoPreview: option.photo_preview || '',
          extraPrice: String(Number(option.extra_price || 0)),
          maxQty: String(option.max_qty || 1),
          isAvailable: option.is_available,
          linkedCategoryName: normalizeLinkedCategoryNames(option)[0] || '',
          linkedCategoryNames: normalizeLinkedCategoryNames(option),
          linkedComponentRef: option.linked_component_ref || '',
          linkedComponentRefs: option.linked_component_ref ? [option.linked_component_ref] : []
        }))
    }))
  };
}

export function mapReview(row) {
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

export function mapPreparation(row) {
  return {
    id: row.id,
    name: row.name,
    yieldQuantity: Number(row.yield_quantity || 0),
    yieldUnit: row.yield_unit,
    recipe: Array.isArray(row.recipe) ? row.recipe : []
  };
}

export function mapProduct(row) {
  return {
    id: row.id,
    name: row.name,
    salePrice: Number(row.sale_price || 0),
    yieldQuantity: Number(row.yield_quantity || 0),
    targetCmvPercent: Number(row.target_cmv_percent || 0),
    recipe: Array.isArray(row.recipe) ? row.recipe : []
  };
}

export function mapIngredient(row) {
  const packageQuantity = Number(row.package_quantity || 0);
  const packageCost = Number(row.package_cost || 0);
  const referenceFactor = row.unit === 'g' || row.unit === 'ml' ? 1000 : 1;
  const fallbackUnitCost = packageQuantity > 1
    ? packageCost / packageQuantity
    : packageCost / referenceFactor;

  return {
    id: row.id,
    name: row.name,
    unit: row.unit,
    packageQuantity,
    packageCost,
    unitCost: Number(row.unit_cost || fallbackUnitCost),
    category: row.category || 'GERAL',
    primarySupplierId: row.primary_supplier_id || '',
    stockMinimum: row.stock_minimum == null ? null : Number(row.stock_minimum),
    active: row.active !== false
  };
}
