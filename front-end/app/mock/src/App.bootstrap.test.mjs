import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  assertIngredientUnitLabel,
  createDefaultIngredientUnits
} from './mocks/appStateDefaults.js';
import { calculateMonthlyDre, classifyDreExpense } from './features/finance/dreModel.js';

const currentDir = dirname(fileURLToPath(import.meta.url));

test('authenticated bootstrap hydrates every field required by the current frontend contract', async () => {
  const appSource = await readFile(join(currentDir, 'App.jsx'), 'utf8');
  const hydratedFields = [
    'settings', 'aiBehaviorSettings', 'payrollConfig', 'employees', 'employeeRoles',
    'recurringCosts', 'salesChannels', 'financeExpenseCategories', 'transactions',
    'financialObligations', 'financialPayments', 'dailyCashReconciliations',
    'channelSettlements', 'recurringCostDuplicateCandidates', 'currentUserPermissions',
    'customers', 'paymentMethods', 'orders', 'deliveryDrivers', 'discountCategories',
    'employeeWorkLogs', 'extraWeeklyClosings', 'ingredients', 'preparations', 'products',
    'menuCategories', 'menuItems'
  ];

  for (const field of hydratedFields) {
    assert.match(appSource, new RegExp(`payload\\.${field}\\b`), `campo não hidratado: ${field}`);
  }
  assert.match(appSource, /createDefaultIngredientUnits\(\)/);
});

test('tenant dashboard does not ship a seeded revenue chart mock', async () => {
  const appSource = await readFile(join(currentDir, 'App.jsx'), 'utf8');

  assert.doesNotMatch(appSource, /MONTHLY_REVENUE_CHART_MOCK|USE_REVENUE_CHART_MOCK/);
});

test('tenant navigation has a native hash fallback for every internal screen', async () => {
  const appSource = await readFile(join(currentDir, 'App.jsx'), 'utf8');

  assert.match(appSource, /window\.addEventListener\(["']hashchange["'], syncTabFromHash\)/);
  assert.match(appSource, /href="#dashboard"/);
  assert.match(appSource, /href=\{`#\$\{item\.id\}`\}/);
  assert.match(appSource, /const activateTab = \(tab\) =>/);
  assert.match(appSource, /window\.location\.hash = tab;/);
});

test('real login validates the backend session before navigating', async () => {
  const loginSource = await readFile(join(currentDir, 'pages', 'LoginPage.jsx'), 'utf8');

  assert.match(loginSource, /const payload = await authApi\.getSession\(\);/);
  assert.match(loginSource, /navigate\(resolveSessionDestination\(payload\), \{ replace: true \}\);/);
  assert.match(loginSource, /Não foi possível alcançar o Supabase/);
});

test('unvalidated integrations are disabled by explicit feature flags', async () => {
  const flagsSource = await readFile(join(currentDir, 'config', 'featureFlags.js'), 'utf8');
  const appSource = await readFile(join(currentDir, 'App.jsx'), 'utf8');
  const loginSource = await readFile(join(currentDir, 'pages', 'LoginPage.jsx'), 'utf8');

  assert.match(flagsSource, /reviewManagement: isExplicitlyEnabled\(import\.meta\.env\.VITE_FEATURE_REVIEW_MANAGEMENT\)/);
  assert.match(flagsSource, /aiBehaviorSettings: isExplicitlyEnabled\(import\.meta\.env\.VITE_FEATURE_AI_BEHAVIOR_SETTINGS\)/);
  assert.match(flagsSource, /googleAuth: isExplicitlyEnabled\(import\.meta\.env\.VITE_FEATURE_GOOGLE_AUTH\)/);
  assert.match(flagsSource, /orderOperations: isExplicitlyEnabled\(import\.meta\.env\.VITE_FEATURE_ORDER_OPERATIONS\)/);
  assert.match(flagsSource, /if \(tab === ["']orders["']\) return featureFlags\.orderOperations/);
  assert.match(appSource, /isAppTabEnabled\(item\.id\)\s*&&\s*canAccessTab\(item\.id\)/);
  assert.match(appSource, /APP_TAB_IDS\.has\(tab\) && isAppTabEnabled\(tab\)/);
  assert.match(loginSource, /featureFlags\.googleAuth &&/);
});

test('product cards expose edit flow through a product modal', async () => {
  const appSource = await readFile(join(currentDir, 'App.jsx'), 'utf8');

  assert.match(appSource, /const ProductModal = \(/);
  assert.match(appSource, /const handleEditProduct = \(product\) =>/);
  assert.match(appSource, /onClick=\{\(\) => handleEditProduct\(product\)\}/);
  assert.match(appSource, /<Edit size=\{11\} \/> Editar/);
});

test('menu item price syncs from a single linked CMV product', async () => {
  const appSource = await readFile(join(currentDir, 'App.jsx'), 'utf8');
  const menuComponentsSource = await readFile(join(currentDir, 'features/menu/MenuComponents.jsx'), 'utf8');

  assert.match(appSource, /linkedComponentIds: component \? \[componentKey\] : \[\]/);
  assert.match(appSource, /priceEditable: false/);
  assert.match(appSource, /catalogApi\.saveProduct\(tenantSlug/);
  assert.match(menuComponentsSource, /Preço do CMV/);
  assert.match(menuComponentsSource, /Editar preço/);
});

test('ingredient units are fixed and normalized', async () => {
  assert.deepEqual(createDefaultIngredientUnits().map((unit) => unit.label), ['KG', 'G', 'ML', 'L', 'UN']);
  assert.equal(assertIngredientUnitLabel('kg'), 'KG');
  assert.equal(assertIngredientUnitLabel('un'), 'UN');
  assert.throws(() => assertIngredientUnitLabel('CX'), /Unidade inválida/);

  const appSource = await readFile(join(currentDir, 'App.jsx'), 'utf8');

  assert.doesNotMatch(appSource, /Cadastrar Unidades/);
  assert.doesNotMatch(appSource, /const UnitModal =/);
});

test('monthly DRE calculates revenue, channel deductions, costs and net profit from registered entries', () => {
  const dre = calculateMonthlyDre({
    month: '2026-08',
    transactions: [
      { date: '2026-08-03', type: 'receita', amount: 1000, net: 770, category: 'iFood' },
      { date: '2026-08-04', type: 'despesa', amount: 250, category: 'Compra de Insumos' },
      { date: '2026-08-05', type: 'despesa', amount: 80, category: 'Marketing' },
      { date: '2026-08-06', type: 'despesa', amount: 20, category: 'Tarifa bancária' },
      { date: '2026-08-07', type: 'despesa', amount: 500, category: 'Retirada' }
    ],
    recurringCosts: [{ desc: 'Aluguel', amount: 100, lastPaidMonth: '2026-08' }],
    payrollEntries: [{ date: '2026-08-10', amount: 200, category: 'Folha / RH' }]
  });

  assert.equal(dre.revenueGross, 1000);
  assert.equal(dre.revenueDeductions, 230);
  assert.equal(dre.revenueNet, 770);
  assert.equal(dre.costOfSales, 250);
  assert.equal(dre.sellingExpenses, 80);
  assert.equal(dre.administrativeExpenses, 300);
  assert.equal(dre.financialExpenses, 20);
  assert.equal(dre.netIncome, 120);
  assert.equal(dre.withdrawals, 500);
  assert.equal(classifyDreExpense('Fornecedor de embalagens'), 'costOfSales');
  assert.equal(classifyDreExpense('Retirada'), 'withdrawal');
});

test('DRE tab is available in the financial navigation', async () => {
  const appSource = await readFile(join(currentDir, 'App.jsx'), 'utf8');
  const drePageSource = await readFile(join(currentDir, 'features', 'finance', 'DreMonthlyPage.jsx'), 'utf8');

  assert.match(appSource, /["']dre["']/);
  assert.match(appSource, /label: ["']DRE Mensal["']/);
  assert.match(appSource, /<DreMonthlyPage/);
  assert.match(drePageSource, /type="date"/);
  assert.match(drePageSource, /showPicker\?\.\(\)/);
  assert.match(drePageSource, /event\.target\.value\.slice\(0, 7\)/);
});

test('CMV metric cards and payment alert use explicit accessible contrast variants', async () => {
  const appSource = await readFile(join(currentDir, 'App.jsx'), 'utf8');
  const cssSource = await readFile(join(currentDir, 'index.css'), 'utf8');

  assert.match(appSource, /metric-card--cmv-health/);
  assert.match(appSource, /metric-card--cmv-markup/);
  assert.match(appSource, /payment-alert__label/);
  assert.match(appSource, /md:grid-cols-2 xl:grid-cols-4/);
  assert.match(cssSource, /\.metric-card--cmv-health/);
  assert.match(cssSource, /\.payment-alert/);
});

test('financial launches validate mandatory fields and show the API error in the finance screen', async () => {
  const appSource = await readFile(join(currentDir, 'App.jsx'), 'utf8');

  assert.match(appSource, /const \[financeError, setFinanceError\] = useState\(["']["']\)/);
  assert.match(appSource, /if \(!reference\)/);
  assert.match(appSource, /Selecione o canal da entrada/);
  assert.match(appSource, /setFinanceError\(\s*apiError\.message \|\|\s*["']Não foi possível registrar o lançamento agora\.["']/);
  assert.match(appSource, /role=\{financeError \? ["']alert["'] : ["']status["']\}/);
  assert.match(appSource, /<form\s+noValidate\s+onSubmit=\{handleAddTransaction\}/);
  assert.match(appSource, /name="reference"[\s\S]{0,200}\brequired\b/);
  assert.match(appSource, /setDreMonth\(date\.slice\(0, 7\)\)/);
});
