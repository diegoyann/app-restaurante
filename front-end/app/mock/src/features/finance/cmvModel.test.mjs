import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCurrentCmv } from './cmvModel.js';

test('CMV provisório usa insumos menos refeições sobre faturamento oficial', () => {
  const cmv = calculateCurrentCmv({ grossInputCost: 25000, employeeMealCost: 600, officialRevenue: 62000 });
  assert.equal(cmv.status, 'PROVISIONAL');
  assert.equal(cmv.inputCost, 24400);
  assert.equal(cmv.mealDeduction, 600);
  assert.equal(Number(cmv.percentage.toFixed(2)), 39.35);
});

test('CMV real por estoque não sofre desconto de refeição', () => {
  const cmv = calculateCurrentCmv({
    grossInputCost: 25000,
    employeeMealCost: 600,
    officialRevenue: 62000,
    inventorySummary: { status: 'CLOSED', realCmv: 24000 }
  });
  assert.equal(cmv.status, 'CLOSED');
  assert.equal(cmv.inputCost, 24000);
  assert.equal(cmv.mealDeduction, 0);
});

test('dedução de refeição nunca torna a base provisória negativa', () => {
  const cmv = calculateCurrentCmv({ grossInputCost: 100, employeeMealCost: 150, officialRevenue: 1000 });
  assert.equal(cmv.inputCost, 0);
  assert.equal(cmv.mealDeduction, 100);
});
