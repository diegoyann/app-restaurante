const money = (value) => Math.round(Math.max(Number(value) || 0, 0) * 100) / 100;

export function buildDailyRevenue({ date, batchId, channels = [], entries = [] }) {
  const channelById = new Map(channels.map((channel) => [String(channel.id), channel]));
  const rows = [];
  let grossRevenue = 0;
  let cashRevenue = 0;
  let bankRevenue = 0;
  let receivableRevenue = 0;
  for (const entry of entries) {
    const channel = channelById.get(String(entry.channelId));
    if (!channel) throw new Error('Canal de venda inválido.');
    const cash = money(entry.cash);
    const online = money(entry.online);
    if (cash > 0) rows.push({ date, platform: channel.name, payment: 'dinheiro', amount: cash, tax: 0, net: cash, type: 'receita', category: 'Venda diária', financialOrigin: 'CASH', sourceType: 'DAILY_REVENUE', sourceId: `${batchId}:${channel.id}:CASH`, batchId });
    if (online > 0) {
      const taxPercent = money(channel.fee_percent ?? channel.feePercent);
      const fee = money(online * taxPercent / 100);
      const scheduled = (channel.settlement_type ?? channel.settlementType) === 'SCHEDULED';
      rows.push({ date, platform: channel.name, payment: 'online', amount: online, tax: fee, net: money(online - fee), type: 'receita', category: 'Venda diária', financialOrigin: scheduled ? 'RECEIVABLE' : 'BANK', sourceType: 'DAILY_REVENUE', sourceId: `${batchId}:${channel.id}:${scheduled ? 'RECEIVABLE' : 'BANK'}`, batchId });
      if (scheduled) receivableRevenue += online; else bankRevenue += online;
    }
    grossRevenue += cash + online;
    cashRevenue += cash;
  }
  if (grossRevenue <= 0) throw new Error('Informe pelo menos um valor de venda.');
  return { rows, totals: { grossRevenue: money(grossRevenue), cashRevenue: money(cashRevenue), bankRevenue: money(bankRevenue), receivableRevenue: money(receivableRevenue) } };
}
