import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeComboCategoryNames,
  normalizeComboComponentRefs,
  normalizeComboOptionLinking
} from './menuModel.js';

test('normalizeComboCategoryNames removes blanks and duplicates', () => {
  assert.deepEqual(normalizeComboCategoryNames({
    linkedCategoryNames: ['Esfiha', ' ', 'Bebida', 'Esfiha'],
    linkedCategoryName: 'Pizza'
  }), ['Esfiha', 'Bebida', 'Pizza']);
});

test('normalizeComboOptionLinking persists first selected component ref', () => {
  assert.deepEqual(normalizeComboOptionLinking({
    linkedCategoryNames: ['Esfiha', 'Bebida'],
    linkedComponentRefs: ['menu-item:10', 'menu-item:20']
  }), {
    linkedCategoryNames: ['Esfiha', 'Bebida'],
    linkedCategoryName: 'Esfiha',
    linkedComponentRefs: ['menu-item:10', 'menu-item:20'],
    linkedComponentRef: 'menu-item:10'
  });
});

test('normalizeComboComponentRefs keeps compatibility with old single ref payload', () => {
  assert.deepEqual(normalizeComboComponentRefs({
    linkedComponentRef: 'menu-item:99'
  }), ['menu-item:99']);
});

