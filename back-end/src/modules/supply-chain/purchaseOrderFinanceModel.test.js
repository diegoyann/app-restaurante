import test from 'node:test';
import assert from 'node:assert/strict';
import { purchaseObligationAmounts, purchaseOrderCanBeEdited } from './purchaseOrderFinanceModel.js';

test('pedido previsto soma quantidade por preço unitário', () => {
  assert.equal(purchaseObligationAmounts({ items: [{ orderedQuantity: 2, estimatedUnitPrice: 50 }, { orderedQuantity: 3, estimatedUnitPrice: 20 }] }).forecastAmount, 160);
});

test('recebimento total substitui a previsão pelo valor real na mesma obrigação', () => {
  assert.deepEqual(purchaseObligationAmounts({ orderStatus: 'RECEIVED', items: [{ orderedQuantity: 5, estimatedUnitPrice: 100 }], receipts: [{ status: 'ACTIVE', totalAmount: 527 }] }), {
    forecastAmount: 500, finalAmount: 527, currentAmount: 527, receivedAmount: 527
  });
});

test('pedido com recebimento ativo não pode ser editado livremente', () => {
  assert.equal(purchaseOrderCanBeEdited({ status: 'AWAITING_DELIVERY', receipts: [] }), true);
  assert.equal(purchaseOrderCanBeEdited({ status: 'AWAITING_DELIVERY', receipts: [{ status: 'ACTIVE' }] }), false);
});
