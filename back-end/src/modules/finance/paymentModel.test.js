import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePaymentProgress, requirePaymentDate } from './paymentModel.js';

test('preserva a data real informada, mesmo quando anterior à data de registro', () => {
  assert.equal(requirePaymentDate('2026-08-10'), '2026-08-10');
});

test('não aceita ausência ou data impossível como data definitiva do pagamento', () => {
  assert.throws(() => requirePaymentDate(''), /data real do pagamento/i);
  assert.throws(() => requirePaymentDate('2026-02-30'), /data de pagamento válida/i);
});

test('pagamento parcial atualiza pago, aberto e status', () => {
  assert.deepEqual(calculatePaymentProgress({ totalAmount: 1000, previousPaidAmount: 0, paymentAmount: 400 }), {
    paidAmount: 400,
    openAmount: 600,
    status: 'PARTIAL'
  });
});

test('pagamento integral encerra o saldo como pago', () => {
  assert.deepEqual(calculatePaymentProgress({ totalAmount: 1000, previousPaidAmount: 400, paymentAmount: 600 }), {
    paidAmount: 1000,
    openAmount: 0,
    status: 'PAID'
  });
});
