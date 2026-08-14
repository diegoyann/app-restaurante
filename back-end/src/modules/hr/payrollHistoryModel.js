export function latestEffectiveVersion(rows = [], month, predicate = () => true) {
  return rows
    .filter(predicate)
    .filter((row) => String(row.effective_month || '') <= String(month || ''))
    .sort((left, right) => String(right.effective_month).localeCompare(String(left.effective_month)))[0] || null;
}

export function resolveHistoricalOrCurrent({ history = [], month, currentMonth, current = null, predicate }) {
  return latestEffectiveVersion(history, month, predicate) || (month >= currentMonth ? current : null);
}
