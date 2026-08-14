import { calculateCurrentCmv, CMV_INPUT_CATEGORY, CMV_OFFICIAL_REVENUE_CATEGORY, officialRevenueForCmv } from './cmvModel.js';

const asNumber = (value) => Math.abs(Number(value) || 0);

const monthFromDate = (value) => String(value || '').slice(0, 7);
export { CMV_INPUT_CATEGORY, CMV_OFFICIAL_REVENUE_CATEGORY } from './cmvModel.js';

export function calculateCashCmv({ month, transactions = [], obligations = [], payrollEntries = [], inventoryCmvSummaries = [] }) {
  const entries = transactions.filter((transaction) => monthFromDate(transaction.date) === month);
  const revenueEntries = entries.filter((transaction) => (
    transaction.type === 'receita'
    && transaction.category === CMV_OFFICIAL_REVENUE_CATEGORY
  ));
  const inputEntries = entries.filter((transaction) => (
    transaction.type === 'despesa'
    && (transaction.economicCategory === 'INSUMO' || transaction.category === CMV_INPUT_CATEGORY || /(^|\|)\s*insumo/i.test(String(transaction.category || '')))
  ));
  const inputObligations = obligations.filter((obligation) => obligation.competenceMonth === month && obligation.economicCategory === 'INSUMO');

  const allRevenues = entries.filter((transaction) => transaction.type === 'receita');
  const fallbackRevenue = allRevenues.reduce((total, transaction) => total + asNumber(Number.isFinite(Number(transaction.net)) ? transaction.net : transaction.amount), 0);
  const revenue = officialRevenueForCmv(allRevenues, fallbackRevenue);
  const provisionalInputCost = inputEntries.reduce((total, transaction) => total + asNumber(transaction.amount), 0)
    + inputObligations.reduce((total, obligation) => total + asNumber(obligation.totalAmount), 0);
  const inventorySummary = inventoryCmvSummaries.find((summary) => summary.month === month && summary.status === 'CLOSED' && summary.realCmv != null);
  const employeeMealCost = payrollEntries
    .filter((entry) => monthFromDate(entry.date) === month && /refei[cç][aã]o funcion[aá]rios/i.test(String(entry.category || '')))
    .reduce((total, entry) => total + asNumber(entry.amount), 0);
  const cmv = calculateCurrentCmv({ grossInputCost: provisionalInputCost, employeeMealCost, officialRevenue: revenue, inventorySummary });

  return {
    month,
    revenue: cmv.officialRevenue,
    inputCost: cmv.inputCost,
    grossInputCost: cmv.grossInputCost,
    employeeMealCost: cmv.employeeMealCost,
    mealDeduction: cmv.mealDeduction,
    percentage: cmv.percentage,
    revenueEntries,
    inputEntries,
    inputObligations,
    inventorySummary: cmv.inventorySummary,
    status: cmv.status
  };
}

export function isCashControlEntry(transaction) {
  return transaction.type === 'controle';
}
