import { AsyncLocalStorage } from 'node:async_hooks';
import { performance } from 'node:perf_hooks';

const bootstrapTraceStorage = new AsyncLocalStorage();
const instrumentedClients = new WeakSet();
let coldStartPending = true;
const QUERY_OPERATIONS = new Set(['select', 'insert', 'upsert', 'update', 'delete']);

function roundedDuration(value) {
  return Math.round(Math.max(0, Number(value || 0)) * 100) / 100;
}

function safeCount(value) {
  return Math.max(0, Number.isFinite(Number(value)) ? Number(value) : 0);
}

export function claimBootstrapColdStart() {
  const coldStart = coldStartPending;
  coldStartPending = false;
  return coldStart;
}

export function createBootstrapTrace({ requestId, tenant, coldStart = false }) {
  return {
    requestId: String(requestId || ''),
    tenant: String(tenant || ''),
    coldStart: Boolean(coldStart),
    startedAt: new Date().toISOString(),
    startedAtPerf: performance.now(),
    phases: [],
    queries: []
  };
}

export function getActiveBootstrapTrace() {
  return bootstrapTraceStorage.getStore() || null;
}

export function runWithBootstrapTrace(trace, action) {
  return bootstrapTraceStorage.run(trace, action);
}

export async function measureBootstrapSpan(name, action, details = {}) {
  const trace = getActiveBootstrapTrace();
  const startedAt = performance.now();

  try {
    const result = await action();
    if (trace) {
      const resolvedDetails = typeof details === 'function' ? details(result) : details;
      trace.phases.push({
        name: String(name),
        durationMs: roundedDuration(performance.now() - startedAt),
        outcome: 'ok',
        ...resolvedDetails
      });
    }
    return result;
  } catch (error) {
    if (trace) {
      trace.phases.push({
        name: String(name),
        durationMs: roundedDuration(performance.now() - startedAt),
        outcome: 'error',
        ...details
      });
    }
    throw error;
  }
}

export function jsonByteLength(value) {
  return Buffer.byteLength(JSON.stringify(value ?? null), 'utf8');
}

export function recordBootstrapQuery({ table, operation, durationMs, rowCount = 0 }) {
  const trace = getActiveBootstrapTrace();
  if (!trace) return;

  trace.queries.push({
    table: String(table || 'unknown'),
    operation: String(operation || 'query'),
    durationMs: roundedDuration(durationMs),
    rowCount: safeCount(rowCount)
  });
}

function resultRowCount(result) {
  if (Array.isArray(result?.data)) return result.data.length;
  return result?.data == null ? 0 : 1;
}

function instrumentQueryBuilder(builder, table, operation = 'query') {
  return new Proxy(builder, {
    get(target, property, receiver) {
      if (property === 'then') {
        return (onFulfilled, onRejected) => {
          const startedAt = performance.now();
          return target.then(
            (result) => {
              recordBootstrapQuery({
                table,
                operation,
                durationMs: performance.now() - startedAt,
                rowCount: resultRowCount(result)
              });
              return onFulfilled ? onFulfilled(result) : result;
            },
            (error) => {
              recordBootstrapQuery({
                table,
                operation,
                durationMs: performance.now() - startedAt,
                rowCount: 0
              });
              if (onRejected) return onRejected(error);
              throw error;
            }
          );
        };
      }

      const value = Reflect.get(target, property, receiver);
      if (typeof value !== 'function') return value;

      return (...args) => {
        const result = value.apply(target, args);
        const nextOperation = QUERY_OPERATIONS.has(property) ? String(property) : operation;
        return result && typeof result.then === 'function'
          ? instrumentQueryBuilder(result, table, nextOperation)
          : result;
      };
    }
  });
}

export function instrumentSupabaseClient(client) {
  if (!client || instrumentedClients.has(client)) return client;

  const originalFrom = client.from.bind(client);
  client.from = (table) => instrumentQueryBuilder(originalFrom(table), String(table));
  instrumentedClients.add(client);
  return client;
}

export function summarizeBootstrapTrace(trace, { status, payload = null }) {
  return {
    event: 'app_bootstrap_performance',
    requestId: trace.requestId,
    tenant: trace.tenant,
    coldStart: trace.coldStart,
    startedAt: trace.startedAt,
    durationMs: roundedDuration(performance.now() - trace.startedAtPerf),
    status: Number(status || 0),
    payloadBytes: jsonByteLength(payload),
    queryCount: trace.queries.length,
    phases: trace.phases.map((phase) => ({ ...phase })),
    queries: trace.queries.map((query) => ({ ...query }))
  };
}
