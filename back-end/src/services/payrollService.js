import {
  formatDateIso,
  getNextBusinessDayFromFixedDate,
  getNthBusinessDay,
  getNextWeekdayDateFromReference,
} from "../utils/dateUtils.js";

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
    advanceBusinessDayPolicy: settings.advanceBusinessDayPolicy || "next",
    holidayDates: Array.isArray(settings.holidayDates)
      ? settings.holidayDates
      : [],
    mealCostPerWorkday: Number(settings.mealCostPerWorkday ?? 15),
    extraKitchenDailyRate: Number(settings.extraKitchenDailyRate ?? 70),
    extraMotoboyDailyRate: Number(settings.extraMotoboyDailyRate ?? 60),
  };

  if (
    Number.isNaN(normalized.salaryPercentage) ||
    normalized.salaryPercentage <= 0 ||
    normalized.salaryPercentage >= 100
  ) {
    throw new Error(
      "salaryPercentage precisa ser maior que 0 e menor que 100.",
    );
  }

  if (
    Number.isNaN(normalized.advancePercentage) ||
    normalized.advancePercentage <= 0 ||
    normalized.advancePercentage >= 100
  ) {
    throw new Error(
      "advancePercentage precisa ser maior que 0 e menor que 100.",
    );
  }

  if (
    Math.abs(
      normalized.salaryPercentage + normalized.advancePercentage - 100,
    ) > 0.001
  ) {
    throw new Error("Os percentuais padrão da folha devem totalizar 100%.");
  }

  assertIntegerRange(
    normalized.salaryBusinessDayOrdinal,
    "salaryBusinessDayOrdinal",
    1,
    10,
  );
  assertIntegerRange(normalized.advanceFixedDay, "advanceFixedDay", 1, 31);

  if (
    !["next", "previous", "none"].includes(normalized.advanceBusinessDayPolicy)
  ) {
    throw new Error(
      'advanceBusinessDayPolicy precisa ser "next", "previous" ou "none".',
    );
  }

  for (const field of [
    "mealCostPerWorkday",
    "extraKitchenDailyRate",
    "extraMotoboyDailyRate",
  ]) {
    if (!Number.isFinite(normalized[field]) || normalized[field] < 0) {
      throw new Error(`${field} precisa ser um valor maior ou igual a zero.`);
    }
  }

  return normalized;
}

export function normalizeEmployeeForStorage(employee) {
  const isFixed = employee.employmentType === "fixed";
  const normalizedRole = String(employee.role || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  const isManagement = normalizedRole.startsWith("geren");
  const controlAttendance =
    isFixed && !isManagement && employee.controlAttendance === true;
  const firstPaymentPercentage =
    isFixed && employee.firstPaymentPercentage !== "" && employee.firstPaymentPercentage != null
      ? Number.isFinite(Number(employee.firstPaymentPercentage))
        ? roundCurrency(employee.firstPaymentPercentage)
        : Number.NaN
      : null;
  const finalPaymentPercentage =
    isFixed && employee.finalPaymentPercentage !== "" && employee.finalPaymentPercentage != null
      ? Number.isFinite(Number(employee.finalPaymentPercentage))
        ? roundCurrency(employee.finalPaymentPercentage)
        : Number.NaN
      : null;
  const dailyRateTypes =
    !isFixed && Array.isArray(employee.dailyRateTypes)
      ? employee.dailyRateTypes
          .map((type) => ({
            id: type.id || undefined,
            name: String(type.name || "").trim(),
            amount: roundCurrency(type.amount),
            appliesWeekdays: type.appliesWeekdays !== false,
            appliesWeekends: type.appliesWeekends !== false,
            active: type.active !== false,
          }))
          .filter((type) => type.name && type.amount > 0)
      : [];

  return {
    ...employee,
    name: String(employee.name || "").trim(),
    role: String(employee.role || "").trim(),
    status: employee.status || "active",
    employmentType: employee.employmentType || "fixed",
    salary: isFixed ? roundCurrency(employee.salary) : 0,
    baseAmount: !isFixed ? roundCurrency(employee.baseAmount) : 0,
    controlAttendance,
    attendanceControlFrom:
      controlAttendance
        ? employee.attendanceControlFrom || ""
        : "",
    weeklyDayOff:
      controlAttendance && employee.weeklyDayOff !== ""
        ? Number(employee.weeklyDayOff)
        : null,
    monthlySundayOffOrdinal:
      controlAttendance && employee.monthlySundayOffOrdinal !== ""
        ? Number(employee.monthlySundayOffOrdinal)
        : null,
    firstPaymentPercentage,
    finalPaymentPercentage,
    dailyRateTypes,
    discounts: isFixed
      ? (Array.isArray(employee.discounts) ? employee.discounts : []).map(
          (discount) => ({
            ...discount,
            amount: Math.max(roundCurrency(discount.amount), 0),
          }),
        )
      : [],
    paymentMode: !isFixed ? employee.paymentMode || "weekly" : "",
    weekday: !isFixed ? String(employee.weekday || "") : "",
    specificDate: !isFixed ? employee.specificDate || "" : "",
    startDate: !isFixed ? employee.startDate || "" : "",
  };
}

export function validateEmployeePayload(employee) {
  const normalized = normalizeEmployeeForStorage(employee);

  if (!normalized.name) {
    throw new Error("Funcionário precisa ter nome.");
  }

  if (!normalized.role) {
    throw new Error("Funcionário precisa ter cargo.");
  }

  if (normalized.employmentType === "fixed" && normalized.salary <= 0) {
    throw new Error("Funcionário fixo precisa ter salário maior que zero.");
  }

  if (
    normalized.controlAttendance &&
    !/^\d{4}-\d{2}-\d{2}$/.test(normalized.attendanceControlFrom)
  ) {
    throw new Error("Informe a data inicial do controle de faltas.");
  }

  if (
    normalized.controlAttendance &&
    (!Number.isInteger(normalized.weeklyDayOff) ||
      normalized.weeklyDayOff < 0 ||
      normalized.weeklyDayOff > 6)
  ) {
    throw new Error("Informe o dia da folga semanal.");
  }

  if (
    normalized.controlAttendance &&
    (!Number.isInteger(normalized.monthlySundayOffOrdinal) ||
      normalized.monthlySundayOffOrdinal < 1 ||
      normalized.monthlySundayOffOrdinal > 5)
  ) {
    throw new Error("Informe qual domingo do mês será a folga.");
  }

  const hasIndividualSplit =
    normalized.firstPaymentPercentage != null ||
    normalized.finalPaymentPercentage != null;
  if (
    normalized.employmentType === "fixed" &&
    hasIndividualSplit &&
    (!Number.isFinite(normalized.firstPaymentPercentage) ||
      !Number.isFinite(normalized.finalPaymentPercentage) ||
      normalized.finalPaymentPercentage == null ||
      normalized.firstPaymentPercentage < 0 ||
      normalized.finalPaymentPercentage < 0 ||
      Math.abs(
        normalized.firstPaymentPercentage +
          normalized.finalPaymentPercentage -
          100,
      ) > 0.001)
  ) {
    throw new Error("A regra individual de pagamento deve totalizar 100%.");
  }

  if (
    normalized.employmentType === "external" &&
    normalized.dailyRateTypes.length === 0
  ) {
    throw new Error(
      "Funcionário por fora precisa ter ao menos um Tipo de Diária com valor maior que zero.",
    );
  }

  return normalized;
}

export function buildPayrollSummary({
  settings,
  employees,
  referenceDate = new Date(),
}) {
  const safeSettings = sanitizePayrollSettings(settings);
  const year = referenceDate.getFullYear();
  const monthIndex = referenceDate.getMonth();
  const salaryReferenceDate = new Date(year, monthIndex + 1, 1);
  const holidayDates = safeSettings.holidayDates || [];

  const salaryPaymentDate = getNthBusinessDay(
    salaryReferenceDate.getFullYear(),
    salaryReferenceDate.getMonth(),
    safeSettings.salaryBusinessDayOrdinal,
    holidayDates,
  );

  const advancePaymentDate = getNextBusinessDayFromFixedDate(
    year,
    monthIndex,
    safeSettings.advanceFixedDay,
    holidayDates,
    safeSettings.advanceBusinessDayPolicy,
  );

  const employeesBreakdown = employees
    .filter(
      (employee) =>
        employee.employmentType === "fixed" && employee.status !== "inactive",
    )
    .map((employee) => {
      const normalizedEmployee = normalizeEmployeeForStorage(employee);
      const grossSalary = roundCurrency(normalizedEmployee.salary);
      const extraDiscount = roundCurrency(
        normalizedEmployee.discounts.reduce(
          (acc, discount) => acc + Number(discount.amount || 0),
          0,
        ),
      );
      const advanceAmount = roundCurrency(
        grossSalary * (safeSettings.advancePercentage / 100),
      );
      const grossSalaryPayment = roundCurrency(
        grossSalary * (safeSettings.salaryPercentage / 100),
      );
      const netSalary = Math.max(roundCurrency(grossSalary - extraDiscount), 0);
      const finalSalaryPayment = Math.max(
        roundCurrency(netSalary - advanceAmount),
        0,
      );

      return {
        ...normalizedEmployee,
        grossSalary,
        extraDiscount,
        advanceAmount,
        grossSalaryPayment,
        netSalary,
        finalSalaryPayment,
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
      netPayroll: 0,
    },
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
      netPayroll: roundCurrency(totals.netPayroll),
    },
  };
}

export function buildPayrollPreview({ referenceMonth, settings, employees }) {
  const [year, month] = String(referenceMonth).split("-").map(Number);

  if (!year || !month) {
    throw new Error("Mês inválido. Use o formato YYYY-MM.");
  }

  const referenceDate = new Date(year, month - 1, 1);
  const summary = buildPayrollSummary({
    settings,
    employees,
    referenceDate,
  });

  const externalWorkers = employees
    .filter(
      (employee) =>
        employee.employmentType === "external" &&
        employee.status !== "inactive",
    )
    .map((employee) => {
      const normalized = normalizeEmployeeForStorage(employee);
      const nextPaymentDate =
        normalized.paymentMode === "weekly"
          ? getNextWeekdayDateFromReference(normalized.weekday, referenceDate)
          : normalized.specificDate || null;

      return {
        id: normalized.id,
        employeeName: normalized.name,
        role: normalized.role,
        amount: normalized.baseAmount,
        paymentMode: normalized.paymentMode,
        effectiveDate:
          nextPaymentDate instanceof Date
            ? formatDateIso(nextPaymentDate)
            : nextPaymentDate,
      };
    });

  return {
    referenceMonth,
    settings: sanitizePayrollSettings(settings),
    dates: {
      salaryPaymentDate: summary.salaryPaymentDate
        ? formatDateIso(summary.salaryPaymentDate)
        : null,
      advancePaymentDate: summary.advancePaymentDate
        ? formatDateIso(summary.advancePaymentDate)
        : null,
    },
    fixed: summary,
    external: externalWorkers,
  };
}
