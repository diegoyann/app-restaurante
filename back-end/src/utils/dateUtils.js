function pad(value) {
  return String(value).padStart(2, '0');
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

export function adjustDateToBusinessDay(date, policy = 'next', holidays = []) {
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

export function getNthBusinessDay(year, monthIndex, nth, holidays = []) {
  let current = new Date(year, monthIndex, 1);
  let count = 0;

  while (current.getMonth() === monthIndex) {
    if (isBusinessDay(current, holidays)) {
      count += 1;
      if (count === nth) {
        return new Date(current);
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return null;
}

export function getNextBusinessDayFromFixedDate(
  year,
  monthIndex,
  day,
  holidays = [],
  policy = 'next'
) {
  const current = new Date(year, monthIndex, day);
  return adjustDateToBusinessDay(current, policy, holidays);
}

export function getNextWeekdayDateFromReference(weekdayNumber, referenceDate = new Date()) {
  const target = Number(weekdayNumber);

  if (Number.isNaN(target) || target < 0 || target > 6) {
    return null;
  }

  const current = new Date(referenceDate);
  const currentWeekday = current.getDay();
  let diff = target - currentWeekday;

  if (diff < 0) diff += 7;
  if (diff === 0) diff = 7;

  current.setDate(current.getDate() + diff);
  return current;
}
