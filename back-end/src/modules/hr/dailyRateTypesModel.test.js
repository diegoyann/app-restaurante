import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveDailyRateSelection, suggestedDailyRateTypeIds } from './dailyRateTypesModel.js';

const types = [
  { id: 'day', name: 'Diária Dia', amount: 60, active: true, appliesWeekdays: true, appliesWeekends: true },
  { id: 'night', name: 'Diária Noite', amount: 70, active: true, appliesWeekdays: true, appliesWeekends: true }
];

test('soma dois Tipos de Diária na mesma presença', () => {
  assert.equal(resolveDailyRateSelection(types, ['day', 'night']).dailyRate, 130);
});

test('preserva snapshot antigo após reajuste da configuração', () => {
  const result = resolveDailyRateSelection(
    [{ ...types[1], amount: 80 }],
    ['night'],
    [{ daily_rate_type_id: 'night', type_name: 'Diária Noite', amount_snapshot: 70 }]
  );
  assert.equal(result.dailyRate, 70);
  assert.equal(result.snapshots[0].amountSnapshot, 70);
});

test('sugere automaticamente o único tipo aplicável ao dia', () => {
  const weekdayWeekendTypes = [
    { id: 'weekday', active: true, appliesWeekdays: true, appliesWeekends: false },
    { id: 'weekend', active: true, appliesWeekdays: false, appliesWeekends: true }
  ];
  assert.deepEqual(suggestedDailyRateTypeIds(weekdayWeekendTypes, '2026-08-13'), ['weekday']);
  assert.deepEqual(suggestedDailyRateTypeIds(weekdayWeekendTypes, '2026-08-15'), ['weekend']);
});
