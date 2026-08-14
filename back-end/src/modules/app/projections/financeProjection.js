import { ensureOk, supabaseAdmin } from '../../shared/db.js';
import {
  mapFinancialClosing,
  mapPaymentMethod,
  mapRecurringCost,
  mapSalesChannel,
  mapSimpleName,
  mapTransaction
} from '../../shared/mappers.js';
import { ensureFinancialObligationsForTenant, mapFinancialObligation } from '../../finance/obligationsService.js';
import { getChannelSettlements } from '../../finance/settlementService.js';

export async function readFinanceProjection(tenant) {
  await ensureFinancialObligationsForTenant(tenant);
  const channelSettlements = await getChannelSettlements(tenant.slug);
  const [
    recurringCosts,
    salesChannels,
    financeExpenseCategories,
    transactions,
    paymentMethods,
    financialClosings,
    financialObligations,
    financialPayments,
    cashReconciliations,
    duplicateCandidates
  ] = await Promise.all([
    ensureOk(await supabaseAdmin.from('recurring_costs').select('*').eq('tenant_id', tenant.id).eq('active', true).is('merged_into_id', null).order('created_at', { ascending: true }), 'Falha ao carregar custos fixos.'),
    ensureOk(await supabaseAdmin.from('sales_channels').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: true }), 'Falha ao carregar canais.'),
    ensureOk(await supabaseAdmin.from('finance_expense_categories').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: true }), 'Falha ao carregar categorias financeiras.'),
    ensureOk(await supabaseAdmin.from('transactions').select('*').eq('tenant_id', tenant.id).order('transaction_date', { ascending: false }), 'Falha ao carregar transações.'),
    ensureOk(await supabaseAdmin.from('payment_methods').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: true }), 'Falha ao carregar formas de pagamento.'),
    ensureOk(await supabaseAdmin.from('financial_closings').select('*').eq('tenant_id', tenant.id).order('period_start', { ascending: false }).order('created_at', { ascending: false }), 'Falha ao carregar fechamentos financeiros.'),
    ensureOk(await supabaseAdmin.from('financial_obligations').select('*').eq('tenant_id', tenant.id).order('due_date'), 'Falha ao carregar contas a pagar.'),
    ensureOk(await supabaseAdmin.from('financial_payments').select('*').eq('tenant_id', tenant.id).order('payment_date', { ascending: false }), 'Falha ao carregar pagamentos.'),
    ensureOk(await supabaseAdmin.from('daily_cash_reconciliations').select('*').eq('tenant_id', tenant.id).order('reconciliation_date', { ascending: false }), 'Falha ao carregar conferências físicas.'),
    ensureOk(await supabaseAdmin.from('recurring_cost_duplicate_candidates').select('*,left:recurring_costs!recurring_cost_duplicate_candidates_left_cost_id_fkey(description),right:recurring_costs!recurring_cost_duplicate_candidates_right_cost_id_fkey(description)').eq('tenant_id', tenant.id).eq('status', 'PENDING'), 'Falha ao carregar possíveis duplicatas.')
  ]);

  const mapCashReconciliation = (row) => {
    const dayOutflows = transactions.filter((transaction) => transaction.type === 'controle' && transaction.transaction_date === row.reconciliation_date && /saída de (dinheiro|conta)/i.test(String(transaction.category || '')));
    const isCash = (transaction) => transaction.financial_origin === 'CASH' || /saída de dinheiro/i.test(String(transaction.category || ''));
    const cashOutflow = dayOutflows.filter(isCash).reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
    const bankOutflow = dayOutflows.filter((transaction) => !isCash(transaction)).reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
    const expectedClosingCash = Number(row.opening_cash_balance || 0) + Number(row.cash_revenue || 0) - cashOutflow;
    const countedClosingCash = row.counted_closing_cash == null ? null : Number(row.counted_closing_cash);
    return {
      id: row.id, date: row.reconciliation_date, grossRevenue: Number(row.gross_revenue || 0), cashRevenue: Number(row.cash_revenue || 0),
      bankRevenue: Number(row.bank_revenue || 0), receivableRevenue: Number(row.receivable_revenue || 0),
      nonCashRevenue: Number(row.gross_revenue || 0) - Number(row.cash_revenue || 0), openingCashBalance: Number(row.opening_cash_balance || 0),
      cashOutflow, bankOutflow, expectedClosingCash, countedClosingCash,
      cashDifference: countedClosingCash == null ? null : countedClosingCash - expectedClosingCash, observation: row.observation || ''
    };
  };

  return {
    recurringCosts: recurringCosts.map(mapRecurringCost),
    salesChannels: salesChannels.map(mapSalesChannel),
    financeExpenseCategories: financeExpenseCategories.map(mapSimpleName),
    transactions: transactions.map(mapTransaction),
    paymentMethods: paymentMethods.map(mapPaymentMethod),
    financialClosings: financialClosings.map(mapFinancialClosing),
    financialObligations: financialObligations.map((row) => mapFinancialObligation(row)),
    financialPayments: financialPayments.map((row) => ({ id: row.id, obligationId: row.obligation_id, amount: Number(row.amount || 0), paymentDate: row.payment_date, financialOrigin: row.financial_origin, paymentMethod: row.payment_method, observation: row.observation || '' })),
    dailyCashReconciliations: cashReconciliations.map(mapCashReconciliation),
    recurringCostDuplicateCandidates: duplicateCandidates.map((row) => ({ id: row.id, leftCostId: row.left_cost_id, rightCostId: row.right_cost_id, leftName: row.left?.description || '', rightName: row.right?.description || '', reason: row.reason })),
    channelSettlements
  };
}
