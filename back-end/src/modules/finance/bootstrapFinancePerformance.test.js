import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  obligationKey,
  planObligationBatch
} from './bootstrapObligationBatch.js';

test('bootstrap obligation batch skips closed and preserved rows while retaining mutable values', () => {
  const candidates = [
    {
      tenant_id: 'tenant-1', source_type: 'RECURRING', source_id: 'cost-1',
      competence_month: '2026-08', description: 'Aluguel', economic_category: 'FIXED',
      forecast_type: 'FIXED', forecast_amount: 1000, due_date: '2026-08-10', note: ''
    },
    {
      tenant_id: 'tenant-1', source_type: 'RECURRING', source_id: 'cost-2',
      competence_month: '2026-09', description: 'Energia', economic_category: 'FIXED',
      forecast_type: 'ESTIMATED', forecast_amount: 500, due_date: '2026-09-10', note: ''
    },
    {
      tenant_id: 'tenant-1', source_type: 'IMPORTED_SPREADSHEET', source_id: 'legacy-1',
      competence_month: '2026-07', description: 'Histórico', economic_category: 'FIXED',
      forecast_type: 'FIXED', forecast_amount: 300, final_amount: 300,
      due_date: '2026-07-10', status: 'PAID', paid_amount: 300, note: '',
      preserveExisting: true
    }
  ];
  const existing = [
    {
      id: 'existing-1', tenant_id: 'tenant-1', source_type: 'RECURRING', source_id: 'cost-1',
      competence_month: '2026-08', final_amount: 975, paid_amount: 125, status: 'PARTIAL',
      created_at: '2026-08-01T00:00:00Z'
    },
    {
      id: 'existing-legacy', tenant_id: 'tenant-1', source_type: 'IMPORTED_SPREADSHEET',
      source_id: 'legacy-1', competence_month: '2026-07', paid_amount: 300, status: 'PAID'
    }
  ];

  const rows = planObligationBatch({
    candidates,
    existing,
    closedMonths: new Set(['2026-09'])
  });

  assert.equal(rows.length, 1);
  assert.equal(rows[0].source_id, 'cost-1');
  assert.equal(rows[0].final_amount, 975);
  assert.equal(rows[0].paid_amount, 125);
  assert.equal(rows[0].status, 'PARTIAL');
  assert.equal(obligationKey(rows[0]), 'RECURRING:cost-1:2026-08');
});

test('bootstrap generation no longer awaits one obligation upsert per loop iteration', async () => {
  const source = await readFile(new URL('./obligationsService.js', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /for\s*\([^)]*\)[\s\S]{0,500}?await\s+upsertObligation\s*\(/u);
  assert.match(source, /upsert\(rows/u);
});
