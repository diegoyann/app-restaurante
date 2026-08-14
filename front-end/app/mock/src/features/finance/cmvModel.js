const amount = (value) => Math.abs(Number(value) || 0);
const money = (value) => Math.round(Math.max(Number(value) || 0, 0) * 100) / 100;

export const CMV_OFFICIAL_REVENUE_CATEGORY = 'CMV | Receita oficial';
export const CMV_INPUT_CATEGORY = 'CMV | Insumo';

export function officialRevenueForCmv(revenues = [], fallbackRevenue = 0) {
  const officialEntries = revenues.filter((entry) => entry.category === CMV_OFFICIAL_REVENUE_CATEGORY);
  if (officialEntries.length === 0) return money(fallbackRevenue);
  return money(officialEntries.reduce((total, entry) => (
    total + amount(Number.isFinite(Number(entry.net)) ? entry.net : entry.amount)
  ), 0));
}

/** Fonte única da fórmula vigente de CMV. O desconto de refeições é exclusivo do modelo provisório. */
export function calculateCurrentCmv({ grossInputCost = 0, employeeMealCost = 0, officialRevenue = 0, inventorySummary = null }) {
  const isClosed = inventorySummary?.status === 'CLOSED' && inventorySummary.realCmv != null;
  const inputGross = money(grossInputCost);
  const meals = money(employeeMealCost);
  const revenue = money(officialRevenue);
  const inputCost = isClosed ? money(inventorySummary.realCmv) : money(inputGross - meals);
  return {
    status: isClosed ? 'CLOSED' : 'PROVISIONAL',
    officialRevenue: revenue,
    grossInputCost: inputGross,
    employeeMealCost: meals,
    mealDeduction: isClosed ? 0 : Math.min(meals, inputGross),
    inputCost,
    percentage: revenue > 0 ? (inputCost / revenue) * 100 : 0,
    inventorySummary: isClosed ? inventorySummary : null
  };
}
