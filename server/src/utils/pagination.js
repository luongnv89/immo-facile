/**
 * Pagination helpers for list endpoints.
 *
 * Task 6.5 (#57): every collection endpoint honors `?page=` / `?limit=`
 * with a LIMIT/OFFSET query capped at DEFAULT_PAGE_SIZE (50) so a single
 * request can never pull an unbounded result set.
 */

const DEFAULT_PAGE_SIZE = 50;

/**
 * Parse a positive integer query value, falling back to `fallback`.
 * @param {unknown} raw - Raw query-string value.
 * @param {number} fallback - Value used when missing or invalid.
 * @returns {number} Parsed integer >= 1.
 */
const parsePositiveInt = (raw, fallback) => {
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return parsed;
};

/**
 * Parse pagination options from an Express query object.
 * @param {Object} [query] - req.query.
 * @param {number} [query.page] - 1-based page number (default 1).
 * @param {number} [query.limit] - Page size, capped at DEFAULT_PAGE_SIZE.
 * @returns {{page: number, limit: number, offset: number}}
 */
const parsePagination = (query = {}) => {
  const page = parsePositiveInt(query.page, 1);
  const limit = Math.min(parsePositiveInt(query.limit, DEFAULT_PAGE_SIZE), DEFAULT_PAGE_SIZE);
  return { page, limit, offset: (page - 1) * limit };
};

/**
 * Build response metadata for a paginated list.
 * @param {number} total - Total number of rows across all pages.
 * @param {number} page - Current 1-based page.
 * @param {number} limit - Effective page size.
 * @returns {{page: number, limit: number, total: number, totalPages: number}}
 */
const buildPaginationMeta = (total, page, limit) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

module.exports = {
  DEFAULT_PAGE_SIZE,
  parsePagination,
  buildPaginationMeta,
};
