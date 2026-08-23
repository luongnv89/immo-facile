/**
 * Unit tests for the shared pagination helpers (#57).
 */
const { DEFAULT_PAGE_SIZE, parsePagination, buildPaginationMeta } = require('../pagination');

describe('parsePagination', () => {
  it('defaults to page 1 and a 50-item page size', () => {
    expect(parsePagination({})).toEqual({ page: 1, limit: 50, offset: 0 });
    expect(parsePagination()).toEqual({ page: 1, limit: 50, offset: 0 });
  });

  it('computes the OFFSET for a given page', () => {
    expect(parsePagination({ page: '3', limit: '10' })).toEqual({
      page: 3,
      limit: 10,
      offset: 20,
    });
  });

  it('caps the page size at the default (50)', () => {
    expect(parsePagination({ limit: '500' }).limit).toBe(50);
    expect(parsePagination({ limit: '51' }).limit).toBe(50);
  });

  it('falls back to defaults on invalid input', () => {
    expect(parsePagination({ page: '0' })).toEqual({ page: 1, limit: 50, offset: 0 });
    expect(parsePagination({ page: '-2', limit: '-5' })).toEqual({
      page: 1,
      limit: 50,
      offset: 0,
    });
    expect(parsePagination({ page: 'abc', limit: 'NaN' })).toEqual({
      page: 1,
      limit: 50,
      offset: 0,
    });
    expect(parsePagination({ page: '1.5', limit: '2.7' })).toEqual({
      page: 1,
      limit: 50,
      offset: 0,
    });
  });

  it('clamps astronomically large page numbers to MAX_PAGE_NUMBER', () => {
    const parsed = parsePagination({ page: '999999999999999999999' });
    expect(parsed.page).toBe(10000000);
    expect(parsed.offset).toBe((10000000 - 1) * 50);
  });

  it('keeps the computed OFFSET inside the SQLite INTEGER bind range', () => {
    const { offset } = parsePagination({ page: '100000000000000000000', limit: '50' });
    expect(offset).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER);
  });

  it('exports a default page size of 50', () => {
    expect(DEFAULT_PAGE_SIZE).toBe(50);
  });
});

describe('buildPaginationMeta', () => {
  it('derives total pages from total and limit', () => {
    expect(buildPaginationMeta(55, 2, 50)).toEqual({
      page: 2,
      limit: 50,
      total: 55,
      totalPages: 2,
    });
  });

  it('never reports zero pages for an empty collection', () => {
    expect(buildPaginationMeta(0, 1, 50).totalPages).toBe(1);
  });

  it('rounds partial pages up', () => {
    expect(buildPaginationMeta(101, 1, 50).totalPages).toBe(3);
  });
});
