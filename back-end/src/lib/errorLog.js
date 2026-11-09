import { randomUUID } from 'node:crypto';
import { supabaseAdmin } from './supabaseAdmin.js';

const MAX_ERROR_TEXT_LENGTH = 8_000;
const SENSITIVE_VALUE_PATTERNS = [
  /(authorization\s*[:=]\s*bearer\s+)[^\s,]+/gi,
  /(apikey\s*[:=]\s*)[^\s,]+/gi,
  /(token\s*[:=]\s*)[^\s,]+/gi,
  /(password\s*[:=]\s*)[^\s,]+/gi,
  /\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/g,
  /\bsb_(?:secret|publishable)_[a-zA-Z0-9_-]+\b/g
];

export function sanitizeErrorText(value) {
  let text = String(value || '');
  for (const pattern of SENSITIVE_VALUE_PATTERNS) {
    text = text.replace(pattern, '$1[REDACTED]');
  }
  return text.slice(0, MAX_ERROR_TEXT_LENGTH);
}

export function buildApplicationErrorLog(error, { req, context } = {}) {
  const requestId = context?.requestId || String(req?.headers?.['x-request-id'] || '') || randomUUID();
  return {
    request_id: requestId,
    tenant_slug: context?.tenantSlug || '',
    actor_user_id: context?.userId || null,
    method: String(req?.method || '').toUpperCase(),
    route: String(req?.url || '').split('?')[0],
    status_code: Number(error?.statusCode || error?.status || 500),
    error_name: sanitizeErrorText(error?.name || 'Error').slice(0, 160),
    error_message: sanitizeErrorText(error?.message || 'Falha interna no servidor.'),
    stack_trace: sanitizeErrorText(error?.stack || ''),
    metadata: {
      mutationId: context?.mutationId || null,
      bodyHash: context?.bodyHash || null
    }
  };
}

export async function persistApplicationError(error, context) {
  try {
    const record = buildApplicationErrorLog(error, context);
    const { error: insertError } = await supabaseAdmin.from('application_error_logs').insert(record);
    if (insertError) {
      console.error('[application-error-log] persistence failed', {
        message: insertError.message,
        requestId: record.request_id
      });
    }
  } catch (loggingError) {
    console.error('[application-error-log] unexpected persistence failure', {
      message: loggingError?.message || 'unknown error'
    });
  }
}
