import { resolveIdentity, requireTenantAccess } from '../../src/auth/identity.js';
import { getTenantBootstrap, saveSettings } from '../../src/repositories/appRepository.js';
import {
  badRequest,
  getTenantSlug,
  handleOptions,
  methodNotAllowed,
  sendError,
  sendJson
} from '../_shared/http.js';

function sanitizeGeneralSettings(settings) {
  const normalized = {
    ifoodTax: Number(settings.ifoodTax),
    anotaaiTax: Number(settings.anotaaiTax),
    passwordReminder: String(settings.passwordReminder || ''),
    businessName: String(settings.businessName || '').trim(),
    alertDaysBefore: Number(settings.alertDaysBefore)
  };

  if (!normalized.businessName) throw new Error('businessName é obrigatório.');
  if (Number.isNaN(normalized.ifoodTax) || normalized.ifoodTax < 0) throw new Error('ifoodTax precisa ser maior ou igual a zero.');
  if (Number.isNaN(normalized.anotaaiTax) || normalized.anotaaiTax < 0) throw new Error('anotaaiTax precisa ser maior ou igual a zero.');
  if (!Number.isInteger(normalized.alertDaysBefore) || normalized.alertDaysBefore < 0 || normalized.alertDaysBefore > 30) {
    throw new Error('alertDaysBefore precisa estar entre 0 e 30.');
  }

  return normalized;
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  const tenantSlug = getTenantSlug(req);
  if (!tenantSlug) return badRequest(res, 'Informe o tenant na query ?tenant=slug.');

  try {
    const identity = await resolveIdentity(req);
    requireTenantAccess(identity, tenantSlug, ['tenant_admin']);

    if (req.method === 'GET') {
      const bootstrap = await getTenantBootstrap(tenantSlug);
      return sendJson(res, 200, bootstrap.settings);
    }

    if (req.method === 'PUT') {
      const nextSettings = sanitizeGeneralSettings(req.body || {});
      return sendJson(res, 200, await saveSettings(tenantSlug, nextSettings));
    }

    return methodNotAllowed(res, ['GET', 'PUT']);
  } catch (error) {
    return sendError(res, error, 400);
  }
}
