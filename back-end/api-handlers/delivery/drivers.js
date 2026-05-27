import { resolveIdentity, requireTenantAccess } from '../../src/auth/identity.js';
import {
  deleteDeliveryDriverById,
  getTenantBootstrap,
  saveDeliveryDriver
} from '../../src/modules/delivery/index.js';
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
      return sendJson(res, 200, bootstrap.deliveryDrivers);
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const driver = await saveDeliveryDriver(tenantSlug, req.body || {});
      return sendJson(res, req.method === 'POST' ? 201 : 200, driver);
    }

    if (req.method === 'DELETE') {
      const driverId = req.body?.id;
      if (!driverId) throw new Error('id do motoboy é obrigatório.');
      await deleteDeliveryDriverById(tenantSlug, driverId);
      return sendJson(res, 200, { id: driverId });
    }

    return methodNotAllowed(res, ['GET', 'POST', 'PUT', 'DELETE']);
  } catch (error) {
    return sendError(res, error, 400);
  }
}
