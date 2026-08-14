import test from 'node:test';
import assert from 'node:assert/strict';
import { getInvalidComboGroup, isPurchasableCombo } from './comboValidation.js';

test('rejeita grupo cujo mínimo supera a capacidade disponível', () => {
  const group = { name: 'Sabores', minSelect: 3, maxSelect: 4, options: [{ maxQty: 2, isAvailable: true }] };
  assert.equal(getInvalidComboGroup([group]), group);
});

test('ignora a capacidade de opções indisponíveis', () => {
  const item = { itemType: 'combo', comboGroups: [{ name: 'Sabores', minSelect: 2, maxSelect: 2, options: [{ maxQty: 2, isAvailable: false }] }] };
  assert.equal(isPurchasableCombo(item), false);
});

test('aceita combo com capacidade suficiente em mais de uma opção', () => {
  const item = { itemType: 'combo', comboGroups: [{ name: 'Sabores', minSelect: 3, maxSelect: 4, options: [{ maxQty: 2 }, { maxQty: 1 }] }] };
  assert.equal(isPurchasableCombo(item), true);
});
