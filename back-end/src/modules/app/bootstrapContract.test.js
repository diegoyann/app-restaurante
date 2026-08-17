import assert from 'node:assert/strict';
import test from 'node:test';

import { assembleBootstrapResponse } from './bootstrapResponse.js';

const contractKeys = [
  'aiBehaviorSettings', 'channelSettlements', 'currentUserPermissions', 'customers',
  'dailyCashReconciliations', 'deliveryDrivers', 'discountCategories', 'employeeRoles',
  'employeeWorkLogs', 'employees', 'extraWeeklyClosings', 'financeExpenseCategories',
  'financialClosings', 'financialObligations', 'financialPayments', 'ingredientUnits',
  'ingredients', 'menuCategories', 'menuItems', 'orders', 'paymentMethods', 'payrollAdjustments',
  'payrollConfig', 'preparations', 'products', 'recurringCostDuplicateCandidates',
  'recurringCosts', 'reviews', 'roleProfiles', 'salesChannels', 'settings', 'tenant',
  'transactions'
].sort();

test('bootstrap response preserves every public top-level key and value', () => {
  const bootstrap = Object.fromEntries(
    contractKeys.filter((key) => key !== 'currentUserPermissions').map((key) => [key, `${key}-fixture`])
  );
  const permissions = { finance: true };

  const response = assembleBootstrapResponse(bootstrap, permissions);

  assert.deepEqual(Object.keys(response).sort(), contractKeys);
  assert.deepEqual(response.currentUserPermissions, permissions);
  for (const [key, value] of Object.entries(bootstrap)) assert.equal(response[key], value);
  assert.deepEqual(JSON.parse(JSON.stringify(response)), response);
});
