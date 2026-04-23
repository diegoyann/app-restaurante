import {
  formatDateIso,
  getNextBusinessDayFromFixedDate,
  getNthBusinessDay,
  getNextWeekdayDateFromReference
} from '../utils/dateUtils.js';

function roundCurrency(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function assertIntegerRange(value, field, min, max) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${field} precisa estar entre ${min} e ${max}.`);
  }
}

export function sanitizePayrollSettings(settings) {
  const normalized = {
    salaryPercentage: Number(settings.salaryPercentage),
    salaryBusinessDayOrdinal: Number(settings.salaryBusinessDayOrdinal),
    advancePercentage: Number(settings.advancePercentage),
    advanceFixedDay: Number(settings.advanceFixedDay),
    advanceBusinessDayPolicy: settings.advanceBusinessDayPolicy || 'next',
    holidayDates: Array.isArray(settings.holidayDates) ? settings.holidayDates : []
  };

  if (Number.isNaN(normalized.salaryPercentage) || normalized.salaryPercentage <= 0 || normalized.salaryPercentage >= 100) {
    throw new Error('salaryPercentage precisa ser maior que 0 e menor que 100.');
  }

  if (Number.isNaN(normalized.advancePercentage) || normalized.advancePercentage <= 0 || normalized.advancePercentage >= 100) {
    throw new Error('advancePercentage precisa ser maior que 0 e menor que 100.');
  }

  assertIntegerRange(normalized.salaryBusinessDayOrdinal, 'salaryBusinessDayOrdinal', 1, 10);
  assertIntegerRange(normalized.advanceFixedDay, 'advanceFixedDay', 1, 31);

  if (!['next', 'previous', 'none'].includes(normalized.advanceBusinessDayPolicy)) {
    throw new Error('advanceBusinessDayPolicy precisa ser "next", "previous" ou "none".');
  }

  return normalized;
}

export function normalizeEmployeeForStorage(employee) {
  const isFixed = employee.employmentType === 'fixed';

  return {
    ...employee,
    name: String(employee.name || '').trim(),
    role: String(employee.role || '').trim(),
    status: employee.status || 'active',
    employmentType: employee.employmentType || 'fixed',
    salary: isFixed ? roundCurrency(employee.salary) : 0,
    baseAmount: !isFixed ? roundCurrency(employee.baseAmount) : 0,
    discounts: isFixed
      ? (Array.isArray(employee.discounts) ? employee.discounts : []).map((discount) => ({
          ...discount,
          amount: Math.max(roundCurrency(discount.amount), 0)
        }))
      : [],
    paymentMode: !isFixed ? employee.paymentMode || 'weekly' : '',
    weekday: !isFixed ? String(employee.weekday || '') : '',
    specificDate: !isFixed ? employee.specificDate || '' : '',
    startDate: !isFixed ? employee.startDate || '' : ''
  };
}

export function validateEmployeePayload(employee) {
  const normalized = normalizeEmployeeForStorage(employee);

  if (!normalized.name) {
    throw new Error('Funcionário precisa ter nome.');
  }

  if (!normalized.role) {
    throw new Error('Funcionário precisa ter cargo.');
  }

  if (normalized.employmentType === 'fixed' && normalized.salary <= 0) {
    throw new Error('Funcionário fixo precisa ter salário maior que zero.');
  }

  if (normalized.employmentType === 'external' && normalized.baseAmount <= 0) {
    throw new Error('Funcionário por fora precisa ter valor base maior que zero.');
  }

  return normalized;
}

export function buildPayrollSummary({
  settings,
  employees,
  referenceDate = new Date()
}) {
  const safeSettings = sanitizePayrollSettings(settings);
  const year = referenceDate.getFullYear();
  const monthIndex = referenceDate.getMonth();
  const holidayDates = safeSettings.holidayDates || [];

  const salaryPaymentDate = getNthBusinessDay(
    year,
    monthIndex,
    safeSettings.salaryBusinessDayOrdinal,
    holidayDates
  );

  const advancePaymentDate = getNextBusinessDayFromFixedDate(
    year,
    monthIndex,
    safeSettings.advanceFixedDay,
    holidayDates,
    safeSettings.advanceBusinessDayPolicy
  );

  const employeesBreakdown = employees
    .filter((employee) => employee.employmentType === 'fixed' && employee.status !== 'inactive')
    .map((employee) => {
      const normalizedEmployee = normalizeEmployeeForStorage(employee);
      const grossSalary = roundCurrency(normalizedEmployee.salary);
      const extraDiscount = roundCurrency(
        normalizedEmployee.discounts.reduce((acc, discount) => acc + Number(discount.amount || 0), 0)
      );
      const advanceAmount = roundCurrency(grossSalary * (safeSettings.advancePercentage / 100));
      const grossSalaryPayment = roundCurrency(grossSalary * (safeSettings.salaryPercentage / 100));
      const netSalary = Math.max(roundCurrency(grossSalary - extraDiscount), 0);
      const finalSalaryPayment = Math.max(roundCurrency(netSalary - advanceAmount), 0);

      return {
        ...normalizedEmployee,
        grossSalary,
        extraDiscount,
        advanceAmount,
        grossSalaryPayment,
        netSalary,
        finalSalaryPayment
      };
    });

  const totals = employeesBreakdown.reduce(
    (acc, employee) => {
      acc.grossPayroll += employee.grossSalary;
      acc.advanceTotal += employee.advanceAmount;
      acc.salaryPaymentTotal += employee.finalSalaryPayment;
      acc.extraDiscountTotal += employee.extraDiscount;
      acc.netPayroll += employee.netSalary;
      return acc;
    },
    {
      grossPayroll: 0,
      advanceTotal: 0,
      salaryPaymentTotal: 0,
      extraDiscountTotal: 0,
      netPayroll: 0
    }
  );

  return {
    salaryPaymentDate,
    advancePaymentDate,
    employeesBreakdown,
    totals: {
      grossPayroll: roundCurrency(totals.grossPayroll),
      advanceTotal: roundCurrency(totals.advanceTotal),
      salaryPaymentTotal: roundCurrency(totals.salaryPaymentTotal),
      extraDiscountTotal: roundCurrency(totals.extraDiscountTotal),
      netPayroll: roundCurrency(totals.netPayroll)
    }
  };
}

export function buildPayrollPreview({ referenceMonth, settings, employees }) {
  const [year, month] = String(referenceMonth).split('-').map(Number);

  if (!year || !month) {
    throw new Error('Mês inválido. Use o formato YYYY-MM.');
  }

  const referenceDate = new Date(year, month - 1, 1);
  const summary = buildPayrollSummary({
    settings,
    employees,
    referenceDate
  });

  const externalWorkers = employees
    .filter((employee) => employee.employmentType === 'external' && employee.status !== 'inactive')
    .map((employee) => {
      const normalized = normalizeEmployeeForStorage(employee);
      const nextPaymentDate = normalized.paymentMode === 'weekly'
        ? getNextWeekdayDateFromReference(normalized.weekday, referenceDate)
        : normalized.specificDate || null;

      return {
        id: normalized.id,
        employeeName: normalized.name,
        role: normalized.role,
        amount: normalized.baseAmount,
        paymentMode: normalized.paymentMode,
        effectiveDate: nextPaymentDate instanceof Date ? formatDateIso(nextPaymentDate) : nextPaymentDate
      };
    });

  return {
    referenceMonth,
    settings: sanitizePayrollSettings(settings),
    dates: {
      salaryPaymentDate: summary.salaryPaymentDate ? formatDateIso(summary.salaryPaymentDate) : null,
      advancePaymentDate: summary.advancePaymentDate ? formatDateIso(summary.advancePaymentDate) : null
    },
    fixed: summary,
    external: externalWorkers
  };
}
