import test from 'node:test';
import assert from 'node:assert/strict';
import { aggregateWeeklySettlements, weeklySettlementPeriod } from './settlementModel.js';

test('iFood agrupa segunda a domingo e prevê recebimento na quarta seguinte', () => {
  assert.deepEqual(weeklySettlementPeriod('2026-08-10'), { periodStart: '2026-08-10', periodEnd: '2026-08-16', expectedDate: '2026-08-19' });
  const [settlement] = aggregateWeeklySettlements([
    { salesChannelId: 'ifood', date: '2026-08-10', amount: 100, net: 85 },
    { salesChannelId: 'ifood', date: '2026-08-16', amount: 200, net: 170 }
  ]);
  assert.deepEqual(settlement, { salesChannelId: 'ifood', periodStart: '2026-08-10', periodEnd: '2026-08-16', expectedDate: '2026-08-19', grossAmount: 300, feeAmount: 45, netAmount: 255 });
});
