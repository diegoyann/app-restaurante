import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateFixedPayrollStatement, daysInCompetenceMonth } from './fixedPayrollModel.js';

const employee = {
  id: 'carol',
  name: 'Carol',
  salary: 1800,
  controlAttendance: true,
  attendanceControlFrom: '2026-08-01'
};
const payrollConfig = { advancePercentage: 40, salaryPercentage: 60 };
const mondaysOff = [{ kind: 'WEEKLY', weekday: 1, active: true }];
const allExpectedPresenceExcept = (missingDates = []) => Array.from({ length: 31 }, (_, index) => `2026-08-${String(index + 1).padStart(2, '0')}`)
  .filter((date) => new Date(`${date}T12:00:00`).getDay() !== 1 && !missingDates.includes(date))
  .map((workDate) => ({ workDate, worked: true }));

test('agosto de 2026 usa 31 dias e falta unitária de R$ 58,06', () => {
  assert.equal(daysInCompetenceMonth('2026-08'), 31);
  const statement = calculateFixedPayrollStatement({
    month: '2026-08', employee, payrollConfig, scheduledDaysOff: mondaysOff,
    workLogs: allExpectedPresenceExcept(['2026-08-13']), referenceDate: '2026-08-31'
  });
  assert.equal(statement.absenceCount, 1);
  assert.equal(statement.absenceUnitAmount, 58.06);
  assert.equal(statement.finalSalaryPayment, 1021.94);
});

test('duas faltas arredondam por dia e reduzem os 60% para R$ 963,88', () => {
  const statement = calculateFixedPayrollStatement({
    month: '2026-08', employee, payrollConfig, scheduledDaysOff: mondaysOff,
    workLogs: allExpectedPresenceExcept(['2026-08-13', '2026-08-14']), referenceDate: '2026-08-31'
  });
  assert.equal(statement.absenceAmount, 116.12);
  assert.equal(statement.finalSalaryPayment, 963.88);
});

test('folga específica não vira falta e jornada flexível nunca gera falta', () => {
  const scheduled = [...mondaysOff, { kind: 'DATE', offDate: '2026-08-16', active: true }];
  const controlled = calculateFixedPayrollStatement({
    month: '2026-08', employee, payrollConfig, scheduledDaysOff: scheduled,
    workLogs: allExpectedPresenceExcept(['2026-08-16']), referenceDate: '2026-08-31'
  });
  assert.equal(controlled.absenceCount, 0);
  const flexible = calculateFixedPayrollStatement({
    month: '2026-08', employee: { ...employee, controlAttendance: false }, payrollConfig,
    workLogs: [], scheduledDaysOff: [], referenceDate: '2026-08-31'
  });
  assert.equal(flexible.absenceCount, 0);
  assert.equal(flexible.finalSalaryPayment, 1080);
});

test('falta e ajustes auditáveis reduzem somente a parcela de 60%', () => {
  const statement = calculateFixedPayrollStatement({
    month: '2026-08', employee, payrollConfig, scheduledDaysOff: mondaysOff,
    workLogs: allExpectedPresenceExcept(['2026-08-13']), referenceDate: '2026-08-31',
    adjustments: [
      { competenceMonth: '2026-08', category: 'STORE_PURCHASE', amount: 30, status: 'ACTIVE' },
      { competenceMonth: '2026-08', category: 'EXTRA_ADVANCE', amount: 100, status: 'ACTIVE' },
      { competenceMonth: '2026-08', category: 'OTHER', amount: 999, status: 'CANCELLED' }
    ]
  });
  assert.equal(statement.advanceAmount, 720);
  assert.equal(statement.totalDiscounts, 188.06);
  assert.equal(statement.finalSalaryPayment, 891.94);
});

test('registrar presença retroativa remove a falta e recalcula os 60%', () => {
  const before = calculateFixedPayrollStatement({
    month: '2026-08', employee, payrollConfig, scheduledDaysOff: mondaysOff,
    workLogs: allExpectedPresenceExcept(['2026-08-13']), referenceDate: '2026-08-31'
  });
  const after = calculateFixedPayrollStatement({
    month: '2026-08', employee, payrollConfig, scheduledDaysOff: mondaysOff,
    workLogs: allExpectedPresenceExcept(), referenceDate: '2026-08-31'
  });
  assert.equal(before.finalSalaryPayment, 1021.94);
  assert.equal(after.absenceCount, 0);
  assert.equal(after.finalSalaryPayment, 1080);
});

test('folga semanal e segundo domingo vindos do cadastro não geram falta', () => {
  const statement = calculateFixedPayrollStatement({
    month: '2026-08',
    employee: { ...employee, weeklyDayOff: 1, monthlySundayOffOrdinal: 2 },
    payrollConfig,
    scheduledDaysOff: [],
    workLogs: allExpectedPresenceExcept(['2026-08-09']),
    referenceDate: '2026-08-31'
  });
  assert.equal(statement.monthlySundayOffDate, '2026-08-09');
  assert.equal(statement.absenceCount, 0);
});

test('regra individual 50/50 prevalece sobre o padrão global 40/60', () => {
  const statement = calculateFixedPayrollStatement({
    month: '2026-08',
    employee: {
      ...employee,
      salary: 2000,
      controlAttendance: false,
      firstPaymentPercentage: 50,
      finalPaymentPercentage: 50
    },
    payrollConfig,
    workLogs: [],
    referenceDate: '2026-08-31'
  });
  assert.equal(statement.advancePercentage, 50);
  assert.equal(statement.salaryPercentage, 50);
  assert.equal(statement.advanceAmount, 1000);
  assert.equal(statement.baseSalaryPayment, 1000);
  assert.equal(statement.finalSalaryPayment, 1000);
});
