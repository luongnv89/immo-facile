/**
 * Unit tests for typed errors + sendError helper — Task 5.5 (#47).
 */
const {
  AppError,
  ValidationError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  sendError,
} = require('../errors');

const makeRes = () => {
  const res = {};
  res.status = jest.fn(code => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn(payload => {
    res.body = payload;
    return res;
  });
  return res;
};

describe('typed errors (#47)', () => {
  it.each([
    [AppError, undefined, undefined, 500],
    [ValidationError, 'bad input', 'VALIDATION_ERROR', 400],
    [AuthError, 'no token', 'UNAUTHORIZED', 401],
    [ForbiddenError, 'admin only', 'FORBIDDEN', 403],
    [NotFoundError, 'missing', 'NOT_FOUND', 404],
    [ConflictError, 'duplicate', 'CONFLICT', 409],
  ])('%p maps to status %p', (Cls, message, code, status) => {
    const err = message ? new Cls(message) : new Cls();
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
    expect(err.status).toBe(status);
    if (code) {
      expect(err.code).toBe(code);
      expect(err.message).toBe(message);
      expect(err.name).toBe(Cls.name);
    }
  });

  it('supports default messages per subclass', () => {
    expect(new ValidationError().message).toBe('Invalid request');
    expect(new NotFoundError().message).toBe('Resource not found');
  });

  it('carries optional details', () => {
    const err = new ValidationError('Missing required fields', ['a', 'b']);
    expect(err.details).toEqual(['a', 'b']);
    expect(new ConflictError('dup').details).toBeUndefined();
  });
});

describe('sendError (#47)', () => {
  it('writes { error: { message, code } } with the AppError status', () => {
    const res = makeRes();
    const err = new NotFoundError('Tenant not found');
    sendError(res, err);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: 'Tenant not found', code: 'NOT_FOUND' },
    });
  });

  it('includes details when present', () => {
    const res = makeRes();
    sendError(res, new ValidationError('Missing required fields', ['email']));
    expect(res.json).toHaveBeenCalledWith({
      error: { message: 'Missing required fields', code: 'VALIDATION_ERROR', details: ['email'] },
    });
  });

  it('hides internals of non-AppError failures behind a generic 500', () => {
    const res = makeRes();
    sendError(res, new Error('SQLITE_CORRUPT: secret internals'));
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    });
  });
});
