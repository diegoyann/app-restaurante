import {
  handleOptions,
  methodNotAllowed,
  sendJson
} from '../_shared/http.js';

export default function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  return sendJson(res, 410, {
    error: 'Login direto pela API foi desativado. Use Supabase Auth no frontend.'
  });
}
