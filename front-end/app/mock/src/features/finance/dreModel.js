import { calculateCurrentCmv, officialRevenueForCmv } from './cmvModel.js';

const asMoney = (value) => Math.abs(Number(value) || 0);

const normalizeText = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

const monthFromDate = (date) => String(date || '').slice(0, 7);

const sumBy = (items) => items.reduce((total, item) => total + asMoney(item.amount), 0);

export function getAdjacentMonth(month, offset) {
  const [year, monthNumber] = String(month || '').split('-').map(Number);
  if (!year || !monthNumber || !Number.isInteger(offset)) return '';
  const date = new Date(year, monthNumber - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Converte os dados operacionais do RH em lançamentos por competência.
 * Esta é a única montagem de folha usada tanto pela DRE quanto pelo Dashboard.
 */
export function buildMonthlyPayrollEntries({ month, employees = [], employeeWorkLogs = [] }) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const employeeBelongsToMonth = (employee) => {
    if (employee.employmentType !== 'fixed') return false;
    const admissionMonth = monthFromDate(employee.admissionDate);
    if (month > currentMonth) return false;
    if (!admissionMonth && month !== currentMonth) return false;
    if (admissionMonth && admissionMonth > month) return false;
    if (employee.status !== 'inactive') return true;
    const archivedMonth = monthFromDate(employee.updatedAt);
    return Boolean(archivedMonth && month <= archivedMonth);
  };
  const fixedPayroll = employees
    .filter(employeeBelongsToMonth)
    .reduce((sum, employee) => sum + asMoney(employee.salary), 0);
  const entries = fixedPayroll > 0 ? [{
    id: `rh-fixed-${month}`,
    date: `${month}-01`,
    amount: fixedPayroll,
    category: 'Folha Fixo'
  }] : [];
  const monthLogs = employeeWorkLogs.filter((log) => log.worked && monthFromDate(log.workDate) === month);
  const extras = monthLogs.reduce((totals, log) => {
    const employee = employees.find((item) => String(item.id) === String(log.employeeId));
    if (employee?.employmentType !== 'external') return totals;
    const isDeliveryWorker = /moto|entrega/i.test(String(employee.role || ''));
    if (isDeliveryWorker) {
      totals.motoboyDaily += asMoney(log.dailyRate);
      totals.motoboyDelivery += asMoney(log.deliveryFee);
    } else {
      totals.kitchen += asMoney(log.dailyRate);
    }
    return totals;
  }, { kitchen: 0, motoboyDaily: 0, motoboyDelivery: 0 });
  const meals = monthLogs.reduce((sum, log) => sum + asMoney(log.mealCost), 0);

  if (extras.kitchen > 0) entries.push({ id: `rh-kitchen-${month}`, date: `${month}-01`, amount: extras.kitchen, category: 'Folha Extra | Extra Cozinha' });
  if (extras.motoboyDaily > 0) entries.push({ id: `rh-motoboy-daily-${month}`, date: `${month}-01`, amount: extras.motoboyDaily, category: 'Folha Extra | Extra Motoboy - Diárias' });
  if (extras.motoboyDelivery > 0) entries.push({ id: `rh-motoboy-delivery-${month}`, date: `${month}-01`, amount: extras.motoboyDelivery, category: 'Folha Extra | Extra Motoboy - Entregas' });
  if (meals > 0) entries.push({ id: `rh-meals-${month}`, date: `${month}-01`, amount: meals, category: 'Refeição Funcionários' });
  return entries;
}

export const expenseClassifications = Object.freeze({
  costOfSales: 'Custo dos produtos e serviços vendidos',
  selling: 'Despesas com vendas',
  administrative: 'Despesas gerais e administrativas',
  financial: 'Resultado financeiro',
  incomeTax: 'IRPJ / CSLL',
  withdrawal: 'Retirada de sócio (fora da DRE)'
});

export function classifyDreExpense(category) {
  const value = normalizeText(category);

  if (/retirada|distribuicao de lucro|dividendo/.test(value)) return 'withdrawal';
  if (/irpj|csll/.test(value)) return 'incomeTax';
  if (/juros|tarifa banc|iof|encargo financ/.test(value)) return 'financial';
  if (/marketing|publicidade|propaganda|frete|entrega|comissao|venda/.test(value)) return 'selling';
  if (/insumo|fornecedor|ingrediente|embalagem|mercadoria|cmv|materia prima/.test(value)) return 'costOfSales';
  return 'administrative';
}

export function classifyPersonnelExpense(category) {
  const value = normalizeText(category);
  if (/folha\s*fix/.test(value)) return 'fixed';
  if (/folha\s*extra|extra\s*cozinha|motoboy/.test(value)) return 'extra';
  if (/refeicao.*func|alimentacao.*func/.test(value)) return 'meals';
  if (/custo.*pessoal|despesa.*rh|folha.*rh/.test(value)) return 'other';
  return null;
}

function groupEntries(entries) {
  return entries.reduce((groups, entry) => {
    const key = entry.category || 'Sem categoria';
    groups[key] = (groups[key] || 0) + asMoney(entry.amount);
    return groups;
  }, {});
}

/**
 * DRE gerencial mensal seguindo a apresentação por função do CPC 26:
 * receita, custos, despesas operacionais, resultado financeiro, tributos e resultado líquido.
 */
export function calculateMonthlyDre({ month, transactions = [], recurringCosts = [], payrollEntries = [], obligations = [], inventoryCmvSummaries = [] }) {
  const monthTransactions = transactions.filter((transaction) => monthFromDate(transaction.date) === month);
  const revenues = monthTransactions.filter((transaction) => transaction.type === 'receita');
  const automaticRhCategories = new Set(payrollEntries.map((entry) => normalizeText(entry.category).split('|')[0].trim()));
  const automaticRhGroups = new Set(payrollEntries.map((entry) => classifyPersonnelExpense(entry.category)).filter(Boolean));
  const expenses = monthTransactions.filter((transaction) => {
    if (transaction.type !== 'despesa') return false;
    const category = normalizeText(transaction.category || transaction.note);
    const personnelGroup = classifyPersonnelExpense(category);
    return !automaticRhCategories.has(category) && !(personnelGroup && automaticRhGroups.has(personnelGroup));
  });

  const revenueGross = revenues.reduce((total, transaction) => total + asMoney(transaction.amount), 0);
  const revenueDeductions = revenues.reduce((total, transaction) => {
    const gross = asMoney(transaction.amount);
    const net = Number(transaction.net);
    return total + (Number.isFinite(net) ? Math.max(gross - net, 0) : 0);
  }, 0);
  const revenueNet = revenueGross - revenueDeductions;
  const officialRevenue = officialRevenueForCmv(revenues, revenueNet);

  const classifiedExpenses = expenses.map((transaction) => ({
    ...transaction,
    dreClass: classifyDreExpense(transaction.category || transaction.note)
  }));
  const byClass = (dreClass) => classifiedExpenses.filter((entry) => entry.dreClass === dreClass);

  const inventoryCmv = inventoryCmvSummaries.find((summary) => summary.month === month);
  const hasClosedInventoryCmv = inventoryCmv?.status === 'CLOSED' && inventoryCmv.realCmv != null;
  let costOfSalesEntries = hasClosedInventoryCmv
    ? [{ id: `inventory-cmv-${month}`, amount: inventoryCmv.realCmv, category: 'CMV Fechado | Inventário' }]
    : byClass('costOfSales');
  let sellingEntries = byClass('selling');
  let administrativeEntries = byClass('administrative');
  let financialExpenseEntries = byClass('financial');
  let incomeTaxEntries = byClass('incomeTax');
  const withdrawals = byClass('withdrawal');

  const monthObligations = obligations.filter((obligation) => obligation.competenceMonth === month);
  const useObligations = monthObligations.length > 0;
  const obligationEntries = monthObligations.map((obligation) => ({
    amount: obligation.totalAmount,
    category: obligation.description,
    economicCategory: obligation.economicCategory,
    legacyImported: obligation.sourceType === 'IMPORTED_SPREADSHEET'
  }));
  const mealEntries = payrollEntries
    .filter((entry) => monthFromDate(entry.date) === month && /refei[cç][aã]o funcion[aá]rios/i.test(String(entry.category || '')))
    .map((entry) => ({ ...entry, category: 'Refeição Funcionários' }));
  if (useObligations) {
    if (!hasClosedInventoryCmv) costOfSalesEntries = [...costOfSalesEntries, ...obligationEntries.filter((entry) => !entry.legacyImported && entry.economicCategory === 'INSUMO')];
    sellingEntries = [...sellingEntries, ...obligationEntries.filter((entry) => !entry.legacyImported && entry.economicCategory === 'MARKETING')];
    financialExpenseEntries = [...financialExpenseEntries, ...obligationEntries.filter((entry) => !entry.legacyImported && entry.economicCategory === 'FINANCEIRO')];
    incomeTaxEntries = [...incomeTaxEntries, ...obligationEntries.filter((entry) => !entry.legacyImported && entry.economicCategory === 'IMPOSTO')];
  }
  const fixedCosts = useObligations
    ? obligationEntries.filter((entry) => (
      entry.legacyImported
        ? !['FOLHA_FIXA', 'FOLHA_EXTRA', 'REFEICAO'].includes(entry.economicCategory)
        : !['FOLHA_FIXA', 'FOLHA_EXTRA', 'REFEICAO', 'INSUMO', 'MARKETING', 'FINANCEIRO', 'IMPOSTO'].includes(entry.economicCategory)
    ))
    : recurringCosts
      .filter((cost) => String(cost.lastPaidMonth || '') === month)
      .filter((cost) => {
        const personnelGroup = classifyPersonnelExpense(cost.desc);
        return !(personnelGroup && automaticRhGroups.has(personnelGroup));
      })
      .map((cost) => ({ ...cost, category: cost.desc || 'Custo fixo' }));
  const payroll = useObligations
    ? [...monthObligations.filter((obligation) => ['FOLHA_FIXA', 'FOLHA_EXTRA'].includes(obligation.economicCategory)).map((obligation) => ({ amount: obligation.totalAmount, category: obligation.description })), ...mealEntries]
    : payrollEntries
      .filter((entry) => monthFromDate(entry.date) === month)
      .map((entry) => ({ ...entry, category: entry.category || 'Folha / RH' }));

  const grossInputCost = sumBy(costOfSalesEntries);
  const employeeMealCost = sumBy(mealEntries);
  const cmv = calculateCurrentCmv({ grossInputCost, employeeMealCost, officialRevenue, inventorySummary: inventoryCmv });
  if (!hasClosedInventoryCmv) {
    costOfSalesEntries = [{ id: `provisional-cmv-${month}`, amount: cmv.inputCost, category: 'CMV provisório | Insumos líquidos de refeições' }];
  }
  const costOfSales = cmv.inputCost;
  const sellingExpenses = sumBy(sellingEntries);
  const administrativeExpenses = sumBy(administrativeEntries) + sumBy(fixedCosts) + sumBy(payroll);
  const financialExpenses = sumBy(financialExpenseEntries);
  const incomeTaxes = sumBy(incomeTaxEntries);
  const grossProfit = revenueNet - costOfSales;
  const operatingResult = grossProfit - sellingExpenses - administrativeExpenses;
  const profitBeforeIncomeTax = operatingResult - financialExpenses;
  const netIncome = profitBeforeIncomeTax - incomeTaxes;
  const percentageOfNetRevenue = (value) => revenueNet > 0 ? (value / revenueNet) * 100 : 0;

  return {
    month,
    revenueGross,
    revenueDeductions,
    revenueNet,
    officialRevenue,
    costOfSales,
    cmv,
    grossProfit,
    sellingExpenses,
    administrativeExpenses,
    operatingResult,
    financialExpenses,
    profitBeforeIncomeTax,
    incomeTaxes,
    netIncome,
    withdrawals: sumBy(withdrawals),
    margins: {
      gross: percentageOfNetRevenue(grossProfit),
      operating: percentageOfNetRevenue(operatingResult),
      net: percentageOfNetRevenue(netIncome)
    },
    details: {
      costOfSales: groupEntries(costOfSalesEntries),
      cmvCalculation: hasClosedInventoryCmv ? {
        'CMV real por inventário': cmv.inputCost,
        'Faturamento oficial': cmv.officialRevenue
      } : {
        'Gasto com insumos bruto': cmv.grossInputCost,
        '(-) Refeição Funcionários': -cmv.mealDeduction,
        'Gasto com insumos considerado no CMV': cmv.inputCost,
        'Faturamento oficial': cmv.officialRevenue
      },
      selling: groupEntries(sellingEntries),
      administrative: groupEntries([...administrativeEntries, ...fixedCosts, ...payroll]),
      financial: groupEntries(financialExpenseEntries),
      incomeTax: groupEntries(incomeTaxEntries)
    },
    sourceCounts: {
      revenues: revenues.length,
      expenses: expenses.length,
      fixedCosts: fixedCosts.length,
      payroll: payroll.length
    },
    cmvStatus: hasClosedInventoryCmv ? 'CLOSED' : 'PROVISIONAL',
    inventoryCmv: inventoryCmv || null
  };
}
