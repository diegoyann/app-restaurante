import {
  adjustDateToBusinessDay,
  formatDateIso,
  parseYearMonth,
  shiftMonth
} from '../utils/dateUtils.js';

const VALID_POLICIES = new Set(['none', 'previous', 'next']);

function roundCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function assertRange(value, field, min, max) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${field} precisa estar entre ${min} e ${max}.`);
  }
}

function assertPolicy(value, field) {
  if (!VALID_POLICIES.has(value)) {
    throw new Error(`${field} precisa ser "none", "previous" ou "next".`);
  }
}

export function sanitizePayrollSettings(settings) {
  const normalized = {
    advancePercentage: Number(settings.advancePercentage),
    advanceDay: Number(settings.advanceDay),
    advanceBusinessDayPolicy: settings.advanceBusinessDayPolicy || 'previous',
    finalPaymentDay: Number(settings.finalPaymentDay),
    finalPaymentMonthOffset: Number(settings.finalPaymentMonthOffset),
    finalPaymentBusinessDayPolicy:
      settings.finalPaymentBusinessDayPolicy || 'previous',
    holidays: Array.isArray(settings.holidays) ? settings.holidays : []
  };

  if (Number.isNaN(normalized.advancePercentage) || normalized.advancePercentage <= 0 || normalized.advancePercentage >= 100) {
    throw new Error('advancePercentage precisa ser maior que 0 e menor que 100.');
  }

  assertRange(normalized.advanceDay, 'advanceDay', 1, 31);
  assertRange(normalized.finalPaymentDay, 'finalPaymentDay', 1, 31);

  if (!Number.isInteger(normalized.finalPaymentMonthOffset) || normalized.finalPaymentMonthOffset < 0 || normalized.finalPaymentMonthOffset > 2) {
    throw new Error('finalPaymentMonthOffset precisa ser 0, 1 ou 2.');
  }

  assertPolicy(normalized.advanceBusinessDayPolicy, 'advanceBusinessDayPolicy');
  assertPolicy(normalized.finalPaymentBusinessDayPolicy, 'finalPaymentBusinessDayPolicy');

  return normalized;
}

function buildInstallment({
  employee,
  label,
  grossAmount,
  dueDate,
  adjustedDate
}) {
  return {
    employeeId: employee.id,
    employeeName: employee.name,
    role: employee.role,
    type: label,
    amount: grossAmount,
    scheduledDate: formatDateIso(dueDate),
    effectiveDate: formatDateIso(adjustedDate)
  };
}

export function buildPayrollPreview({ referenceMonth, settings, employees }) {
  const safeSettings = sanitizePayrollSettings(settings);
  const baseDate = parseYearMonth(referenceMonth);

  const advanceBaseDate = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    safeSettings.advanceDay
  );

  const finalBaseMonth = shiftMonth(baseDate, safeSettings.finalPaymentMonthOffset);
  const finalBaseDate = new Date(
    finalBaseMonth.getFullYear(),
    finalBaseMonth.getMonth(),
    safeSettings.finalPaymentDay
  );

  const advanceEffectiveDate = adjustDateToBusinessDay(
    advanceBaseDate,
    safeSettings.advanceBusinessDayPolicy,
    safeSettings.holidays
  );

  const finalEffectiveDate = adjustDateToBusinessDay(
    finalBaseDate,
    safeSettings.finalPaymentBusinessDayPolicy,
    safeSettings.holidays
  );

  const installments = employees.flatMap((employee) => {
    const advanceAmount = roundCurrency(employee.salary * (safeSettings.advancePercentage / 100));
    const finalAmount = roundCurrency(employee.salary - advanceAmount);

    return [
      buildInstallment({
        employee,
        label: 'vale',
        grossAmount: advanceAmount,
        dueDate: advanceBaseDate,
        adjustedDate: advanceEffectiveDate
      }),
      buildInstallment({
        employee,
        label: 'pagamento_final',
        grossAmount: finalAmount,
        dueDate: finalBaseDate,
        adjustedDate: finalEffectiveDate
      })
    ];
  });

  const totals = installments.reduce(
    (acc, installment) => {
      acc.total += installment.amount;

      if (installment.type === 'vale') {
        acc.advanceTotal += installment.amount;
      }

      if (installment.type === 'pagamento_final') {
        acc.finalPaymentTotal += installment.amount;
      }

      return acc;
    },
    {
      total: 0,
      advanceTotal: 0,
      finalPaymentTotal: 0
    }
  );

  return {
    referenceMonth,
    settings: safeSettings,
    dates: {
      advance: {
        scheduled: formatDateIso(advanceBaseDate),
        effective: formatDateIso(advanceEffectiveDate)
      },
      finalPayment: {
        scheduled: formatDateIso(finalBaseDate),
        effective: formatDateIso(finalEffectiveDate)
      }
    },
    totals: {
      total: roundCurrency(totals.total),
      advanceTotal: roundCurrency(totals.advanceTotal),
      finalPaymentTotal: roundCurrency(totals.finalPaymentTotal)
    },
    installments
  };
}
