import { createInitialMenuCategories } from '../features/menu/menuModel.js';
import { normalizeGeneralSettings } from '../features/settings/settingsModel.js';

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
    ingredientUnits: [],
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
