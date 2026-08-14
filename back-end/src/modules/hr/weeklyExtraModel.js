export function calculateWeeklyExtraTotals(logs = []) {
  return logs.filter((log) => log.worked !== false).reduce((totals, log) => ({
    dailyRates: Math.round((totals.dailyRates + Number(log.dailyRate ?? log.daily_rate ?? 0)) * 100) / 100,
    deliveryFees: Math.round((totals.deliveryFees + Number(log.deliveryFee ?? log.delivery_fee ?? 0)) * 100) / 100,
    meals: Math.round((totals.meals + Number(log.mealCost ?? log.meal_cost ?? 0)) * 100) / 100
  }), { dailyRates: 0, deliveryFees: 0, meals: 0 });
}

export function weeklyExtraPayment(logs = []) {
  const totals = calculateWeeklyExtraTotals(logs);
  return Math.round((totals.dailyRates + totals.deliveryFees) * 100) / 100;
}

export function weeklyPeriodForDate(date) {
  const value = new Date(`${date}T12:00:00`);
  const weekday = value.getDay() || 7;
  value.setDate(value.getDate() - weekday + 1);
  const periodStart = value.toISOString().slice(0, 10);
  value.setDate(value.getDate() + 6);
  return { periodStart, periodEnd: value.toISOString().slice(0, 10) };
}

const money = (value) => Math.round(Math.max(Number(value) || 0, 0) * 100) / 100;

export function resolveWorkLogAmounts({ payload = {}, current = null, config, isExternal, isDelivery }) {
  const defaultRate = isExternal ? (isDelivery ? config.extraMotoboyDailyRate : config.extraKitchenDailyRate) : 0;
  return {
    dailyRate: money(payload.dailyRate ?? (Number(current?.daily_rate) > 0 ? current.daily_rate : defaultRate)),
    mealCost: money(payload.mealCost ?? (Number(current?.meal_cost) > 0 ? current.meal_cost : config.mealCostPerWorkday)),
    deliveryFee: isDelivery ? money(payload.deliveryFee ?? current?.delivery_fee) : 0
  };
}
