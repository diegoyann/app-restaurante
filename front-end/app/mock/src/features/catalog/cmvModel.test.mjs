import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateComponentLineCost,
  calculateRecipeCost,
  convertQuantityBetweenUnits,
  getCompatibleUnits,
  resolveSelectableUnitLabel
} from './cmvModel.js';

const assertMoney = (actual, expected) => {
  assert.equal(Number(actual.toFixed(4)), expected);
};

test('calcula custo de insumo em KG usado em G', () => {
  const { normalizedQuantity, lineCost } = calculateComponentLineCost({
    quantity: 100,
    quantityUnit: 'G',
    componentSourceUnit: 'KG',
    componentUnitCost: 20
  });

  assert.equal(normalizedQuantity, 0.1);
  assertMoney(lineCost, 2);
});

test('calcula custo de insumo em G usado em KG', () => {
  const { normalizedQuantity, lineCost } = calculateComponentLineCost({
    quantity: 0.1,
    quantityUnit: 'KG',
    componentSourceUnit: 'G',
    componentUnitCost: 0.02
  });

  assert.equal(normalizedQuantity, 100);
  assertMoney(lineCost, 2);
});

test('calcula custo de insumo em L usado em ML', () => {
  const { normalizedQuantity, lineCost } = calculateComponentLineCost({
    quantity: 250,
    quantityUnit: 'ML',
    componentSourceUnit: 'L',
    componentUnitCost: 10
  });

  assert.equal(normalizedQuantity, 0.25);
  assertMoney(lineCost, 2.5);
});

test('calcula custo de insumo em ML usado em L', () => {
  const { normalizedQuantity, lineCost } = calculateComponentLineCost({
    quantity: 0.25,
    quantityUnit: 'L',
    componentSourceUnit: 'ML',
    componentUnitCost: 0.01
  });

  assert.equal(normalizedQuantity, 250);
  assertMoney(lineCost, 2.5);
});

test('calcula custo de insumo em UN', () => {
  const { normalizedQuantity, lineCost } = calculateComponentLineCost({
    quantity: 3,
    quantityUnit: 'UN',
    componentSourceUnit: 'UN',
    componentUnitCost: 0.35
  });

  assert.equal(normalizedQuantity, 3);
  assertMoney(lineCost, 1.05);
});

test('converte receita base em KG usada no produto em G', () => {
  const normalizedQuantity = convertQuantityBetweenUnits(70, 'G', 'KG');
  const recipeCost = calculateRecipeCost([
    { quantity: 70, quantityUnit: 'G' }
  ], () => ({
    sourceUnit: 'KG',
    unitCost: 20
  }));

  assert.equal(normalizedQuantity, 0.07);
  assertMoney(recipeCost, 1.4);
});

test('nao converte unidades de grupos diferentes', () => {
  const { normalizedQuantity, lineCost } = calculateComponentLineCost({
    quantity: 2,
    quantityUnit: 'KG',
    componentSourceUnit: 'L',
    componentUnitCost: 10
  });

  assert.equal(normalizedQuantity, 2);
  assertMoney(lineCost, 20);
});

test('resolve unidade selecionavel usando o label cadastrado', () => {
  const units = [
    { id: 'kg', label: 'KG' },
    { id: 'g', label: 'G' },
    { id: 'ml', label: 'ML' }
  ];

  assert.equal(resolveSelectableUnitLabel(units, 'kg'), 'KG');
  assert.equal(resolveSelectableUnitLabel(units, 'G'), 'G');
  assert.equal(resolveSelectableUnitLabel(units, 'l'), '');
});

test('mantem selecao valida em unidades compativeis', () => {
  const units = [
    { id: 'kg', label: 'KG' },
    { id: 'g', label: 'G' },
    { id: 'l', label: 'L' },
    { id: 'ml', label: 'ML' },
    { id: 'un', label: 'UN' }
  ];

  const weightUnits = getCompatibleUnits('kg', units);
  const volumeUnits = getCompatibleUnits('ML', units);

  assert.equal(resolveSelectableUnitLabel(weightUnits, 'g'), 'G');
  assert.equal(resolveSelectableUnitLabel(weightUnits, 'KG'), 'KG');
  assert.equal(resolveSelectableUnitLabel(volumeUnits, 'l'), 'L');
  assert.equal(resolveSelectableUnitLabel(volumeUnits, 'ML'), 'ML');
  assert.equal(resolveSelectableUnitLabel(weightUnits, 'ML'), '');
});
