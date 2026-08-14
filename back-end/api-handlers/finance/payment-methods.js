import { resolveIdentity, requireTenantAccess } from '../../src/auth/identity.js';
import {
  deletePaymentMethodById,
  getTenantBootstrap,
  savePaymentMethod
} from '../../src/modules/finance/index.js';
import {
  badRequest,
  getTenantSlug,
  handleOptions,
  methodNotAllowed,
  sendError,
  sendJson,
  sendMutationJson
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
      return sendJson(res, 200, bootstrap.paymentMethods);
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      return sendMutationJson(req, res, {
        tenantSlug,
        identity,
        statusCode: req.method === 'POST' ? 201 : 200,
        action: () => savePaymentMethod(tenantSlug, req.body || {})
      });
    }

    if (req.method === 'DELETE') {
      const paymentMethodId = req.body?.id;
      if (!paymentMethodId) throw new Error('id da forma de pagamento é obrigatório.');
      return sendMutationJson(req, res, {
        tenantSlug,
        identity,
        statusCode: 200,
        action: async () => {
          await deletePaymentMethodById(tenantSlug, paymentMethodId);
          return { id: paymentMethodId };
        }
      });
    }

    return methodNotAllowed(res, ['GET', 'POST', 'PUT', 'DELETE']);
  } catch (error) {
    return sendError(res, error, 400);
  }
}
