import { calculateMonthlyDre } from './dreModel.js';
import { filterObligationsByMonth, summarizeObligations } from './financialViewModel.js';

const sum = (rows, key) => rows.reduce((total, row) => total + Number(row?.[key] || 0), 0);

export function buildMonthlyClosingSnapshot({
  month,
  transactions = [],
  recurringCosts = [],
  payrollEntries = [],
  obligations = [],
  reconciliations = [],
  balancePeriods = [],
  inventorySummaries = [],
  today
}) {
  const dre = calculateMonthlyDre({ month, transactions, recurringCosts, payrollEntries, obligations, inventoryCmvSummaries: inventorySummaries });
  const monthReconciliations = reconciliations.filter((row) => String(row.date || '').slice(0, 7) === month);
  const monthObligations = filterObligationsByMonth(obligations, month);
  const payable = summarizeObligations(monthObligations, today ? { today } : undefined);
  const balances = balancePeriods.find((row) => row.competenceMonth === month) || null;
  const inventory = inventorySummaries.find((row) => row.month === month) || null;
  const cashFlow = {
    inflows: sum(monthReconciliations, 'grossRevenue'),
    bankOutflows: sum(monthReconciliations, 'bankOutflow'),
    cashOutflows: sum(monthReconciliations, 'cashOutflow'),
    difference: sum(monthReconciliations.filter((row) => row.cashDifference != null), 'cashDifference'),
    reconciledDays: monthReconciliations.length
  };
  cashFlow.outflows = cashFlow.bankOutflows + cashFlow.cashOutflows;
  cashFlow.net = cashFlow.inflows - cashFlow.outflows;

  const checks = {
    dre: Number.isFinite(dre.netIncome),
    cashFlow: monthReconciliations.length > 0,
    balances: balances?.status === 'CLOSED',
    inventory: inventory?.status === 'CLOSED'
  };

  return {
    month,
    dre,
    payable,
    cashFlow,
    balances,
    inventory,
    checks,
    ready: Object.values(checks).every(Boolean)
  };
}
