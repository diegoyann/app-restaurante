import { handleOptions, methodNotAllowed, sendJson } from './_shared/http.js';

export default function handler(req, res) {
  if (handleOptions(req, res)) {
    return;
  }

  if (req.method !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

  return sendJson(res, 200, { status: 'ok' });
}
