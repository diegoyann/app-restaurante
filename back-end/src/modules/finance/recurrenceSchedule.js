const money = (value) => Math.round(Math.max(Number(value) || 0, 0) * 100) / 100;

function iso(date) {
  return date.toISOString().slice(0, 10);
}

export function datesForRecurringCost(cost, month) {
  const [year, monthNumber] = String(month).split('-').map(Number);
  if (!year || !monthNumber) return [];
  const effectiveFrom = String(cost.effective_from || cost.effectiveFrom || `${month}-01`);
  if (effectiveFrom.slice(0, 7) > month) return [];
  if (cost.recurrence === 'SPECIAL') return effectiveFrom.slice(0, 7) === month ? [effectiveFrom] : [];
  if (cost.recurrence !== 'WEEKLY') {
    const lastDay = new Date(year, monthNumber, 0, 12).getDate();
    const day = Math.min(Math.max(Number(cost.due_day ?? cost.dueDay) || 1, 1), lastDay);
    const date = `${month}-${String(day).padStart(2, '0')}`;
    return date < effectiveFrom ? [] : [date];
  }
  const weekday = Number(cost.weekday);
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) return [];
  const dates = [];
  for (let day = 1; day <= 31; day += 1) {
    const date = new Date(year, monthNumber - 1, day, 12);
    if (date.getMonth() !== monthNumber - 1) break;
    const value = iso(date);
    if (date.getDay() === weekday && value >= effectiveFrom) dates.push(value);
  }
  return dates;
}

export function recurringObligationRows(cost, month) {
  return datesForRecurringCost(cost, month).map((dueDate) => ({
    dueDate,
    amount: money(cost.amount),
    sourceId: cost.recurrence === 'WEEKLY' ? `${cost.id}:${dueDate}` : String(cost.id)
  }));
}
