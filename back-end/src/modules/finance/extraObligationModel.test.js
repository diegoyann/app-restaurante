import test from 'node:test';
import assert from 'node:assert/strict';
import { buildExtraObligationRow } from './extraObligationModel.js';

test('a mesma semana reutiliza a identidade da obrigação e atualiza seu valor', () => {
  const closing = { id: 'closing-1', employee_id: 'employee-1', period_start: '2026-08-10', period_end: '2026-08-16', expected_payment_date: '2026-08-17', employees: { full_name: 'Extra Cozinha', role: 'Cozinha' } };
  const before = buildExtraObligationRow('tenant-1', { ...closing, total_payment: 140 });
  const after = buildExtraObligationRow('tenant-1', { ...closing, total_payment: 210 });
  assert.deepEqual([before.source_type, before.source_id, before.competence_month], [after.source_type, after.source_id, after.competence_month]);
  assert.equal(before.final_amount, 140);
  assert.equal(after.final_amount, 210);
});
