import { buildMonthlyPayrollEntries, calculateMonthlyDre, classifyPersonnelExpense, getAdjacentMonth } from './dreModel.js';

const amount = (value) => Math.abs(Number(value) || 0);
const normalize = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

const sumEntries = (entries) => entries.reduce((total, entry) => total + amount(entry.amount), 0);

const groupEntries = (entries, fallback) => entries.reduce((groups, entry) => {
  const key = entry.category || entry.desc || fallback;
  groups[key] = (groups[key] || 0) + amount(entry.amount);
  return groups;
}, {});

const toDetails = (groups) => Object.entries(groups)
  .map(([label, value]) => ({ label, value }))
  .filter((item) => item.value > 0)
  .sort((a, b) => b.value - a.value);

const percentChange = (current, previous) => previous > 0
  ? ((current - previous) / previous) * 100
  : null;

function monthTransactionsFor(transactions, month) {
  return transactions.filter((transaction) => String(transaction.date || '').slice(0, 7) === month);
}

function buildExpenseComposition({ month, transactions, recurringCosts, payrollEntries, obligations, dre }) {
  const monthTransactions = monthTransactionsFor(transactions, month);
  const monthObligations = obligations.filter((obligation) => obligation.competenceMonth === month);
  if (monthObligations.length > 0) {
    const groups = [
      ['fixed-payroll', 'Folha Fixa', ['FOLHA_FIXA']],
      ['extra-payroll', 'Folha Extra', ['FOLHA_EXTRA']],
      ['meals', 'Refeição Funcionários', ['REFEICAO']],
      ['fixed-costs', 'Custos Fixos Gerais', ['CUSTO_FIXO', 'MARKETING', 'IMPOSTO', 'OUTRO']]
    ].map(([id, label, categories]) => {
      const items = monthObligations.filter((obligation) => categories.includes(obligation.economicCategory));
      return { id, label, value: sumEntries(items.map((item) => ({ amount: item.totalAmount }))), details: items.map((item) => ({ label: item.description, value: item.totalAmount })).sort((a, b) => b.value - a.value) };
    }).filter((group) => group.value > 0);
    if (dre.costOfSales > 0) groups.unshift({ id: 'cmv', label: 'Insumos / CMV', value: dre.costOfSales, details: toDetails(dre.details.costOfSales) });
    if (dre.revenueDeductions > 0) groups.push({ id: 'channel-fees', label: 'Taxas de Canal', value: dre.revenueDeductions, details: [] });
    if (dre.sellingExpenses > 0) groups.push({ id: 'other-expenses', label: 'Outras Despesas Operacionais', value: dre.sellingExpenses, details: toDetails(dre.details.selling) });
    return groups;
  }
  const payrollCategories = new Set(payrollEntries.map((entry) => normalize(entry.category)));
  const automaticPersonnelGroups = new Set(payrollEntries.map((entry) => classifyPersonnelExpense(entry.category)).filter(Boolean));
  const manualExpenses = monthTransactions.filter((entry) => {
    if (entry.type !== 'despesa') return false;
    const category = normalize(entry.category || entry.note);
    const automaticCategory = [...payrollCategories].some((payrollCategory) => category === payrollCategory || category === payrollCategory.split('|')[0].trim());
    const personnelGroup = classifyPersonnelExpense(category);
    return !automaticCategory && !(personnelGroup && automaticPersonnelGroups.has(personnelGroup));
  });
  const recurring = recurringCosts
    .filter((cost) => String(cost.lastPaidMonth || '') === month)
    .filter((cost) => {
      const personnelGroup = classifyPersonnelExpense(cost.desc);
      return !(personnelGroup && automaticPersonnelGroups.has(personnelGroup));
    })
    .map((cost) => ({ ...cost, category: cost.desc || 'Custo fixo' }));
  const fixedPayroll = payrollEntries.filter((entry) => normalize(entry.category).startsWith('folha fixo'));
  const extraPayroll = payrollEntries.filter((entry) => normalize(entry.category).startsWith('folha extra'));
  const meals = payrollEntries.filter((entry) => normalize(entry.category).startsWith('refeicao'));
  const otherPersonnel = payrollEntries.filter((entry) => !fixedPayroll.includes(entry) && !extraPayroll.includes(entry) && !meals.includes(entry));
  const manualFixedPayroll = manualExpenses.filter((entry) => classifyPersonnelExpense(entry.category || entry.note) === 'fixed');
  const manualExtraPayroll = manualExpenses.filter((entry) => classifyPersonnelExpense(entry.category || entry.note) === 'extra');
  const manualMeals = manualExpenses.filter((entry) => classifyPersonnelExpense(entry.category || entry.note) === 'meals');
  const manualOtherPersonnel = manualExpenses.filter((entry) => classifyPersonnelExpense(entry.category || entry.note) === 'other');
  const recurringFixedPayroll = recurring.filter((entry) => classifyPersonnelExpense(entry.category) === 'fixed');
  const recurringExtraPayroll = recurring.filter((entry) => classifyPersonnelExpense(entry.category) === 'extra');
  const recurringMeals = recurring.filter((entry) => classifyPersonnelExpense(entry.category) === 'meals');
  const recurringOtherPersonnel = recurring.filter((entry) => classifyPersonnelExpense(entry.category) === 'other');
  const allPersonnelRecurring = new Set([...recurringFixedPayroll, ...recurringExtraPayroll, ...recurringMeals, ...recurringOtherPersonnel]);
  const allPersonnelManual = new Set([...manualFixedPayroll, ...manualExtraPayroll, ...manualMeals, ...manualOtherPersonnel]);
  const administrativeManual = manualExpenses.filter((entry) => {
    if (allPersonnelManual.has(entry)) return false;
    const category = normalize(entry.category || entry.note);
    return !/insumo|fornecedor|ingrediente|embalagem|mercadoria|cmv|materia prima|marketing|publicidade|propaganda|frete|entrega|comissao|venda|juros|tarifa banc|iof|encargo financ|irpj|csll|retirada|distribuicao de lucro|dividendo/.test(category);
  });
  const sellingManual = manualExpenses.filter((entry) => /marketing|publicidade|propaganda|frete|entrega|comissao|venda/.test(normalize(entry.category || entry.note)));
  const revenueFees = monthTransactions
    .filter((entry) => entry.type === 'receita')
    .map((entry) => ({
      ...entry,
      amount: Math.max(amount(entry.amount) - (Number.isFinite(Number(entry.net)) ? amount(entry.net) : amount(entry.amount)), 0),
      category: entry.platform || 'Taxas de canal'
    }))
    .filter((entry) => entry.amount > 0);

  const macros = [
    { id: 'cmv', label: 'Insumos / CMV', value: dre.costOfSales, details: toDetails(dre.details.costOfSales) },
    { id: 'fixed-payroll', label: 'Folha Fixa', value: sumEntries([...fixedPayroll, ...manualFixedPayroll, ...recurringFixedPayroll]), details: toDetails(groupEntries([...fixedPayroll, ...manualFixedPayroll, ...recurringFixedPayroll], 'Folha fixa')) },
    { id: 'extra-payroll', label: 'Folha Extra', value: sumEntries([...extraPayroll, ...manualExtraPayroll, ...recurringExtraPayroll]), details: toDetails(groupEntries([...extraPayroll, ...manualExtraPayroll, ...recurringExtraPayroll], 'Folha extra')) },
    { id: 'meals', label: 'Refeição Funcionários', value: sumEntries([...meals, ...manualMeals, ...recurringMeals]), details: toDetails(groupEntries([...meals, ...manualMeals, ...recurringMeals], 'Refeição')) },
    { id: 'other-personnel', label: 'Outros Custos de Pessoal', value: sumEntries([...otherPersonnel, ...manualOtherPersonnel, ...recurringOtherPersonnel]), details: toDetails(groupEntries([...otherPersonnel, ...manualOtherPersonnel, ...recurringOtherPersonnel], 'Outros custos de pessoal')) },
    { id: 'fixed-costs', label: 'Custos Fixos Gerais', value: sumEntries(recurring.filter((entry) => !allPersonnelRecurring.has(entry))) + sumEntries(administrativeManual), details: toDetails(groupEntries([...recurring.filter((entry) => !allPersonnelRecurring.has(entry)), ...administrativeManual], 'Custos gerais')) },
    { id: 'channel-fees', label: 'Taxas de Canal', value: dre.revenueDeductions, details: toDetails(groupEntries(revenueFees, 'Taxas de canal')) },
    { id: 'other-expenses', label: 'Outras Despesas Operacionais', value: dre.sellingExpenses, details: toDetails(groupEntries(sellingManual, 'Outras despesas')) }
  ];

  return macros.filter((group) => group.value > 0);
}

function buildMonthSnapshot({ month, transactions, recurringCosts, employees, employeeWorkLogs, obligations, inventoryCmvSummaries }) {
  const payrollEntries = buildMonthlyPayrollEntries({ month, employees, employeeWorkLogs });
  const dre = calculateMonthlyDre({ month, transactions, recurringCosts, payrollEntries, obligations, inventoryCmvSummaries });
  const totalOutflows = dre.revenueDeductions + dre.costOfSales + dre.sellingExpenses + dre.administrativeExpenses;
  const hasData = Object.values(dre.sourceCounts).some((count) => count > 0);
  const netMargin = dre.revenueGross > 0 ? (dre.netIncome / dre.revenueGross) * 100 : null;
  const composition = buildExpenseComposition({ month, transactions, recurringCosts, payrollEntries, obligations, dre });
  const personnelCost = composition
    .filter((group) => ['fixed-payroll', 'extra-payroll', 'meals', 'other-personnel'].includes(group.id))
    .reduce((sum, group) => sum + group.value, 0);
  const personnelPercent = dre.revenueGross > 0 ? (personnelCost / dre.revenueGross) * 100 : null;

  return { month, dre, payrollEntries, personnelCost, personnelPercent, totalOutflows, netMargin, composition, hasData };
}

export function calculateExecutiveDashboard({ month, transactions = [], recurringCosts = [], employees = [], employeeWorkLogs = [], obligations = [], inventoryCmvSummaries = [] }) {
  const previousMonth = getAdjacentMonth(month, -1);
  const current = buildMonthSnapshot({ month, transactions, recurringCosts, employees, employeeWorkLogs, obligations, inventoryCmvSummaries });
  const previous = buildMonthSnapshot({ month: previousMonth, transactions, recurringCosts, employees, employeeWorkLogs, obligations, inventoryCmvSummaries });
  const previousCmv = previous.dre.officialRevenue > 0 && previous.dre.costOfSales > 0
    ? previous.dre.cmv.percentage
    : null;
  const comparison = {
    revenuePercent: previous.dre.revenueGross > 0 ? percentChange(current.dre.revenueGross, previous.dre.revenueGross) : null,
    operatingAmount: previous.hasData ? current.dre.operatingResult - previous.dre.operatingResult : null,
    marginPoints: current.netMargin !== null && previous.netMargin !== null ? current.netMargin - previous.netMargin : null,
    outflowsPercent: previous.totalOutflows > 0 ? percentChange(current.totalOutflows, previous.totalOutflows) : null,
    personnelPoints: current.personnelPercent !== null && previous.personnelPercent !== null ? current.personnelPercent - previous.personnelPercent : null
  };
  const previousComposition = new Map(previous.composition.map((group) => [group.id, group.value]));
  const costIncreases = current.composition
    .map((group) => ({ ...group, increasePercent: percentChange(group.value, previousComposition.get(group.id) || 0) }))
    .filter((group) => group.increasePercent !== null && group.increasePercent > 0)
    .sort((a, b) => b.increasePercent - a.increasePercent);

  return {
    ...current,
    previousMonth,
    closedCmv: { month: previousMonth, percentage: previousCmv, status: previous.dre.cmvStatus },
    comparison,
    insights: {
      largestCost: [...current.composition].sort((a, b) => b.value - a.value)[0] || null,
      largestIncrease: costIncreases[0] || null
    }
  };
}
