import { getCustomerByPhone } from '../../src/modules/public/index.js';
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
    if (req.method !== 'GET') {
      return methodNotAllowed(res, ['GET']);
    }

    const phone = String(req.query?.phone || '').replace(/\D/g, '');
    if (phone.length < 10 || phone.length > 11) {
      return badRequest(res, 'Telefone com DDD é obrigatório.');
    }

    const customer = await getCustomerByPhone(tenantSlug, phone);
    return sendJson(res, 200, { customer });
  } catch (error) {
    return sendError(res, error, 400);
  }
}
