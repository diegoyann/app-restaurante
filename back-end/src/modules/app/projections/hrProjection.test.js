import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PAYROLL_CONFIG, mapPayrollConfig } from './hrProjection.js';

test('mapPayrollConfig returns safe defaults for a new empty tenant', () => {
  assert.deepEqual(mapPayrollConfig(null), DEFAULT_PAYROLL_CONFIG);
});

test('mapPayrollConfig normalizes a persisted payroll row', () => {
  assert.deepEqual(mapPayrollConfig({
    salary_percentage: '55',
    salary_business_day_ordinal: 4,
    advance_percentage: '45',
    advance_fixed_day: 18,
    advance_business_day_policy: 'previous',
    holiday_dates: ['2026-05-01']
  }), {
    salaryPercentage: 55,
    salaryBusinessDayOrdinal: 4,
    advancePercentage: 45,
    advanceFixedDay: 18,
    advanceBusinessDayPolicy: 'previous',
    holidayDates: ['2026-05-01'],
    mealCostPerWorkday: 15,
    extraKitchenDailyRate: 70,
    extraMotoboyDailyRate: 60
  });
});
