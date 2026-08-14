import test from 'node:test';
import assert from 'node:assert/strict';
import { latestEffectiveVersion, resolveHistoricalOrCurrent } from './payrollHistoryModel.js';

test('alteração de agosto não vaza para julho', () => {
  const history = [
    { employee_id: 'fabio', effective_month: '2026-07', salary: 1800 },
    { employee_id: 'fabio', effective_month: '2026-08', salary: 2000 },
  ];
  assert.equal(latestEffectiveVersion(history, '2026-07').salary, 1800);
  assert.equal(latestEffectiveVersion(history, '2026-08').salary, 2000);

  history[1] = { ...history[1], salary: 2400 };
  assert.equal(latestEffectiveVersion(history, '2026-07').salary, 1800);
  assert.equal(latestEffectiveVersion(history, '2026-08').salary, 2400);
});

test('não inventa salário histórico usando o cadastro atual', () => {
  const current = { id: 'fabio', salary: 2400 };
  assert.equal(resolveHistoricalOrCurrent({
    history: [{ employee_id: 'fabio', effective_month: '2026-08', salary: 2400 }],
    month: '2026-07',
    currentMonth: '2026-08',
    current,
    predicate: (row) => row.employee_id === 'fabio',
  }), null);
  assert.equal(resolveHistoricalOrCurrent({
    history: [], month: '2026-08', currentMonth: '2026-08', current,
  }), current);
});
