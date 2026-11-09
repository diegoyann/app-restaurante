import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveFinanceExpenseCategories } from './financeProjection.js';

const expectedDefaultNames = [
  'Compra de Insumos',
  'Fornecedor',
  'Manutenção',
  'Marketing',
  'Imposto',
  'Retirada',
  'Outras Saídas'
];

test('oferece categorias padrão quando o tenant não possui cadastro', () => {
  const categories = resolveFinanceExpenseCategories([]);

  assert.equal(categories.length, 7);
  assert.deepEqual(categories.map((category) => category.name), expectedDefaultNames);
  assert.equal(new Set(categories.map((category) => category.id)).size, 7);
});

test('preserva exatamente as categorias próprias do tenant', () => {
  const rows = [
    { id: 'custom-2', name: 'Combustível' },
    { id: 'custom-1', name: 'Gás' }
  ];

  assert.deepEqual(resolveFinanceExpenseCategories(rows), rows);
});

test('retorna cópias independentes das categorias padrão entre requests', () => {
  const first = resolveFinanceExpenseCategories([]);
  first[0].name = 'Mutação indevida';

  const second = resolveFinanceExpenseCategories([]);
  assert.equal(second[0].name, 'Compra de Insumos');
});
