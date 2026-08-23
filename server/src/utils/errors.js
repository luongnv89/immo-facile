/**
 * Typed application errors + centralized error responses.
 *
 * Controllers throw these instead of hand-crafting res.status(...).json
 * payloads; the single Express error middleware in index.js maps them to
 * HTTP statuses via sendError(), producing the consistent shape:
 *   { error: { message, code } }
 */

/**
 * Base class for all operational (expected) errors.
 * `status` is the HTTP status code, `code` a stable machine-readable string.
 */
class AppError extends Error {
  /**
   * @param {string} message - human-readable message safe to expose to clients
   * @param {{ status?: number, code?: string, details?: unknown }} [options]
   */
  constructor(message, { status = 500, code = 'INTERNAL_ERROR', details } = {}) {
    super(message);
    this.name = new.target.name;
    this.status = status;
    this.code = code;
    if (details !== undefined) this.details = details;
    if (Error.captureStackTrace) Error.captureStackTrace(this, new.target);
  }
}

/** 400 — invalid input */
class ValidationError extends AppError {
  constructor(message = 'Invalid request', details) {
    super(message, { status: 400, code: 'VALIDATION_ERROR', details });
  }
}

/** 401 — missing or invalid credentials */
class AuthError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, { status: 401, code: 'UNAUTHORIZED' });
  }
}

/** 403 — insufficient permissions */
class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, { status: 403, code: 'FORBIDDEN' });
  }
}

/** 404 — resource does not exist */
class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, { status: 404, code: 'NOT_FOUND' });
  }
}

/** 409 — conflicting state (duplicate resource, race with unique constraint) */
class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, { status: 409, code: 'CONFLICT' });
  }
}

/**
 * Send the consistent error envelope for any error.
 * Non-AppError instances are treated as 500 INTERNAL_ERROR.
 *
 * @param {import('express').Response} res
 * @param {unknown} err
 */
const sendError = (res, err) => {
  const isAppError = err instanceof AppError;
  const payload = {
    error: {
      message: isAppError ? err.message : 'Internal server error',
      code: isAppError ? err.code : 'INTERNAL_ERROR',
    },
  };
  if (isAppError && err.details !== undefined) payload.error.details = err.details;
  return res.status(isAppError ? err.status : 500).json(payload);
};

module.exports = {
  AppError,
  ValidationError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  sendError,
};
