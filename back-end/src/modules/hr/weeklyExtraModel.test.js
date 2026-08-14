import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateWeeklyExtraTotals, resolveWorkLogAmounts, weeklyExtraPayment, weeklyPeriodForDate } from './weeklyExtraModel.js';

test('extra cozinha acumula somente snapshots das diárias trabalhadas', () => {
  const logs = [{ worked: true, dailyRate: 70, mealCost: 15 }, { worked: true, dailyRate: 70, mealCost: 15 }, { worked: false, dailyRate: 70 }];
  assert.equal(weeklyExtraPayment(logs), 140);
  assert.deepEqual(calculateWeeklyExtraTotals(logs), { dailyRates: 140, deliveryFees: 0, meals: 30 });
});

test('motoboy acumula diárias e taxas sem incluir refeição no pagamento', () => {
  const logs = [{ worked: true, daily_rate: 120, delivery_fee: 80, meal_cost: 15 }, { worked: true, daily_rate: 120, delivery_fee: 100, meal_cost: 15 }];
  assert.equal(weeklyExtraPayment(logs), 420);
  assert.equal(calculateWeeklyExtraTotals(logs).meals, 30);
});

test('presença histórica de cozinha recalcula 140 para 210 e volta para 140', () => {
  const twoDays = [
    { worked: true, dailyRate: 70, mealCost: 15 },
    { worked: true, dailyRate: 70, mealCost: 15 }
  ];
  const threeDays = [{ worked: true, dailyRate: 70, mealCost: 15 }, ...twoDays];
  assert.deepEqual(calculateWeeklyExtraTotals(twoDays), { dailyRates: 140, deliveryFees: 0, meals: 30 });
  assert.deepEqual(calculateWeeklyExtraTotals(threeDays), { dailyRates: 210, deliveryFees: 0, meals: 45 });
  assert.deepEqual(calculateWeeklyExtraTotals([{ ...threeDays[0], worked: false }, ...twoDays]), { dailyRates: 140, deliveryFees: 0, meals: 30 });
});

test('presença histórica de motoboy preserva taxas e exclui refeição do pagamento', () => {
  const before = [{ worked: true, dailyRate: 60, deliveryFee: 80, mealCost: 15 }];
  const after = [{ worked: true, dailyRate: 60, deliveryFee: 25, mealCost: 15 }, ...before];
  assert.equal(weeklyExtraPayment(before), 140);
  assert.equal(weeklyExtraPayment(after), 225);
  assert.equal(calculateWeeklyExtraTotals(after).meals, 30);
});

test('registro desmarcado preserva snapshots mas não entra em nenhum total', () => {
  const totals = calculateWeeklyExtraTotals([{ worked: false, dailyRate: 70, deliveryFee: 25, mealCost: 15 }]);
  assert.deepEqual(totals, { dailyRates: 0, deliveryFees: 0, meals: 0 });
  assert.equal(weeklyExtraPayment([{ worked: false, dailyRate: 70, deliveryFee: 25, mealCost: 15 }]), 0);
});

test('11/08/2026 pertence somente à semana de segunda 10/08 a domingo 16/08', () => {
  assert.deepEqual(weeklyPeriodForDate('2026-08-11'), { periodStart: '2026-08-10', periodEnd: '2026-08-16' });
});

test('remarcar presença restaura diária 70 e refeição 15 quando o registro antigo foi zerado', () => {
  assert.deepEqual(resolveWorkLogAmounts({
    payload: { worked: true },
    current: { daily_rate: 0, meal_cost: 0, delivery_fee: 0 },
    config: { extraKitchenDailyRate: 70, extraMotoboyDailyRate: 60, mealCostPerWorkday: 15 },
    isExternal: true,
    isDelivery: false
  }), { dailyRate: 70, mealCost: 15, deliveryFee: 0 });
});
