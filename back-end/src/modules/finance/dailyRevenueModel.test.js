import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDailyRevenue } from './dailyRevenueModel.js';

test('uma entrada diária distribui caixa, banco e recebível sem duplicar receita', () => {
  const result = buildDailyRevenue({ date: '2026-08-10', batchId: 'batch', channels: [
    { id: 'a', name: 'Anota Aí', feePercent: 0, settlementType: 'IMMEDIATE' },
    { id: 'i', name: 'iFood', feePercent: 15, settlementType: 'SCHEDULED' }
  ], entries: [{ channelId: 'a', cash: 100, online: 200 }, { channelId: 'i', cash: 0, online: 1000 }] });
  assert.deepEqual(result.totals, { grossRevenue: 1300, cashRevenue: 100, bankRevenue: 200, receivableRevenue: 1000 });
  assert.equal(result.rows.reduce((sum, row) => sum + row.amount, 0), 1300);
  assert.equal(result.rows.find((row) => row.platform === 'iFood').net, 850);
});
