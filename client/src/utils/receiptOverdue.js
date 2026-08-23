/**
 * Shared overdue helpers for rent receipts (Task 5.9 / F-CLEAN-010).
 *
 * The due-day rule is owned by the server (`server/src/config/appConfig.js`
 * -> `PAYMENT_DUE_DAY`, applied in `reminderScheduler.calculateDaysOverdue`):
 * rent for a given month is due on the 5th of the following month. This module
 * mirrors that rule for display purposes only — keep both sides in sync if the
 * policy ever changes.
 */

/** Day of the following month on which rent payment is due (server-owned rule). */
export const PAYMENT_DUE_DAY = 5;

/** Days past the due date before an unpaid receipt is flagged as overdue. */
export const OVERDUE_GRACE_DAYS = 5;

/**
 * Compute how many days a receipt's payment is overdue.
 *
 * Mirrors the server calculation, including normalizing "today" to midnight so
 * the current day counts fully once the due date has passed.
 *
 * @param {Object|null} receipt - Receipt carrying `month` (1-12) and `year`.
 * @param {Object} [options]
 * @param {number} [options.dueDay=PAYMENT_DUE_DAY] - Due day of the following month.
 * @param {Date} [options.now=new Date()] - Reference "today", injectable for tests.
 * @returns {number} Days overdue (0 when not yet due).
 */
export const getDaysOverdue = (receipt, { dueDay = PAYMENT_DUE_DAY, now = new Date() } = {}) => {
  if (!receipt || !receipt.month || !receipt.year) return 0;

  // Due on PAYMENT_DUE_DAY of the month after the receipt period
  // (`receipt.month` is 1-based and feeds Date's 0-based month index).
  const dueDate = new Date(receipt.year, receipt.month, dueDay);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const diffTime = today - dueDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
};

/**
 * Whether a receipt should be displayed as overdue.
 *
 * @param {Object|null} receipt - Receipt with an optional `payment_status`.
 * @param {Date} [now=new Date()] - Reference "today", injectable for tests.
 * @returns {boolean} True when not fully paid and past the grace window.
 */
export const isOverdue = (receipt, now = new Date()) => {
  const status = receipt?.payment_status || 'pending';
  return status !== 'paid' && getDaysOverdue(receipt, { now }) > OVERDUE_GRACE_DAYS;
};
