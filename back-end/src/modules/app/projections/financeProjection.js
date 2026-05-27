import { ensureOk, supabaseAdmin } from '../../shared/db.js';
import {
  mapFinancialClosing,
  mapPaymentMethod,
  mapRecurringCost,
  mapSimpleName,
  mapTransaction
} from '../../shared/mappers.js';

export async function readFinanceProjection(tenant) {
  const [
    recurringCosts,
    salesChannels,
    financeExpenseCategories,
    transactions,
    paymentMethods,
    financialClosings
  ] = await Promise.all([
    ensureOk(await supabaseAdmin.from('recurring_costs').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: true }), 'Falha ao carregar custos fixos.'),
    ensureOk(await supabaseAdmin.from('sales_channels').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: true }), 'Falha ao carregar canais.'),
    ensureOk(await supabaseAdmin.from('finance_expense_categories').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: true }), 'Falha ao carregar categorias financeiras.'),
    ensureOk(await supabaseAdmin.from('transactions').select('*').eq('tenant_id', tenant.id).order('transaction_date', { ascending: false }), 'Falha ao carregar transações.'),
    ensureOk(await supabaseAdmin.from('payment_methods').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: true }), 'Falha ao carregar formas de pagamento.'),
    ensureOk(await supabaseAdmin.from('financial_closings').select('*').eq('tenant_id', tenant.id).order('period_start', { ascending: false }).order('created_at', { ascending: false }), 'Falha ao carregar fechamentos financeiros.')
  ]);

  return {
    recurringCosts: recurringCosts.map(mapRecurringCost),
    salesChannels: salesChannels.map(mapSimpleName),
    financeExpenseCategories: financeExpenseCategories.map(mapSimpleName),
    transactions: transactions.map(mapTransaction),
    paymentMethods: paymentMethods.map(mapPaymentMethod),
    financialClosings: financialClosings.map(mapFinancialClosing)
  };
}
