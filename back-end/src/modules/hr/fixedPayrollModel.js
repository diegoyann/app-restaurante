const money = (value) => Math.round(Math.max(Number(value) || 0, 0) * 100) / 100;

export const PAYROLL_ADJUSTMENT_CATEGORIES = Object.freeze({
  EXTRA_ADVANCE: 'Adiantamento extra',
  STORE_PURCHASE: 'Compra na loja',
  ALLOWANCE: 'Vale',
  OTHER: 'Outro'
});

export function daysInCompetenceMonth(month) {
  const [year, monthNumber] = String(month || '').split('-').map(Number);
  if (!year || !monthNumber) throw new Error('Competência inválida.');
  return new Date(year, monthNumber, 0).getDate();
}

function monthDates(month) {
  return Array.from({ length: daysInCompetenceMonth(month) }, (_, index) => `${month}-${String(index + 1).padStart(2, '0')}`);
}

function weekdayOf(date) {
  return new Date(`${date}T12:00:00`).getDay();
}

function nthSundayOfMonth(month, ordinal) {
  const target = Number(ordinal);
  if (!Number.isInteger(target) || target < 1 || target > 5) return "";
  const sundays = monthDates(month).filter((date) => weekdayOf(date) === 0);
  return sundays[target - 1] || "";
}

function absenceCutoff(month, referenceDate) {
  const today = String(referenceDate || new Date().toISOString().slice(0, 10)).slice(0, 10);
  const currentMonth = today.slice(0, 7);
  if (month < currentMonth) return `${month}-${String(daysInCompetenceMonth(month)).padStart(2, '0')}`;
  if (month > currentMonth) return '';
  const previous = new Date(`${today}T12:00:00`);
  previous.setDate(previous.getDate() - 1);
  const previousDate = previous.toISOString().slice(0, 10);
  return previousDate.slice(0, 7) === month ? previousDate : '';
}

export function calculateFixedPayrollStatement({
  month,
  employee,
  payrollConfig = {},
  workLogs = [],
  scheduledDaysOff = [],
  adjustments = [],
  referenceDate
}) {
  const salary = money(employee.salary);
  const advancePercentage = Number(
    employee.firstPaymentPercentage ??
      employee.first_payment_percentage ??
      payrollConfig.advancePercentage ??
      payrollConfig.advance_percentage ??
      40,
  );
  const salaryPercentage = Number(
    employee.finalPaymentPercentage ??
      employee.final_payment_percentage ??
      payrollConfig.salaryPercentage ??
      payrollConfig.salary_percentage ??
      60,
  );
  const advanceAmount = money(salary * advancePercentage / 100);
  const baseSalaryPayment = money(salary * salaryPercentage / 100);
  const daysInMonth = daysInCompetenceMonth(month);
  const absenceUnitAmount = money(salary / daysInMonth);
  const activeDaysOff = scheduledDaysOff.filter((item) => item.active !== false && item.status !== 'CANCELLED');
  const recurringWeekdays = new Set(activeDaysOff.filter((item) => item.kind === 'WEEKLY').map((item) => Number(item.weekday)));
  const specificDates = new Set(activeDaysOff.filter((item) => item.kind === 'DATE').map((item) => item.offDate ?? item.off_date));
  const weeklyDayOff = employee.weeklyDayOff ?? employee.weekly_day_off;
  if (weeklyDayOff !== '' && weeklyDayOff != null) recurringWeekdays.add(Number(weeklyDayOff));
  const monthlySunday = nthSundayOfMonth(
    month,
    employee.monthlySundayOffOrdinal ?? employee.monthly_sunday_off_ordinal,
  );
  if (monthlySunday) specificDates.add(monthlySunday);
  const presentDates = new Set(workLogs.filter((log) => log.worked !== false && String(log.workDate ?? log.work_date).slice(0, 7) === month).map((log) => log.workDate ?? log.work_date));
  const controlFrom = employee.attendanceControlFrom ?? employee.attendance_control_from ?? '';
  const admissionDate = employee.admissionDate ?? employee.admission_date ?? '';
  const effectiveStart = [
    `${month}-01`,
    controlFrom || `${month}-01`,
    admissionDate || `${month}-01`
  ].sort().at(-1);
  const cutoff = absenceCutoff(month, referenceDate);
  const role = String(employee.role || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const controlAttendance =
    !role.startsWith('geren') &&
    (employee.controlAttendance === true || employee.control_attendance === true);
  const absences = controlAttendance && cutoff
    ? monthDates(month)
        .filter((date) => date >= effectiveStart && date <= cutoff)
        .filter((date) => !recurringWeekdays.has(weekdayOf(date)) && !specificDates.has(date))
        .filter((date) => !presentDates.has(date))
        .map((date) => ({ date, amount: absenceUnitAmount }))
    : [];
  const absenceAmount = money(absences.reduce((total, item) => total + item.amount, 0));
  const activeAdjustments = adjustments
    .filter((item) => String(item.competenceMonth ?? item.competence_month) === month && (item.status || 'ACTIVE') === 'ACTIVE')
    .map((item) => ({
      ...item,
      categoryLabel: PAYROLL_ADJUSTMENT_CATEGORIES[item.category] || item.category || 'Outro',
      amount: money(item.amount)
    }));
  const otherDiscountAmount = money(activeAdjustments.reduce((total, item) => total + item.amount, 0));
  const totalDiscounts = money(absenceAmount + otherDiscountAmount);
  const finalSalaryPayment = money(Math.max(baseSalaryPayment - totalDiscounts, 0));

  return {
    employeeId: employee.id,
    employeeName: employee.name ?? employee.full_name,
    month,
    salary,
    advancePercentage,
    salaryPercentage,
    advanceFixedDay: Number(payrollConfig.advanceFixedDay ?? payrollConfig.advance_fixed_day ?? 20),
    salaryBusinessDayOrdinal: Number(payrollConfig.salaryBusinessDayOrdinal ?? payrollConfig.salary_business_day_ordinal ?? 5),
    holidayDates: Array.isArray(payrollConfig.holidayDates ?? payrollConfig.holiday_dates)
      ? (payrollConfig.holidayDates ?? payrollConfig.holiday_dates)
      : [],
    advanceAmount,
    baseSalaryPayment,
    daysInMonth,
    absenceUnitAmount,
    absences,
    absenceCount: absences.length,
    absenceAmount,
    adjustments: activeAdjustments,
    otherDiscountAmount,
    totalDiscounts,
    finalSalaryPayment,
    netPayroll: money(advanceAmount + finalSalaryPayment),
    controlAttendance,
    weeklyDayOff: weeklyDayOff === '' || weeklyDayOff == null ? null : Number(weeklyDayOff),
    monthlySundayOffOrdinal: Number(
      employee.monthlySundayOffOrdinal ?? employee.monthly_sunday_off_ordinal,
    ) || null,
    monthlySundayOffDate: monthlySunday,
  };
}
