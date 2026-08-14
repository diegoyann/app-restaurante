import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMonthlyDre } from './dreModel.js';
import { calculateExecutiveDashboard } from './executiveDashboardModel.js';

const employees = [
  { id: 'fixed-1', name: 'Fixo', employmentType: 'fixed', status: 'active', salary: 500, admissionDate: '2026-01-10' },
  { id: 'kitchen-1', name: 'Cozinha', role: 'Cozinha', employmentType: 'external', status: 'active' },
  { id: 'driver-1', name: 'Entrega', role: 'Motoboy', employmentType: 'external', status: 'active' }
];

const employeeWorkLogs = [
  { employeeId: 'kitchen-1', workDate: '2026-08-31', worked: true, dailyRate: 70, mealCost: 15, deliveryFee: 0 },
  { employeeId: 'driver-1', workDate: '2026-08-31', worked: true, dailyRate: 60, mealCost: 15, deliveryFee: 30 },
  { employeeId: 'driver-1', workDate: '2026-09-01', worked: true, dailyRate: 60, mealCost: 15, deliveryFee: 20 }
];

const transactions = [
  { id: 'r-jul', date: '2026-07-10', type: 'receita', amount: 800, net: 760, platform: 'Balcão' },
  { id: 'cmv-jul', date: '2026-07-20', type: 'despesa', amount: 304, category: 'CMV | Insumo' },
  { id: 'r-aug', date: '2026-08-10', type: 'receita', amount: 1000, net: 900, platform: 'Balcão' },
  { id: 'cmv-aug', date: '2026-08-12', type: 'despesa', amount: 200, category: 'CMV | Insumo' },
  { id: 'marketing-aug', date: '2026-08-15', type: 'despesa', amount: 50, category: 'Marketing' },
  { id: 'admin-aug', date: '2026-08-16', type: 'despesa', amount: 100, category: 'Contadora' },
  { id: 'duplicate-fixed', date: '2026-08-20', type: 'despesa', amount: 500, category: 'Folha Fixo' },
  { id: 'duplicate-extra', date: '2026-08-21', type: 'despesa', amount: 160, category: 'Folha Extra' }
];

const recurringCosts = [
  { id: 'rent', desc: 'Aluguel', amount: 200, lastPaidMonth: '2026-08' }
];

test('Dashboard executivo reutiliza exatamente o resultado operacional calculado pela DRE', () => {
  const dashboard = calculateExecutiveDashboard({ month: '2026-08', transactions, recurringCosts, employees, employeeWorkLogs });
  const directDre = calculateMonthlyDre({
    month: '2026-08',
    transactions,
    recurringCosts,
    payrollEntries: dashboard.payrollEntries
  });

  assert.equal(dashboard.dre.operatingResult, directDre.operatingResult);
  assert.equal(dashboard.dre.netIncome, directDre.netIncome);
  assert.equal(dashboard.totalOutflows, dashboard.dre.revenueGross - dashboard.dre.operatingResult);
});

test('Custo de pessoal usa a competência trabalhada e não duplica lançamentos manuais antigos', () => {
  const dashboard = calculateExecutiveDashboard({ month: '2026-08', transactions, recurringCosts, employees, employeeWorkLogs });

  assert.equal(dashboard.personnelCost, 690);
  assert.equal(dashboard.dre.administrativeExpenses, 990);
  assert.equal(dashboard.payrollEntries.some((entry) => entry.id === 'rh-motoboy-delivery-2026-08'), true);
  assert.equal(dashboard.payrollEntries.some((entry) => entry.date.startsWith('2026-09')), false);
});

test('Folha fixa sem admissão não é inventada retroativamente em competências antigas', () => {
  const dashboard = calculateExecutiveDashboard({
    month: '2025-12',
    transactions: [],
    recurringCosts: [],
    employees: [{ id: 'no-history', employmentType: 'fixed', status: 'active', salary: 500 }],
    employeeWorkLogs: []
  });

  assert.equal(dashboard.personnelCost, 0);
  assert.equal(dashboard.hasData, false);
});

test('Folha histórica importada é reclassificada como pessoal sem alterar o resultado da DRE', () => {
  const historicalTransactions = [
    { date: '2025-12-05', type: 'receita', amount: 10000, net: 10000 },
    { date: '2025-12-10', type: 'despesa', amount: 3680, category: 'Planilha Dez/2025 — Custos Fixos — Folha Fixo' },
    { date: '2025-12-11', type: 'despesa', amount: 14370, category: 'Planilha Dez/2025 — Custos Fixos — Folha Extra' },
    { date: '2025-12-12', type: 'despesa', amount: 2110, category: 'Planilha Dez/2025 — Custos Fixos — Aluguel' }
  ];
  const dashboard = calculateExecutiveDashboard({
    month: '2025-12',
    transactions: historicalTransactions,
    recurringCosts: [],
    employees: [{ id: 'current-only', employmentType: 'fixed', status: 'active', salary: 7160 }],
    employeeWorkLogs: []
  });

  assert.equal(dashboard.personnelCost, 18050);
  assert.equal(dashboard.composition.find((group) => group.id === 'fixed-costs').value, 2110);
  assert.equal(dashboard.dre.operatingResult, 10000 - 3680 - 14370 - 2110);
});

test('Folha importada como custo recorrente é separada dos custos fixos gerais', () => {
  const dashboard = calculateExecutiveDashboard({
    month: '2025-12',
    transactions: [{ date: '2025-12-05', type: 'receita', amount: 30000, net: 30000 }],
    recurringCosts: [
      { id: 'fixed-payroll', desc: 'Planilha Dez/2025 — Custos Fixos — Folha Fixo', amount: 3680, lastPaidMonth: '2025-12' },
      { id: 'extra-payroll', desc: 'Planilha Dez/2025 — Custos Fixos — Folha Extra', amount: 14370, lastPaidMonth: '2025-12' },
      { id: 'rent', desc: 'Planilha Dez/2025 — Custos Fixos — Aluguel', amount: 2110, lastPaidMonth: '2025-12' }
    ],
    employees: [],
    employeeWorkLogs: []
  });

  assert.equal(dashboard.personnelCost, 18050);
  assert.equal(dashboard.composition.find((group) => group.id === 'fixed-costs').value, 2110);
  assert.equal(dashboard.totalOutflows, 20160);
});

test('Dashboard não chama CMV provisório de fechado', () => {
  const dashboard = calculateExecutiveDashboard({ month: '2026-08', transactions, recurringCosts, employees, employeeWorkLogs });

  assert.equal(dashboard.closedCmv.month, '2026-07');
  assert.equal(dashboard.closedCmv.percentage, 40);
  assert.equal(dashboard.closedCmv.status, 'PROVISIONAL');
});

test('CMV fechado usa a competência imediatamente anterior quando existe inventário encerrado', () => {
  const dashboard = calculateExecutiveDashboard({
    month: '2026-08',
    transactions,
    recurringCosts,
    employees,
    employeeWorkLogs,
    inventoryCmvSummaries: [{ month: '2026-07', status: 'CLOSED', realCmv: 304 }]
  });

  assert.equal(dashboard.closedCmv.month, '2026-07');
  assert.equal(dashboard.closedCmv.percentage, 40);
  assert.equal(dashboard.closedCmv.status, 'CLOSED');
});

test('Composição macro soma exatamente as saídas operacionais sem duplicar subcategorias', () => {
  const dashboard = calculateExecutiveDashboard({ month: '2026-08', transactions, recurringCosts, employees, employeeWorkLogs });
  const compositionTotal = dashboard.composition.reduce((sum, group) => sum + group.value, 0);
  const ids = dashboard.composition.map((group) => group.id);

  assert.equal(compositionTotal, dashboard.totalOutflows);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids.includes('fixed-payroll'), true);
  assert.equal(ids.includes('extra-payroll'), true);
  assert.equal(ids.includes('meals'), true);
  assert.equal(ids.includes('fixed-costs'), true);
});

test('Comparativos são calculados contra o mês anterior e margens percentuais usam pontos percentuais', () => {
  const dashboard = calculateExecutiveDashboard({ month: '2026-08', transactions, recurringCosts, employees, employeeWorkLogs });

  assert.equal(dashboard.comparison.revenuePercent, 25);
  assert.equal(Number.isFinite(dashboard.comparison.marginPoints), true);
  assert.equal(Number.isFinite(dashboard.comparison.personnelPoints), true);
});
