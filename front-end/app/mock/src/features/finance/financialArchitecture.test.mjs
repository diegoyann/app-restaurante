import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCashCmv, CMV_INPUT_CATEGORY, CMV_OFFICIAL_REVENUE_CATEGORY } from './cashCmvModel.js';
import { calculateMonthlyDre } from './dreModel.js';

test('DRE reconhece obrigação pela competência sem depender do pagamento', () => {
  const dre = calculateMonthlyDre({
    month: '2026-08',
    transactions: [{ id: 'revenue', date: '2026-08-01', type: 'receita', amount: 1000, net: 1000, category: 'Balcão' }],
    obligations: [{ id: 'rent', competenceMonth: '2026-08', economicCategory: 'CUSTO_FIXO', sourceType: 'RECURRING', description: 'Aluguel', totalAmount: 200, paidAmount: 0 }]
  });
  assert.equal(dre.administrativeExpenses, 200);
  assert.equal(dre.netIncome, 800);
});

test('pagamento de obrigação não duplica a despesa na DRE', () => {
  const dre = calculateMonthlyDre({
    month: '2026-08',
    transactions: [
      { id: 'revenue', date: '2026-08-01', type: 'receita', amount: 1000, net: 1000, category: 'Balcão' },
      { id: 'payment', date: '2026-08-20', type: 'controle', amount: 200, net: -200, category: 'Fluxo | Saída de conta', obligationId: 'rent' }
    ],
    obligations: [{ id: 'rent', competenceMonth: '2026-08', economicCategory: 'CUSTO_FIXO', sourceType: 'RECURRING', description: 'Aluguel', totalAmount: 200, paidAmount: 200 }]
  });
  assert.equal(dre.administrativeExpenses, 200);
  assert.equal(dre.netIncome, 800);
});

test('CMV usa a categoria econômica INSUMO em banco e dinheiro e exclui custo fixo', () => {
  const cmv = calculateCashCmv({
    month: '2026-08',
    transactions: [
      { date: '2026-08-01', type: 'receita', category: CMV_OFFICIAL_REVENUE_CATEGORY, amount: 1000, net: 1000 },
      { date: '2026-08-02', type: 'despesa', category: 'Fornecedor A', economicCategory: 'INSUMO', financialOrigin: 'BANK', amount: 100 },
      { date: '2026-08-03', type: 'despesa', category: CMV_INPUT_CATEGORY, economicCategory: 'INSUMO', financialOrigin: 'CASH', amount: 200 },
      { date: '2026-08-04', type: 'despesa', category: 'Aluguel', economicCategory: 'CUSTO_FIXO', financialOrigin: 'CASH', amount: 500 }
    ]
  });
  assert.equal(cmv.inputCost, 300);
  assert.equal(cmv.percentage, 30);
});

test('CMV fechado de inventário substitui compras e insumos na DRE sem duplicidade', () => {
  const dre = calculateMonthlyDre({
    month: '2026-09',
    transactions: [
      { date: '2026-09-01', type: 'receita', amount: 1000, net: 1000, category: 'Balcão' },
      { date: '2026-09-02', type: 'despesa', amount: 300, category: 'Compra de insumos' }
    ],
    obligations: [
      { competenceMonth: '2026-09', economicCategory: 'INSUMO', sourceType: 'PURCHASE_RECEIPT', description: 'Fornecedor', totalAmount: 300 }
    ],
    inventoryCmvSummaries: [
      { month: '2026-09', openingValue: 200, purchasesReceived: 300, closingValue: 350, realCmv: 150, status: 'CLOSED' }
    ]
  });
  assert.equal(dre.costOfSales, 150);
  assert.deepEqual(dre.details.costOfSales, { 'CMV Fechado | Inventário': 150 });
  assert.equal(dre.cmvStatus, 'CLOSED');
  assert.equal(dre.netIncome, 850);
});

test('CMV fechado por estoque permanece intacto e refeição continua como custo separado', () => {
  const dre = calculateMonthlyDre({
    month: '2026-08',
    transactions: [{ date: '2026-08-01', type: 'receita', amount: 1000, net: 1000, category: 'Balcão' }],
    payrollEntries: [{ date: '2026-08-01', amount: 30, category: 'Refeição Funcionários' }],
    inventoryCmvSummaries: [{ month: '2026-08', realCmv: 300, status: 'CLOSED' }]
  });
  assert.equal(dre.costOfSales, 300);
  assert.equal(dre.administrativeExpenses, 30);
  assert.equal(dre.netIncome, 670);
  assert.deepEqual(dre.details.costOfSales, { 'CMV Fechado | Inventário': 300 });
  assert.deepEqual(dre.details.administrative, { 'Refeição Funcionários': 30 });
});

test('DRE provisória desconta refeição da base de insumos e mantém refeição administrativa', () => {
  const dre = calculateMonthlyDre({
    month: '2026-08',
    transactions: [
      { date: '2026-08-01', type: 'receita', amount: 62000, net: 62000, category: CMV_OFFICIAL_REVENUE_CATEGORY },
      { date: '2026-08-02', type: 'despesa', amount: 25000, category: CMV_INPUT_CATEGORY, economicCategory: 'INSUMO' }
    ],
    payrollEntries: [{ date: '2026-08-01', amount: 600, category: 'Refeição Funcionários' }]
  });
  assert.equal(dre.costOfSales, 24400);
  assert.equal(dre.administrativeExpenses, 600);
  assert.equal(Number(dre.cmv.percentage.toFixed(2)), 39.35);
  assert.deepEqual(dre.details.cmvCalculation, {
    'Gasto com insumos bruto': 25000,
    '(-) Refeição Funcionários': -600,
    'Gasto com insumos considerado no CMV': 24400,
    'Faturamento oficial': 62000
  });
});

test('CMV de caixa passa a usar inventário real somente após fechamento', () => {
  const base = {
    month: '2026-09',
    transactions: [{ date: '2026-09-01', type: 'receita', category: CMV_OFFICIAL_REVENUE_CATEGORY, amount: 1000, net: 1000 }],
    obligations: [{ competenceMonth: '2026-09', economicCategory: 'INSUMO', totalAmount: 300 }],
    payrollEntries: [{ date: '2026-09-01', amount: 30, category: 'Refeição Funcionários' }]
  };
  const provisional = calculateCashCmv({ ...base, inventoryCmvSummaries: [{ month: '2026-09', purchasesReceived: 300, status: 'OPEN' }] });
  const closed = calculateCashCmv({ ...base, inventoryCmvSummaries: [{ month: '2026-09', realCmv: 150, status: 'CLOSED' }] });
  assert.equal(provisional.inputCost, 270);
  assert.equal(provisional.employeeMealCost, 30);
  assert.equal(provisional.status, 'PROVISIONAL');
  assert.equal(closed.inputCost, 150);
  assert.equal(closed.mealDeduction, 0);
  assert.equal(closed.status, 'CLOSED');
});
