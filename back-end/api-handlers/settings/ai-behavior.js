import { resolveIdentity, requireTenantAccess } from '../../src/auth/identity.js';
import { getTenantBootstrap, saveAiSettings } from '../../src/modules/settings/index.js';
import {
  badRequest,
  getTenantSlug,
  handleOptions,
  methodNotAllowed,
  sendError,
  sendJson
} from '../_shared/http.js';

const VALID_TONES = new Set(['friendly', 'formal', 'modern']);
const VALID_CRISIS = new Set(['whatsapp', 'email']);

function sanitizeAiBehaviorSettings(settings) {
  const additionalInstructions = String(settings.additionalInstructions || '').trim();
  if (!VALID_TONES.has(settings.positiveTone)) throw new Error('positiveTone inválido.');
  if (!VALID_CRISIS.has(settings.crisisStrategy)) throw new Error('crisisStrategy inválido.');
  if (additionalInstructions.length > 150) throw new Error('As instruções adicionais precisam ficar em até 150 caracteres.');

  return {
    positiveTone: settings.positiveTone,
    crisisStrategy: settings.crisisStrategy,
    additionalInstructions,
    autoPublishPositive: Boolean(settings.autoPublishPositive)
  };
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
      return sendJson(res, 200, bootstrap.aiBehaviorSettings);
    }

    if (req.method === 'PUT') {
      return sendJson(res, 200, await saveAiSettings(tenantSlug, sanitizeAiBehaviorSettings(req.body || {})));
    }

    return methodNotAllowed(res, ['GET', 'PUT']);
  } catch (error) {
    return sendError(res, error, 400);
  }
}
