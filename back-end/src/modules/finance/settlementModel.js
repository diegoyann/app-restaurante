const iso = (date) => date.toISOString().slice(0, 10);
const money = (value) => Math.round((Number(value) || 0) * 100) / 100;

export function weeklySettlementPeriod(saleDate) {
  const date = new Date(`${saleDate}T12:00:00Z`);
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  const start = new Date(date); start.setUTCDate(date.getUTCDate() - mondayOffset);
  const end = new Date(start); end.setUTCDate(start.getUTCDate() + 6);
  const expected = new Date(end); expected.setUTCDate(end.getUTCDate() + 3);
  return { periodStart: iso(start), periodEnd: iso(end), expectedDate: iso(expected) };
}

export function aggregateWeeklySettlements(transactions = []) {
  const grouped = new Map();
  for (const transaction of transactions) {
    const period = weeklySettlementPeriod(transaction.transaction_date ?? transaction.date);
    const channelId = transaction.sales_channel_id ?? transaction.salesChannelId;
    const key = `${channelId}:${period.periodStart}`;
    const current = grouped.get(key) || { salesChannelId: channelId, ...period, grossAmount: 0, feeAmount: 0, netAmount: 0 };
    current.grossAmount += Number(transaction.amount || 0);
    current.netAmount += Number(transaction.net_amount ?? transaction.net ?? 0);
    current.feeAmount = current.grossAmount - current.netAmount;
    grouped.set(key, current);
  }
  return [...grouped.values()].map((item) => ({ ...item, grossAmount: money(item.grossAmount), feeAmount: money(item.feeAmount), netAmount: money(item.netAmount) }));
}
