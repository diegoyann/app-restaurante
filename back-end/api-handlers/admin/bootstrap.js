import { resolveIdentity, requireRole } from '../../src/auth/identity.js';
import { getAdminBootstrap } from '../../src/modules/admin/index.js';
import {
  handleOptions,
  methodNotAllowed,
  sendError,
  sendJson
} from '../_shared/http.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  try {
    const identity = await resolveIdentity(req);
    requireRole(identity, ['super_admin']);
    return sendJson(res, 200, await getAdminBootstrap(String(req.query?.tenant || '').trim()));
  } catch (error) {
    return sendError(res, error);
  }
}
