import healthHandler from '../api-handlers/health.js';
import adminBootstrapHandler from '../api-handlers/admin/bootstrap.js';
import adminTenantsHandler from '../api-handlers/admin/tenants.js';
import adminUsersHandler from '../api-handlers/admin/users.js';
import appBootstrapHandler from '../api-handlers/app/bootstrap.js';
import authLoginHandler from '../api-handlers/auth/login.js';
import authSessionHandler from '../api-handlers/auth/session.js';
import financeRecurringCostsHandler from '../api-handlers/finance/recurring-costs.js';
import financeTransactionsHandler from '../api-handlers/finance/transactions.js';
import hrEmployeesHandler from '../api-handlers/hr/employees.js';
import payrollConfigHandler from '../api-handlers/payroll/config.js';
import payrollEmployeesHandler from '../api-handlers/payroll/employees.js';
import payrollPreviewHandler from '../api-handlers/payroll/preview.js';
import settingsAiBehaviorHandler from '../api-handlers/settings/ai-behavior.js';
import settingsGeneralHandler from '../api-handlers/settings/general.js';

const routes = new Map([
  ['health', healthHandler],
  ['admin/bootstrap', adminBootstrapHandler],
  ['admin/tenants', adminTenantsHandler],
  ['admin/users', adminUsersHandler],
  ['app/bootstrap', appBootstrapHandler],
  ['auth/login', authLoginHandler],
  ['auth/session', authSessionHandler],
  ['finance/recurring-costs', financeRecurringCostsHandler],
  ['finance/transactions', financeTransactionsHandler],
  ['hr/employees', hrEmployeesHandler],
  ['payroll/config', payrollConfigHandler],
  ['payroll/employees', payrollEmployeesHandler],
  ['payroll/preview', payrollPreviewHandler],
  ['settings/ai-behavior', settingsAiBehaviorHandler],
  ['settings/general', settingsGeneralHandler]
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
