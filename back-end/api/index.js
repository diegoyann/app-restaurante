import healthHandler from '../api-handlers/health.js';
import adminBootstrapHandler from '../api-handlers/admin/bootstrap.js';
import adminCompaniesHandler from '../api-handlers/admin/companies.js';
import adminRoleProfilesHandler from '../api-handlers/admin/role-profiles.js';
import adminTenantsHandler from '../api-handlers/admin/tenants.js';
import adminUsersHandler from '../api-handlers/admin/users.js';
import appBootstrapHandler from '../api-handlers/app/bootstrap.js';
import authLoginHandler from '../api-handlers/auth/login.js';
import authSessionHandler from '../api-handlers/auth/session.js';
import catalogIngredientsHandler from '../api-handlers/catalog/ingredients.js';
import catalogPreparationsHandler from '../api-handlers/catalog/preparations.js';
import catalogProductsHandler from '../api-handlers/catalog/products.js';
import catalogUnitsHandler from '../api-handlers/catalog/units.js';
import customersHandler from '../api-handlers/customers/customers.js';
import deliveryDriversHandler from '../api-handlers/delivery/drivers.js';
import paymentMethodsHandler from '../api-handlers/finance/payment-methods.js';
import financeClosingsHandler from '../api-handlers/finance/closings.js';
import financeRecurringCostsHandler from '../api-handlers/finance/recurring-costs.js';
import financeTransactionsHandler from '../api-handlers/finance/transactions.js';
import hrEmployeesHandler from '../api-handlers/hr/employees.js';
import integrationsIfoodOrdersHandler from '../api-handlers/integrations/ifood-orders.js';
import menuCategoriesHandler from '../api-handlers/menu/categories.js';
import menuItemsHandler from '../api-handlers/menu/items.js';
import ordersHandler from '../api-handlers/orders/orders.js';
import payrollConfigHandler from '../api-handlers/payroll/config.js';
import payrollEmployeesHandler from '../api-handlers/payroll/employees.js';
import payrollPreviewHandler from '../api-handlers/payroll/preview.js';
import publicMenuHandler from '../api-handlers/public/menu.js';
import publicCustomersHandler from '../api-handlers/public/customers.js';
import publicOrdersHandler from '../api-handlers/public/orders.js';
import settingsAiBehaviorHandler from '../api-handlers/settings/ai-behavior.js';
import settingsGeneralHandler from '../api-handlers/settings/general.js';
import tenantRoleProfilesHandler from '../api-handlers/tenant/role-profiles.js';

const routes = new Map([
  ['health', healthHandler],
  ['admin/bootstrap', adminBootstrapHandler],
  ['admin/companies', adminCompaniesHandler],
  ['admin/role-profiles', adminRoleProfilesHandler],
  ['admin/tenants', adminTenantsHandler],
  ['admin/users', adminUsersHandler],
  ['app/bootstrap', appBootstrapHandler],
  ['auth/login', authLoginHandler],
  ['auth/session', authSessionHandler],
  ['catalog/ingredients', catalogIngredientsHandler],
  ['catalog/preparations', catalogPreparationsHandler],
  ['catalog/products', catalogProductsHandler],
  ['catalog/units', catalogUnitsHandler],
  ['customers', customersHandler],
  ['delivery/drivers', deliveryDriversHandler],
  ['finance/payment-methods', paymentMethodsHandler],
  ['finance/closings', financeClosingsHandler],
  ['finance/recurring-costs', financeRecurringCostsHandler],
  ['finance/transactions', financeTransactionsHandler],
  ['hr/employees', hrEmployeesHandler],
  ['integrations/ifood/orders', integrationsIfoodOrdersHandler],
  ['menu/categories', menuCategoriesHandler],
  ['menu/items', menuItemsHandler],
  ['orders', ordersHandler],
  ['payroll/config', payrollConfigHandler],
  ['payroll/employees', payrollEmployeesHandler],
  ['payroll/preview', payrollPreviewHandler],
  ['public/menu', publicMenuHandler],
  ['public/customers', publicCustomersHandler],
  ['public/orders', publicOrdersHandler],
  ['settings/ai-behavior', settingsAiBehaviorHandler],
  ['settings/general', settingsGeneralHandler],
  ['tenant/role-profiles', tenantRoleProfilesHandler]
]);

function normalizeRoute(req) {
  const fromQuery = req.query?.route;
  const raw = Array.isArray(fromQuery) ? fromQuery.join('/') : String(fromQuery || '');

  return raw
    .replace(/^\/+/, '')
    .replace(/^api\/?/, '')
    .replace(/\/+$/, '')
    .trim();
}

export default async function handler(req, res) {
  const route = normalizeRoute(req);
  const routeHandler = routes.get(route);

  if (!routeHandler) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Rota não encontrada.' }));
    return;
  }

  return routeHandler(req, res);
}
