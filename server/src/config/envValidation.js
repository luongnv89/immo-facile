/**
 * Startup validation for CORS configuration — Task 1.3 (#18).
 * Extracted so tests can call it without spawning a process.
 */
const validateCorsOrigin = () => {
  if (process.env.CORS_ORIGIN === '*') {
    throw new Error(
      'CORS_ORIGIN="*" is not allowed: the API uses credentials. ' +
        'Set CORS_ORIGIN to your actual origin(s), e.g. http://localhost:5173.'
    );
  }
};

module.exports = { validateCorsOrigin };
