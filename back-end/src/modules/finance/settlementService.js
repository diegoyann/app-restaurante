import { ensureOk, getTenantRowBySlug, maybeSingle, supabaseAdmin } from '../shared/db.js';
import { saveTransaction } from './repository.js';
import { aggregateWeeklySettlements } from './settlementModel.js';

const map = (row) => {
  const today = new Date().toISOString().slice(0, 10);
  const dueSoon = new Date(); dueSoon.setDate(dueSoon.getDate() + 7);
  const status = row.status === 'RECEIVED' ? 'RECEIVED' : row.expected_date < today ? 'OVERDUE' : row.expected_date <= dueSoon.toISOString().slice(0, 10) ? 'DUE_SOON' : 'EXPECTED';
  return { id: row.id, salesChannelId: row.sales_channel_id, channelName: row.sales_channels?.name || '', periodStart: row.period_start, periodEnd: row.period_end, grossAmount: Number(row.gross_amount || 0), feeAmount: Number(row.fee_amount || 0), netAmount: Number(row.net_amount || 0), expectedDate: row.expected_date, receivedDate: row.received_date || '', status, bankTransactionId: row.bank_transaction_id || '' };
};

export async function ensureChannelSettlementsForTenant(tenant) {
  const channels = ensureOk(await supabaseAdmin.from('sales_channels').select('*').eq('tenant_id', tenant.id).eq('active', true).eq('settlement_type', 'SCHEDULED').eq('settlement_frequency', 'WEEKLY'), 'Falha ao carregar canais com repasse.');
  const rows = [];
  for (const channel of channels) {
    const transactions = ensureOk(await supabaseAdmin.from('transactions').select('*').eq('tenant_id', tenant.id).eq('source_type', 'DAILY_REVENUE').eq('financial_origin', 'RECEIVABLE').ilike('platform', channel.name), 'Falha ao carregar vendas para repasse.');
    rows.push(...transactions.map((transaction) => ({ ...transaction, sales_channel_id: channel.id })));
  }
  for (const settlement of aggregateWeeklySettlements(rows)) {
    const previous = maybeSingle(await supabaseAdmin.from('channel_settlements').select('*').eq('tenant_id', tenant.id).eq('sales_channel_id', settlement.salesChannelId).eq('period_start', settlement.periodStart).eq('period_end', settlement.periodEnd).maybeSingle(), 'Falha ao verificar repasse existente.');
    ensureOk(await supabaseAdmin.from('channel_settlements').upsert({ id: previous?.id || undefined, tenant_id: tenant.id, sales_channel_id: settlement.salesChannelId, period_start: settlement.periodStart, period_end: settlement.periodEnd, gross_amount: settlement.grossAmount, fee_amount: settlement.feeAmount, net_amount: settlement.netAmount, expected_date: settlement.expectedDate, received_date: previous?.received_date || null, status: previous?.status || 'EXPECTED', bank_transaction_id: previous?.bank_transaction_id || null }, { onConflict: 'tenant_id,sales_channel_id,period_start,period_end' }), 'Falha ao gerar repasse semanal.');
  }
}

export async function getChannelSettlements(tenantSlug) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  await ensureChannelSettlementsForTenant(tenant);
  const rows = ensureOk(await supabaseAdmin.from('channel_settlements').select('*,sales_channels(name)').eq('tenant_id', tenant.id).order('expected_date', { ascending: false }), 'Falha ao carregar repasses.');
  return rows.map(map);
}

export async function receiveChannelSettlement(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const settlement = maybeSingle(await supabaseAdmin.from('channel_settlements').select('*,sales_channels(name)').eq('tenant_id', tenant.id).eq('id', payload.id).maybeSingle(), 'Falha ao carregar repasse.');
  if (!settlement) throw new Error('Repasse não encontrado.');
  const transaction = await saveTransaction(tenantSlug, { date: payload.receivedDate, platform: settlement.sales_channels?.name || 'iFood', payment: 'transferência', amount: Number(payload.amount ?? settlement.net_amount), tax: 0, net: Number(payload.amount ?? settlement.net_amount), type: 'controle', category: 'Entrada de recebível', note: `Repasse ${settlement.period_start} a ${settlement.period_end}`, financialOrigin: 'BANK', sourceType: 'CHANNEL_SETTLEMENT', sourceId: settlement.id });
  const row = ensureOk(await supabaseAdmin.from('channel_settlements').update({ received_date: payload.receivedDate, status: 'RECEIVED', bank_transaction_id: transaction.id }).eq('tenant_id', tenant.id).eq('id', settlement.id).select('*,sales_channels(name)').single(), 'Falha ao confirmar recebimento do repasse.');
  return map(row);
}
