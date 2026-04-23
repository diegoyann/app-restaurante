import { resolveIdentity } from '../../src/auth/identity.js';
import { getAuthSession } from '../../src/repositories/appRepository.js';
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
    return sendJson(res, 200, await getAuthSession(identity));
  } catch (error) {
    return sendError(res, error, 401);
  }
}
