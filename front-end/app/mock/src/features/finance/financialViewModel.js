const ISO_MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

export function isValidMonth(value) {
  const match = ISO_MONTH_PATTERN.exec(String(value || ''));
  if (!match) return false;
  const month = Number(match[2]);
  return month >= 1 && month <= 12;
}

export function filterTransactionsByMonth(transactions = [], month) {
  if (!isValidMonth(month)) return [];
  return transactions.filter((transaction) => String(transaction.date || '').slice(0, 7) === month);
}

export function filterObligationsByMonth(obligations = [], month) {
  if (!isValidMonth(month)) return [];
  return obligations.filter((obligation) => obligation.competenceMonth === month);
}

export function summarizeObligations(obligations = [], { today = new Date().toISOString().slice(0, 10) } = {}) {
  const open = obligations.filter((item) => !['PAID', 'CANCELLED'].includes(item.status));
  const reference = new Date(`${today}T12:00:00`);
  const next7 = new Date(reference);
  next7.setDate(next7.getDate() + 7);
  const next30 = new Date(reference);
  next30.setDate(next30.getDate() + 30);
  const next7Iso = next7.toISOString().slice(0, 10);
  const next30Iso = next30.toISOString().slice(0, 10);
  const sumOpen = (items) => items.reduce((sum, item) => sum + Number(item.openAmount || 0), 0);

  return {
    open: sumOpen(open),
    overdue: sumOpen(open.filter((item) => item.dueDate < today)),
    next7: sumOpen(open.filter((item) => item.dueDate >= today && item.dueDate <= next7Iso)),
    next30: sumOpen(open.filter((item) => item.dueDate >= today && item.dueDate <= next30Iso)),
    paid: obligations.filter((item) => item.status === 'PAID').reduce((sum, item) => sum + Number(item.paidAmount || 0), 0)
  };
}

export function describeTransactionType(transaction) {
  if (transaction?.type === 'receita') return { label: 'Entrada', sign: '+', tone: 'income' };
  if (transaction?.type === 'controle') return { label: 'Controle / Conferência', sign: '', tone: 'control' };
  return { label: 'Saída', sign: '-', tone: 'expense' };
}
