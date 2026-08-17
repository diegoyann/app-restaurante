import {
  claimBootstrapColdStart,
  createBootstrapTrace,
  measureBootstrapSpan,
  runWithBootstrapTrace,
  summarizeBootstrapTrace
} from '../src/lib/bootstrapTrace.js';
import { getTenantBootstrap } from '../src/modules/app/tenantBootstrapReadModel.js';
import { getEffectivePermissionsForIdentity } from '../src/repositories/appRepository.js';

const tenantSlug = String(process.argv[2] || '').trim();
const samples = Math.max(1, Number(process.argv[3] || 1));

if (!tenantSlug) {
  throw new Error('Informe o slug do tenant como primeiro argumento.');
}

function aggregateQueries(queries) {
  const groups = new Map();
  for (const query of queries) {
    const key = `${query.table}:${query.operation}`;
    const current = groups.get(key) || {
      table: query.table,
      operation: query.operation,
      count: 0,
      durationMs: 0,
      rowCount: 0,
      maxDurationMs: 0
    };
    current.count += 1;
    current.durationMs += query.durationMs;
    current.rowCount += query.rowCount;
    current.maxDurationMs = Math.max(current.maxDurationMs, query.durationMs);
    groups.set(key, current);
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      durationMs: Math.round(group.durationMs * 100) / 100,
      maxDurationMs: Math.round(group.maxDurationMs * 100) / 100
    }))
    .sort((a, b) => b.durationMs - a.durationMs);
}

for (let index = 0; index < samples; index += 1) {
  const trace = createBootstrapTrace({
    requestId: `diagnostic-${index + 1}`,
    tenant: tenantSlug,
    coldStart: claimBootstrapColdStart()
  });

  const payload = await runWithBootstrapTrace(trace, async () => {
    const bootstrap = await measureBootstrapSpan(
      'bootstrap.read-model',
      () => getTenantBootstrap(tenantSlug)
    );
    const identity = {
      isSuperAdmin: false,
      memberships: [{
        tenant: { slug: tenantSlug },
        companyId: bootstrap.tenant?.companyId || '',
        role: 'tenant_admin',
        roleProfileId: ''
      }]
    };
    const currentUserPermissions = await measureBootstrapSpan(
      'permissions',
      () => getEffectivePermissionsForIdentity(identity, tenantSlug, {
        tenant: bootstrap.tenant,
        roleProfiles: bootstrap.roleProfiles
      })
    );
    return measureBootstrapSpan('response.assembly', async () => ({
      ...bootstrap,
      currentUserPermissions
    }));
  });

  const summary = summarizeBootstrapTrace(trace, { status: 200, payload });
  console.log(JSON.stringify({
    sample: index + 1,
    coldStart: summary.coldStart,
    durationMs: summary.durationMs,
    payloadBytes: summary.payloadBytes,
    queryCount: summary.queryCount,
    phases: summary.phases.sort((a, b) => b.durationMs - a.durationMs),
    queries: aggregateQueries(summary.queries)
  }));
}
