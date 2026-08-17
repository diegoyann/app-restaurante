import { resolveIdentity, requireTenantAccess } from '../../src/auth/identity.js';
import { randomUUID } from 'node:crypto';
import {
  claimBootstrapColdStart,
  createBootstrapTrace,
  measureBootstrapSpan,
  runWithBootstrapTrace,
  summarizeBootstrapTrace
} from '../../src/lib/bootstrapTrace.js';
import { getEffectivePermissionsForIdentity, getTenantBootstrap } from '../../src/modules/app/index.js';
import { assembleBootstrapResponse } from '../../src/modules/app/bootstrapResponse.js';
import {
  badRequest,
  getTenantSlug,
  handleOptions,
  methodNotAllowed,
  sendError,
  sendJson
} from '../_shared/http.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) {
    return;
  }

  if (req.method !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

  const tenantSlug = getTenantSlug(req);

  if (!tenantSlug) {
    return badRequest(res, 'Informe o tenant na query ?tenant=slug.');
  }

  try {
    const requestId = String(req.headers?.['x-request-id'] || randomUUID());
    const trace = createBootstrapTrace({
      requestId,
      tenant: tenantSlug,
      coldStart: claimBootstrapColdStart()
    });
    res.setHeader('X-Request-Id', requestId);

    return runWithBootstrapTrace(trace, async () => {
      try {
        const identity = await measureBootstrapSpan('authentication', () => resolveIdentity(req));
        await measureBootstrapSpan('authorization.tenant', async () => requireTenantAccess(identity, tenantSlug));
        const bootstrap = await measureBootstrapSpan('bootstrap.read-model', () => getTenantBootstrap(tenantSlug));
        const currentUserPermissions = await measureBootstrapSpan(
          'permissions',
          () => getEffectivePermissionsForIdentity(identity, tenantSlug, {
            tenant: bootstrap.tenant,
            roleProfiles: bootstrap.roleProfiles
          })
        );
        const payload = await measureBootstrapSpan(
          'response.assembly',
          async () => assembleBootstrapResponse(bootstrap, currentUserPermissions)
        );
        await measureBootstrapSpan('response.serialization', async () => JSON.stringify(payload));
        const summary = summarizeBootstrapTrace(trace, { status: 200, payload });
        console.info(JSON.stringify(summary));
        return sendJson(res, 200, payload);
      } catch (error) {
        console.info(JSON.stringify(summarizeBootstrapTrace(trace, {
          status: error.statusCode || 400,
          payload: { error: true }
        })));
        return sendError(res, error, 400);
      }
    });
  } catch (error) {
    return sendError(res, error, 400);
  }
}
