import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPayrollPreview } from '../../../services/payrollService.js';

const settings = {
  salaryPercentage: 60,
  salaryBusinessDayOrdinal: 5,
  advancePercentage: 40,
  advanceFixedDay: 20,
  advanceBusinessDayPolicy: 'next',
  holidayDates: [],
  mealCostPerWorkday: 15,
  extraKitchenDailyRate: 70,
  extraMotoboyDailyRate: 60
};

test('saldo de 60% mantém a competência e vence no quinto dia útil do mês seguinte', () => {
  const preview = buildPayrollPreview({
    referenceMonth: '2026-08',
    settings,
    employees: [{ id: 'employee-1', name: 'Funcionário', role: 'Cozinha', employmentType: 'fixed', status: 'active', salary: 1000 }]
  });

  assert.equal(preview.referenceMonth, '2026-08');
  assert.equal(preview.dates.advancePaymentDate, '2026-08-20');
  assert.equal(preview.dates.salaryPaymentDate, '2026-09-07');
  assert.equal(preview.fixed.totals.advanceTotal, 400);
  assert.equal(preview.fixed.totals.salaryPaymentTotal, 600);
});

test('vencimento do saldo atravessa corretamente dezembro para janeiro', () => {
  const preview = buildPayrollPreview({ referenceMonth: '2026-12', settings, employees: [] });
  assert.equal(preview.dates.salaryPaymentDate, '2027-01-07');
});

