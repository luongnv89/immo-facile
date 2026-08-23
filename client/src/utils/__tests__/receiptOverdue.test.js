/**
 * receiptOverdue Util Tests (Task 5.9)
 *
 * The client util must mirror the server-owned due-day rule
 * (`server/src/config/appConfig.js` -> PAYMENT_DUE_DAY = 5, applied in
 * `reminderScheduler.calculateDaysOverdue`): rent is due on the 5th of the
 * month following the receipt period.
 */

import { describe, it, expect } from 'vitest';
import { getDaysOverdue, isOverdue, PAYMENT_DUE_DAY, OVERDUE_GRACE_DAYS } from '../receiptOverdue';

describe('receiptOverdue constants', () => {
  it('mirror the server rule: due on the 5th of the following month', () => {
    expect(PAYMENT_DUE_DAY).toBe(5);
    expect(OVERDUE_GRACE_DAYS).toBe(5);
  });
});

describe('getDaysOverdue', () => {
  const now = new Date(2025, 6, 13); // 13 July 2025

  it('returns 0 for a missing or incomplete receipt', () => {
    expect(getDaysOverdue(null, { now })).toBe(0);
    expect(getDaysOverdue({}, { now })).toBe(0);
    expect(getDaysOverdue({ year: 2025 }, { now })).toBe(0);
    expect(getDaysOverdue({ month: 5 }, { now })).toBe(0);
  });

  it('returns 0 when the due date is still in the future', () => {
    // August 2025 rent -> due 5 September 2025, still future on 13 July
    expect(getDaysOverdue({ month: 8, year: 2025 }, { now })).toBe(0);
  });

  it('returns 0 on the due day itself', () => {
    // June 2025 rent -> due 5 July 2025; today is 5 July
    expect(getDaysOverdue({ month: 6, year: 2025 }, { now: new Date(2025, 6, 5) })).toBe(0);
  });

  it('counts each full day past the due date', () => {
    // Due 5 July 2025 -> 8 days on 13 July
    expect(getDaysOverdue({ month: 6, year: 2025 }, { now })).toBe(8);
  });

  it('counts 1 day the day after the due date regardless of time of day', () => {
    const lateMorning = new Date(2025, 6, 6, 11, 30);
    expect(getDaysOverdue({ month: 6, year: 2025 }, { now: lateMorning })).toBe(1);
  });

  it('honours a custom dueDay override', () => {
    // Due 10 July 2025 -> 3 days on 13 July
    expect(getDaysOverdue({ month: 6, year: 2025 }, { now, dueDay: 10 })).toBe(3);
  });
});

describe('isOverdue', () => {
  const base = { firstName: 'Jean', lastName: 'Dupont', month: 6, year: 2025 };
  const justPastGrace = new Date(2025, 6, 5 + OVERDUE_GRACE_DAYS + 1); // 11 July 2025
  const lastGraceDay = new Date(2025, 6, 5 + OVERDUE_GRACE_DAYS); // 10 July 2025

  it('flags unpaid receipts past the grace window', () => {
    expect(isOverdue({ ...base, payment_status: 'pending' }, justPastGrace)).toBe(true);
  });

  it('never flags paid receipts', () => {
    expect(isOverdue({ ...base, payment_status: 'paid' }, justPastGrace)).toBe(false);
  });

  it('treats receipts without a status as pending', () => {
    expect(isOverdue(base, justPastGrace)).toBe(true);
  });

  it('treats late and partial statuses as overdue when past grace', () => {
    expect(isOverdue({ ...base, payment_status: 'late' }, justPastGrace)).toBe(true);
    expect(isOverdue({ ...base, payment_status: 'partial' }, justPastGrace)).toBe(true);
  });

  it('stays within the grace window until strictly more than OVERDUE_GRACE_DAYS', () => {
    expect(isOverdue({ ...base, payment_status: 'pending' }, lastGraceDay)).toBe(false);
    expect(isOverdue({ ...base, payment_status: 'pending' }, justPastGrace)).toBe(true);
  });

  it('is false for receipts without an identifiable period', () => {
    expect(isOverdue({}, justPastGrace)).toBe(false);
  });
});
