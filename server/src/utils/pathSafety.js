/**
 * Filesystem safety helpers — Task 1.2 (#17).
 * Central guards against path traversal in user-controlled file paths.
 */
const path = require('path');

/**
 * Sanitize a filename segment: keep only [A-Za-z0-9_-]; everything else
 * (slashes, dots sequences, accents, spaces) collapses to '_'.
 */
const sanitizeFilenameSegment = segment =>
  String(segment || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^A-Za-z0-9_-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 80);

/**
 * Ensure `candidate` resolves inside `baseDir`; throws otherwise.
 */
const assertInsideDir = (candidate, baseDir) => {
  const resolvedBase = path.resolve(baseDir);
  const resolvedCandidate = path.resolve(candidate);
  if (
    resolvedCandidate !== resolvedBase &&
    !resolvedCandidate.startsWith(resolvedBase + path.sep)
  ) {
    const err = new Error('Path escapes the allowed directory');
    err.code = 'EPATHTRAVERSAL';
    throw err;
  }
  return resolvedCandidate;
};

module.exports = { sanitizeFilenameSegment, assertInsideDir };
