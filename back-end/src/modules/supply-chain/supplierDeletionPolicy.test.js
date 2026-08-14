import test from 'node:test';
import assert from 'node:assert/strict';
import { supplierDeletionMode } from './supplierDeletionPolicy.js';

test('exclui permanentemente fornecedor sem histórico de compras', () => {
  assert.equal(supplierDeletionMode({ orderCount: 0, priceHistoryCount: 0 }), 'PERMANENT');
});

test('arquiva fornecedor quando existem pedidos ou histórico de preços', () => {
  assert.equal(supplierDeletionMode({ orderCount: 1 }), 'ARCHIVE');
  assert.equal(supplierDeletionMode({ priceHistoryCount: 1 }), 'ARCHIVE');
});
