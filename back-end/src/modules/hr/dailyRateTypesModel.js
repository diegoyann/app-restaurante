const money = (value) => Math.round(Math.max(Number(value) || 0, 0) * 100) / 100;

export function isWeekendDate(date) {
  const weekday = new Date(`${date}T12:00:00`).getDay();
  return weekday === 0 || weekday === 6;
}

export function suggestedDailyRateTypeIds(rateTypes = [], date) {
  const weekend = isWeekendDate(date);
  const applicable = rateTypes.filter((type) => type.active !== false && (
    weekend ? type.appliesWeekends !== false : type.appliesWeekdays !== false
  ));
  return applicable.length === 1 ? [applicable[0].id] : [];
}

export function resolveDailyRateSelection(rateTypes = [], selectedIds = [], existingSnapshots = []) {
  const ids = [...new Set(selectedIds.map(String).filter(Boolean))];
  const byId = new Map(rateTypes.filter((type) => type.active !== false).map((type) => [String(type.id), type]));
  const existingByType = new Map(existingSnapshots.filter((item) => item.daily_rate_type_id).map((item) => [String(item.daily_rate_type_id), item]));
  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length) throw new Error('Um dos Tipos de Diária selecionados não pertence ao funcionário ou está inativo.');

  const snapshots = ids.map((id) => {
    const type = byId.get(id);
    const previous = existingByType.get(id);
    return {
      dailyRateTypeId: type.id,
      typeName: previous?.type_name || previous?.typeName || type.name,
      amountSnapshot: money(previous?.amount_snapshot ?? previous?.amountSnapshot ?? type.amount)
    };
  });
  return {
    dailyRate: money(snapshots.reduce((total, item) => total + item.amountSnapshot, 0)),
    snapshots
  };
}
