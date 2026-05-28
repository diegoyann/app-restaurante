import { createInitialMenuCategories } from '../features/menu/menuModel.js';
import { normalizeGeneralSettings } from '../features/settings/settingsModel.js';

export const DEFAULT_INGREDIENT_UNIT_LABELS = ['KG', 'G', 'ML', 'L', 'UN'];

export function createDefaultIngredientUnits(createUnitId = (label) => `default-unit-${label.toLowerCase()}`) {
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
  if (!normalized) throw new Error(message);
  return normalized;
}

export function createEmptyAppDataState() {
  return {
    settings: normalizeGeneralSettings(null),
    aiBehaviorSettings: {
      positiveTone: 'friendly',
      crisisStrategy: 'whatsapp',
      additionalInstructions: '',
      autoPublishPositive: true
    },
    employeeRoles: [],
    discountCategories: [],
    employees: [],
    payrollConfig: {
      salaryPercentage: 60,
      salaryBusinessDayOrdinal: 5,
      advancePercentage: 40,
      advanceFixedDay: 20,
      advanceBusinessDayPolicy: 'next',
      holidayDates: []
    },
    ingredients: [],
    ingredientUnits: createDefaultIngredientUnits(),
    preparations: [],
    products: [],
    menuCategories: createInitialMenuCategories(),
    menuItems: [],
    recurringCosts: [],
    salesChannels: [],
    financeExpenseCategories: [],
    transactions: [],
    customers: [],
    paymentMethods: [],
    orders: [],
    deliveryDrivers: [],
    financialClosings: [],
    reviews: []
  };
}
