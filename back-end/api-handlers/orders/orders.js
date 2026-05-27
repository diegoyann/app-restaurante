import { resolveIdentity, requireTenantAccess } from '../../src/auth/identity.js';
import {
  deleteOrderById,
  getTenantBootstrap,
  saveOrder
} from '../../src/modules/orders/index.js';
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
      return sendJson(res, 200, bootstrap.orders);
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const order = await saveOrder(tenantSlug, req.body || {});
      return sendJson(res, req.method === 'POST' ? 201 : 200, order);
    }

    if (req.method === 'DELETE') {
      const orderId = req.body?.id;
      if (!orderId) throw new Error('id do pedido é obrigatório.');
      await deleteOrderById(tenantSlug, orderId);
      return sendJson(res, 200, { id: orderId });
    }

    return methodNotAllowed(res, ['GET', 'POST', 'PUT', 'DELETE']);
  } catch (error) {
    return sendError(res, error, 400);
  }
}
