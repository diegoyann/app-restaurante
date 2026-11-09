export function obligationKey(row) {
  return `${row.source_type}:${row.source_id}:${row.competence_month}`;
}

function hasOwn(row, key) {
  return Object.prototype.hasOwnProperty.call(row, key);
}

function canonicalObligationRow(candidate, existing) {
  return {
    tenant_id: candidate.tenant_id,
    recurring_cost_id: candidate.recurring_cost_id ?? existing?.recurring_cost_id ?? null,
    employee_id: candidate.employee_id ?? existing?.employee_id ?? null,
    extra_weekly_closing_id: candidate.extra_weekly_closing_id ?? existing?.extra_weekly_closing_id ?? null,
    purchase_receipt_id: candidate.purchase_receipt_id ?? existing?.purchase_receipt_id ?? null,
    purchase_order_id: candidate.purchase_order_id ?? existing?.purchase_order_id ?? null,
    description: candidate.description,
    economic_category: candidate.economic_category,
    source_type: candidate.source_type,
    source_id: candidate.source_id,
    original_import_label: candidate.original_import_label ?? existing?.original_import_label ?? '',
    competence_month: candidate.competence_month,
    forecast_type: candidate.forecast_type ?? existing?.forecast_type ?? 'FIXED',
    forecast_amount: candidate.forecast_amount ?? existing?.forecast_amount ?? 0,
    final_amount: hasOwn(candidate, 'final_amount')
      ? candidate.final_amount
      : existing?.final_amount ?? null,
    due_date: candidate.due_date,
    status: existing?.status ?? candidate.status ?? 'EXPECTED',
    paid_amount: existing?.paid_amount ?? candidate.paid_amount ?? 0,
    note: candidate.note ?? existing?.note ?? '',
    suggested_payment_method: candidate.suggested_payment_method ?? existing?.suggested_payment_method ?? null,
    suggested_financial_origin: candidate.suggested_financial_origin ?? existing?.suggested_financial_origin ?? null
  };
}

export function planObligationBatch({ candidates, existing, closedMonths }) {
  const existingByKey = new Map(existing.map((row) => [obligationKey(row), row]));
  const rowsByKey = new Map();

  for (const candidate of candidates) {
    const current = existingByKey.get(obligationKey(candidate));
    if (closedMonths.has(candidate.competence_month)) continue;
    if (candidate.preserveExisting && current) continue;

    rowsByKey.set(
      obligationKey(candidate),
      canonicalObligationRow(candidate, current)
    );
  }

  return [...rowsByKey.values()];
}
