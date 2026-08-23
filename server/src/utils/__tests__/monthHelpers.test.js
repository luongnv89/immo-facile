/**
 * Month handling regression tests.
 * Months are integers 1-12 end-to-end; these helpers encode the
 * 1-based-month <-> Date-0-based-index boundary in one place.
 */
const PDFGenerator = require('../pdfGenerator');

describe('month-as-integer helpers (#40)', () => {
  it.each([
    [1, 2026, '31'], // January -> previous month is December 2025, 31 days
    [3, 2026, '28'],
    [12, 2026, '30'], // December -> previous month November
  ])('getLastDayOfPreviousMonth(%i, %i) = %s', (month, year, expected) => {
    expect(PDFGenerator.getLastDayOfPreviousMonth(month, year)).toBe(expected);
  });

  it('getPreviousMonthFormatted wraps year for January', () => {
    expect(PDFGenerator.getPreviousMonthFormatted(1, 2026)).toBe('12/2025');
    expect(PDFGenerator.getPreviousMonthFormatted(12, 2026)).toBe('11/2026');
  });

  it.each([
    [1, 2026, '31'],
    [2, 2028, '29'], // leap year
    [2, 2027, '28'],
    [12, 2026, '31'],
  ])('getLastDayOfCoveredMonth(%i, %i) = %s', (month, year, expected) => {
    expect(PDFGenerator.getLastDayOfCoveredMonth(month, year)).toBe(expected);
  });
});
