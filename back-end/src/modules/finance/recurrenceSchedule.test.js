import test from 'node:test';
import assert from 'node:assert/strict';
import { datesForRecurringCost, recurringObligationRows } from './recurrenceSchedule.js';

test('marketing semanal gera cinco segundas separadas em agosto de 2026', () => {
  const cost = { id: 'marketing', recurrence: 'WEEKLY', weekday: 1, effectiveFrom: '2026-01-01', amount: 400 };
  assert.deepEqual(datesForRecurringCost(cost, '2026-08'), ['2026-08-03', '2026-08-10', '2026-08-17', '2026-08-24', '2026-08-31']);
  assert.equal(recurringObligationRows(cost, '2026-08').reduce((sum, row) => sum + row.amount, 0), 2000);
  assert.equal(new Set(recurringObligationRows(cost, '2026-08').map((row) => row.sourceId)).size, 5);
});

test('recorrência semanal gera quatro segundas quando o mês possui quatro', () => {
  const cost = { id: 'marketing', recurrence: 'WEEKLY', weekday: 1, effectiveFrom: '2026-01-01', amount: 400 };
  assert.deepEqual(datesForRecurringCost(cost, '2026-09'), ['2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28']);
});

test('recorrência mensal respeita dia fixo e início de vigência', () => {
  assert.deepEqual(datesForRecurringCost({ recurrence: 'MONTHLY', dueDay: 31, effectiveFrom: '2026-02-01' }, '2026-02'), ['2026-02-28']);
  assert.deepEqual(datesForRecurringCost({ recurrence: 'MONTHLY', dueDay: 5, effectiveFrom: '2026-09-01' }, '2026-08'), []);
});

test('recorrência especial gera somente a data explícita', () => {
  assert.deepEqual(datesForRecurringCost({ recurrence: 'SPECIAL', effectiveFrom: '2026-08-21' }, '2026-08'), ['2026-08-21']);
  assert.deepEqual(datesForRecurringCost({ recurrence: 'SPECIAL', effectiveFrom: '2026-08-21' }, '2026-09'), []);
});
