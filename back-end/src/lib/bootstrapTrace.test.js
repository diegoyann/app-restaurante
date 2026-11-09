import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBootstrapTrace,
  instrumentSupabaseClient,
  measureBootstrapSpan,
  recordBootstrapQuery,
  runWithBootstrapTrace,
  summarizeBootstrapTrace
} from './bootstrapTrace.js';

test('bootstrap trace records spans, queries and payload bytes without sensitive values', async () => {
  const trace = createBootstrapTrace({
    requestId: 'req-safe',
    tenant: 'tenant-safe',
    coldStart: true
  });

  const payload = await runWithBootstrapTrace(trace, async () => {
    await measureBootstrapSpan('authentication', async () => {
      recordBootstrapQuery({
        table: 'tenant_memberships',
        operation: 'select',
        durationMs: 12.4,
        rowCount: 2
      });
    });

    return { ok: true, token: 'must-not-be-logged' };
  });

  const summary = summarizeBootstrapTrace(trace, {
    status: 200,
    payload
  });
  const serializedSummary = JSON.stringify(summary);

  assert.equal(summary.event, 'app_bootstrap_performance');
  assert.equal(summary.requestId, 'req-safe');
  assert.equal(summary.tenant, 'tenant-safe');
  assert.equal(summary.coldStart, true);
  assert.equal(summary.status, 200);
  assert.equal(summary.queryCount, 1);
  assert.equal(summary.queries[0].table, 'tenant_memberships');
  assert.equal(summary.queries[0].operation, 'select');
  assert.equal(summary.queries[0].rowCount, 2);
  assert.ok(summary.payloadBytes > 0);
  assert.ok(summary.phases.some((phase) => phase.name === 'authentication'));
  assert.doesNotMatch(serializedSummary, /must-not-be-logged/);
  assert.doesNotMatch(serializedSummary, /token/);
});

test('bootstrap trace preserves errors while recording the failed span outcome', async () => {
  const trace = createBootstrapTrace({ requestId: 'req-error', tenant: 'tenant-safe' });

  await assert.rejects(
    runWithBootstrapTrace(trace, () => measureBootstrapSpan('projection.finance', async () => {
      throw new Error('database unavailable');
    })),
    /database unavailable/
  );

  assert.equal(trace.phases.length, 1);
  assert.equal(trace.phases[0].name, 'projection.finance');
  assert.equal(trace.phases[0].outcome, 'error');
  assert.ok(trace.phases[0].durationMs >= 0);
});

test('instrumented Supabase client records each awaited query without logging filters', async () => {
  const builder = {
    select() { return this; },
    eq() { return this; },
    then(resolve, reject) {
      return Promise.resolve({ data: [{ id: 1 }, { id: 2 }], error: null }).then(resolve, reject);
    }
  };
  const client = {
    from() { return builder; }
  };
  const trace = createBootstrapTrace({ requestId: 'req-query', tenant: 'tenant-safe' });

  instrumentSupabaseClient(client);
  await runWithBootstrapTrace(trace, async () => await client
    .from('transactions')
    .select('*')
    .eq('tenant_id', 'secret-tenant-id'));

  assert.equal(trace.queries.length, 1);
  assert.equal(trace.queries[0].table, 'transactions');
  assert.equal(trace.queries[0].operation, 'select');
  assert.equal(trace.queries[0].rowCount, 2);
  assert.doesNotMatch(JSON.stringify(trace.queries), /secret-tenant-id/);
});
