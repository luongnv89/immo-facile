/**
 * PDF generator helper unit tests — Task 5.6 (#48).
 * French number-to-words conversion and lease-period date helpers.
 */
const PDFGenerator = require('../pdfGenerator');

describe('numberToWords (French)', () => {
  it.each([
    [0, 'zéro'],
    [5, 'cinq'],
    [9, 'neuf'],
    [10, 'dix'],
    [13, 'treize'],
    [19, 'dix-neuf'],
    [20, 'vingt'],
    [21, 'vingt-un'],
    [35, 'trente-cinq'],
    [70, 'soixante-dix'],
    [71, 'soixante-onze'],
    [77, 'soixante-dix-sept'],
    [80, 'quatre-vingt'],
    [91, 'quatre-vingt-onze'],
    [99, 'quatre-vingt-dix-neuf'],
    [100, 'cent'],
    [101, 'cent un'],
    [200, 'deux cents'],
    [250, 'deux cent cinquante'],
    [999, 'neuf cent quatre-vingt-dix-neuf'],
    [1000, 'mille'],
    [1500, 'mille cinq cents'],
    [2300, 'deux mille trois cents'],
    [73172, 'soixante-treize mille cent soixante-douze'],
    [100000, 'cent mille'],
  ])('converts %i to "%s"', (num, expected) => {
    expect(PDFGenerator.numberToWords(num)).toBe(expected);
  });

  it('rounds decimals and falls back to digits beyond a million', () => {
    expect(PDFGenerator.numberToWords(70.6)).toBe('soixante-onze');
    expect(PDFGenerator.numberToWords(1234567)).toBe('1234567');
  });
});

describe('lease period date helpers', () => {
  it('computes the last day of the previous month', () => {
    expect(PDFGenerator.getLastDayOfPreviousMonth(1, 2024)).toBe('31'); // Dec 2023
    expect(PDFGenerator.getLastDayOfPreviousMonth(3, 2024)).toBe('29'); // leap Feb
    expect(PDFGenerator.getLastDayOfPreviousMonth(3, 2023)).toBe('28');
    expect(PDFGenerator.getLastDayOfPreviousMonth(6, 2026)).toBe('31'); // May
    expect(PDFGenerator.getLastDayOfPreviousMonth(7, 2026)).toBe('30'); // June
  });

  it('formats the previous month as MM/YYYY with year rollover', () => {
    expect(PDFGenerator.getPreviousMonthFormatted(1, 2024)).toBe('12/2023');
    expect(PDFGenerator.getPreviousMonthFormatted(6, 2026)).toBe('05/2026');
  });

  it('covers the full month including leap years', () => {
    expect(PDFGenerator.getFirstDayOfCoveredMonth()).toBe('01');
    expect(PDFGenerator.getLastDayOfCoveredMonth(2, 2024)).toBe('29');
    expect(PDFGenerator.getLastDayOfCoveredMonth(2, 2023)).toBe('28');
    expect(PDFGenerator.getLastDayOfCoveredMonth(12, 2026)).toBe('31');
  });
});
