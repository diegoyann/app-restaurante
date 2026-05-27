import { resolveIdentity, requireTenantAccess } from '../../src/auth/identity.js';
import {
  deleteCustomerById,
  getTenantBootstrap,
  saveCustomer
} from '../../src/modules/customers/index.js';
import {
  badRequest,
  getTenantSlug,
  handleOptions,
  methodNotAllowed,
  sendError,
  sendJson
} from '../_shared/http.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  const tenantSlug = getTenantSlug(req);
  if (!tenantSlug) return badRequest(res, 'Informe o tenant na query ?tenant=slug.');

  try {
    const identity = await resolveIdentity(req);
    requireTenantAccess(identity, tenantSlug, ['tenant_admin', 'tenant_staff']);

    if (req.method === 'GET') {
      const bootstrap = await getTenantBootstrap(tenantSlug);
      return sendJson(res, 200, bootstrap.customers);
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const customer = await saveCustomer(tenantSlug, req.body || {});
      return sendJson(res, req.method === 'POST' ? 201 : 200, customer);
    }

    if (req.method === 'DELETE') {
      const customerId = req.body?.id;
      if (!customerId) throw new Error('id do cliente é obrigatório.');
      await deleteCustomerById(tenantSlug, customerId);
      return sendJson(res, 200, { id: customerId });
    }

    return methodNotAllowed(res, ['GET', 'POST', 'PUT', 'DELETE']);
  } catch (error) {
    return sendError(res, error, 400);
  }
}
