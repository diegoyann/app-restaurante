import { db } from '../../src/data/store.js';
import { sanitizePayrollSettings } from '../../src/services/payrollService.js';
import {
  handleOptions,
  methodNotAllowed,
  sendJson
} from '../_shared/http.js';

export default function handler(req, res) {
  if (handleOptions(req, res)) {
    return;
  }

  if (req.method === 'GET') {
    return sendJson(res, 200, db.payrollSettings);
  }

  if (req.method === 'PUT') {
    try {
      db.payrollSettings = sanitizePayrollSettings({
        ...db.payrollSettings,
        ...req.body
      });

      return sendJson(res, 200, db.payrollSettings);
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
  }

  return methodNotAllowed(res, ['GET', 'PUT']);
}
