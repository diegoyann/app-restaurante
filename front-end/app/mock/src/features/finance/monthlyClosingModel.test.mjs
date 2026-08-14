import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMonthlyClosingSnapshot } from './monthlyClosingModel.js';

test('fechamento mensal mantém competência, realizado, saldos e estoque em blocos independentes', () => {
  const snapshot = buildMonthlyClosingSnapshot({
    month: '2026-08',
    today: '2026-08-12',
    transactions: [{ date: '2026-08-01', type: 'receita', amount: 1000, net: 1000, category: 'Balcão' }],
    obligations: [{ competenceMonth: '2026-08', economicCategory: 'CUSTO_FIXO', totalAmount: 200, openAmount: 0, paidAmount: 200, status: 'PAID' }],
    reconciliations: [{ date: '2026-08-01', grossRevenue: 900, bankOutflow: 100, cashOutflow: 50, cashDifference: 0 }],
    balancePeriods: [{ competenceMonth: '2026-08', status: 'CLOSED', expectedTotalBalance: 750, actualTotalBalance: 750 }],
    inventorySummaries: [{ month: '2026-08', status: 'CLOSED', openingValue: 100, purchasesReceived: 300, closingValue: 250, realCmv: 150 }]
  });
  assert.equal(snapshot.dre.netIncome, 650);
  assert.equal(snapshot.cashFlow.net, 750);
  assert.equal(snapshot.payable.paid, 200);
  assert.equal(snapshot.inventory.realCmv, 150);
  assert.equal(snapshot.ready, true);
});

test('fechamento não fica pronto sem fluxo, saldos e inventário fechados', () => {
  const snapshot = buildMonthlyClosingSnapshot({ month: '2026-08' });
  assert.equal(snapshot.ready, false);
  assert.deepEqual(snapshot.checks, { dre: true, cashFlow: false, balances: false, inventory: false });
});
