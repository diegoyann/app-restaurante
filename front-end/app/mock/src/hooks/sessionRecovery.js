const INVALID_SESSION_STATUS = 401;

export function shouldClearSessionAfterValidationError(error) {
  return Number(error?.status) === INVALID_SESSION_STATUS;
}

export function shouldRetrySessionValidation(error) {
  return Number(error?.status) === INVALID_SESSION_STATUS;
}

export async function validateSessionWithRefresh({ validate, refreshSession }) {
  try {
    return await validate();
  } catch (validationError) {
    if (!shouldRetrySessionValidation(validationError)) {
      throw validationError;
    }

    const { data, error: refreshError } = await refreshSession();
    if (refreshError || !data?.session) {
      throw validationError;
    }

    return validate();
  }
}
