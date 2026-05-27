import { resolveIdentity } from '../../src/auth/identity.js';
import { getAuthSession } from '../../src/modules/auth/index.js';
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
    console.error('[auth/session]', {
      statusCode: error.statusCode || 500,
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });

    return sendError(res, error, error.statusCode || 500);
  }
}
