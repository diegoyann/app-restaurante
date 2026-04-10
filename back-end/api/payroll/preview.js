import { db } from '../../src/data/store.js';
import { buildPayrollPreview } from '../../src/services/payrollService.js';
import {
  handleOptions,
  methodNotAllowed,
  sendJson
} from '../_shared/http.js';

export default function handler(req, res) {
  if (handleOptions(req, res)) {
    return;
  }

  if (req.method !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

  try {
    const month = req.query.month;

    if (!month) {
      return sendJson(res, 400, {
        error: 'Informe o mês no formato YYYY-MM.'
      });
    }

    const preview = buildPayrollPreview({
      referenceMonth: month,
      settings: db.payrollSettings,
      employees: db.employees
    });

    return sendJson(res, 200, preview);
  } catch (error) {
    return sendJson(res, 400, { error: error.message });
  }
}
