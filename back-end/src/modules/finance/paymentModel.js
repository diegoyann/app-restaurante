import { normalizeMoney } from '../shared/db.js';

export function requirePaymentDate(value) {
  const paymentDate = String(value || '').trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(paymentDate);
  if (!match) throw new Error('Informe a data real do pagamento.');

  const [, year, month, day] = match.map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() !== month - 1
    || parsed.getUTCDate() !== day
  ) throw new Error('Informe uma data de pagamento válida.');

  return paymentDate;
}

export function calculatePaymentProgress({ totalAmount, previousPaidAmount, paymentAmount }) {
  const total = normalizeMoney(Math.max(Number(totalAmount) || 0, 0));
  const previousPaid = normalizeMoney(Math.max(Number(previousPaidAmount) || 0, 0));
  const payment = normalizeMoney(Math.max(Number(paymentAmount) || 0, 0));
  const paidAmount = normalizeMoney(previousPaid + payment);
  const openAmount = normalizeMoney(Math.max(total - paidAmount, 0));

  return {
    paidAmount,
    openAmount,
    status: openAmount === 0 ? 'PAID' : 'PARTIAL'
  };
}
