function pad(value) {
  return String(value).padStart(2, '0');
}

export function parseYearMonth(value) {
  const match = /^(\d{4})-(\d{2})$/.exec(value);

  if (!match) {
    throw new Error('Mês inválido. Use o formato YYYY-MM.');
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;

  return new Date(year, monthIndex, 1);
}

export function shiftMonth(date, offset) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

export function formatDateIso(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function isBusinessDay(date, holidays = []) {
  const day = date.getDay();
  const iso = formatDateIso(date);

  if (day === 0 || day === 6) {
    return false;
  }

  return !holidays.includes(iso);
}

export function adjustDateToBusinessDay(date, policy, holidays = []) {
  if (policy === 'none') {
    return new Date(date);
  }

  const adjusted = new Date(date);
  const step = policy === 'previous' ? -1 : 1;

  while (!isBusinessDay(adjusted, holidays)) {
    adjusted.setDate(adjusted.getDate() + step);
  }

  return adjusted;
}
