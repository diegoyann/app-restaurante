export const DEFAULT_INGREDIENT_UNIT_LABELS = ['KG', 'G', 'ML', 'L', 'UN'];

export function createFixedIngredientUnits(createUnitId = (label) => `fixed-unit-${label.toLowerCase()}`) {
  return DEFAULT_INGREDIENT_UNIT_LABELS.map((label) => ({
    id: createUnitId(label),
    label
  }));
}

export function normalizeIngredientUnitLabel(label) {
  const normalized = String(label || '').trim().toUpperCase();
  return DEFAULT_INGREDIENT_UNIT_LABELS.find((unit) => unit === normalized) || '';
}

export function assertIngredientUnitLabel(label, message = 'Unidade inválida.') {
  const normalized = normalizeIngredientUnitLabel(label);
  if (!normalized) {
    const error = new Error(message);
    error.statusCode = 400;
    throw error;
  }
  return normalized;
}
