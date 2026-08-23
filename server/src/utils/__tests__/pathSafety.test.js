/**
 * Path traversal guards.
 */
const path = require('path');
const { sanitizeFilenameSegment, assertInsideDir } = require('../pathSafety');

describe('sanitizeFilenameSegment', () => {
  it.each([
    ['../../x', '_x'],
    ['../etc/passwd', '_etc_passwd'],
    ['C:\\Windows\\evil', 'C_Windows_evil'],
    ['Dubois', 'Dubois'],
    ['Dupont-Été', 'Dupont-Ete'],
    ['a b c', 'a_b_c'],
  ])('sanitizes %j -> %j', (input, expected) => {
    expect(sanitizeFilenameSegment(input)).toBe(expected);
  });

  it('never yields a segment containing / or \\ or leading ..', () => {
    const out = sanitizeFilenameSegment('../../x/../../y');
    expect(out).not.toMatch(/\//);
    expect(out).not.toMatch(/\\/);
  });
});

describe('assertInsideDir', () => {
  const base = '/tmp/opencode/receipts-test';

  it('accepts a path inside the base dir', () => {
    expect(assertInsideDir(path.join(base, 'file.pdf'), base)).toBe(
      path.resolve(path.join(base, 'file.pdf'))
    );
  });

  it('rejects a plain traversal attempt', () => {
    expect(() => assertInsideDir(path.join(base, '../../etc/passwd'), base)).toThrow();
  });

  it('rejects an absolute outside path', () => {
    expect(() => assertInsideDir('/etc/passwd', base)).toThrow();
  });
});
