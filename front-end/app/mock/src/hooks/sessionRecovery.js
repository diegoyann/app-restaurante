const INVALID_SESSION_STATUSES = new Set([401, 403]);

export function shouldClearSessionAfterValidationError(error) {
  return INVALID_SESSION_STATUSES.has(Number(error?.status));
}
