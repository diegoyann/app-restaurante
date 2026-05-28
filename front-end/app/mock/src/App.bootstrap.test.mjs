import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  assertIngredientUnitLabel,
  createDefaultIngredientUnits
} from './mocks/appStateDefaults.js';

const currentDir = dirname(fileURLToPath(import.meta.url));

test('tenant dashboard uses real transaction data instead of seeded revenue chart mock', async () => {
  const appSource = await readFile(join(currentDir, 'App.jsx'), 'utf8');

  assert.match(appSource, /const USE_REVENUE_CHART_MOCK = false;/);
});

test('product cards expose edit flow through a product modal', async () => {
  const appSource = await readFile(join(currentDir, 'App.jsx'), 'utf8');

  assert.match(appSource, /const ProductModal = \(/);
  assert.match(appSource, /const handleEditProduct = \(product\) =>/);
  assert.match(appSource, /onClick=\{\(\) => handleEditProduct\(product\)\}/);
  assert.match(appSource, /<Edit size=\{11\} \/> Editar/);
});

test('menu item price syncs from a single linked CMV product', async () => {
  const appSource = await readFile(join(currentDir, 'App.jsx'), 'utf8');
  const menuComponentsSource = await readFile(join(currentDir, 'features/menu/MenuComponents.jsx'), 'utf8');

  assert.match(appSource, /linkedComponentIds: component \? \[componentKey\] : \[\]/);
  assert.match(appSource, /priceEditable: false/);
  assert.match(appSource, /catalogApi\.saveProduct\(tenantSlug/);
  assert.match(menuComponentsSource, /Preço do CMV/);
  assert.match(menuComponentsSource, /Editar preço/);
});

test('ingredient units are fixed and normalized', async () => {
  assert.deepEqual(createDefaultIngredientUnits().map((unit) => unit.label), ['KG', 'G', 'ML', 'L', 'UN']);
  assert.equal(assertIngredientUnitLabel('kg'), 'KG');
  assert.equal(assertIngredientUnitLabel('un'), 'UN');
  assert.throws(() => assertIngredientUnitLabel('CX'), /Unidade inválida/);

  const appSource = await readFile(join(currentDir, 'App.jsx'), 'utf8');

  assert.doesNotMatch(appSource, /Cadastrar Unidades/);
  assert.doesNotMatch(appSource, /const UnitModal =/);
});
