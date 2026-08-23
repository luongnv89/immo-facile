/**
 * Reminder scheduler service tests — Task 5.6 (#48).
 * Overdue detection, reminder throttling, cron lifecycle and statistics.
 * The SMTP transport is stubbed; the DB is real (:memory:).
 */
const fs = require('fs');
const path = require('path');

describe('reminderScheduler', () => {
  let scheduler;
  let emailService;
  let sendMailMock;
  let tenant;
  let overdueReceipt;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    const { initializeDatabase, closeDatabase } = require('../../database/db');
    await initializeDatabase();

    const Tenant = require('../../models/Tenant');
    const Receipt = require('../../models/Receipt');
    scheduler = require('../../services/reminderScheduler');
    emailService = require('../../utils/emailService');

    // Stub transport so reminders "send" without any network access.
    sendMailMock = jest.fn().mockResolvedValue({ messageId: '<sched@example.com>' });
    emailService.transporter = { sendMail: sendMailMock };

    tenant = await Tenant.create({
      firstName: 'Ondine',
      lastName: 'Retard',
      gender: 'F',
      email: `ondine.retard+${Date.now()}@example.com`,
      rentAmount: 900,
    });
    overdueReceipt = await Receipt.create({
      tenant_id: tenant.id,
      month: 3,
      year: 2024, // long past => clearly overdue
      amount: 900,
      fileName: 'sched-test.pdf',
      filePath: path.join(process.env.RECEIPTS_DIR || '/tmp', 'sched-test.pdf'),
    });
  });

  afterAll(async () => {
    if (scheduler) scheduler.stop();
    const { closeDatabase } = require('../../database/db');
    await closeDatabase();
  });

  function daysOverdueFor(receipt) {
    return scheduler.calculateDaysOverdue(receipt);
  }

  it('calculates days overdue from the 5th of the following month', () => {
    const row = overdueReceipt;
    const dueDate = new Date(row.year, row.month, scheduler.config.dueDay);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expected = Math.max(0, Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24)));

    expect(daysOverdueFor(row)).toBe(expected);
    expect(daysOverdueFor({ month: 12, year: 2999 })).toBe(0); // future => not overdue
  });

  it('gates reminders on matching reminder days and max count', () => {
    const days = daysOverdueFor(overdueReceipt);
    scheduler.updateConfig({ reminderDays: [days], maxReminders: 5 });

    // Not a configured reminder day -> skip
    expect(scheduler.shouldSendReminder(overdueReceipt, -1)).toBe(false);
    // Max reminders already reached -> skip
    expect(scheduler.shouldSendReminder({ ...overdueReceipt, reminder_sent_count: 5 }, days)).toBe(
      false
    );
    // Reminder already sent today -> skip
    expect(
      scheduler.shouldSendReminder(
        { ...overdueReceipt, last_reminder_sent_at: new Date().toISOString() },
        days
      )
    ).toBe(false);
    // Otherwise -> send
    expect(scheduler.shouldSendReminder(overdueReceipt, days)).toBe(true);
  });

  it('sends exactly one reminder per matching day and records it', async () => {
    const days = daysOverdueFor(overdueReceipt);
    scheduler.updateConfig({ reminderDays: [days], maxReminders: 5 });

    const firstRun = await scheduler.triggerManualCheck();
    expect(firstRun.total).toBeGreaterThanOrEqual(1);
    expect(firstRun.sent).toBeGreaterThanOrEqual(1);
    expect(sendMailMock).toHaveBeenCalled();

    const { getDatabase } = require('../../database/db');
    const db = getDatabase();
    const row = await new Promise((resolve, reject) => {
      db.get(
        'SELECT reminder_sent_count, last_reminder_sent_at FROM receipts WHERE id = ?',
        [overdueReceipt.id],
        (err, r) => (err ? reject(err) : resolve(r))
      );
    });
    expect(row.reminder_sent_count).toBe(1);
    expect(row.last_reminder_sent_at).toBeTruthy();

    // Same-day rerun must skip, not double-send
    const secondRun = await scheduler.triggerManualCheck();
    expect(secondRun.skipped).toBeGreaterThanOrEqual(1);
  });

  it('counts errors when sending fails', async () => {
    const days = daysOverdueFor(overdueReceipt);
    scheduler.updateConfig({
      reminderDays: [days], // must match, otherwise the receipt is skipped
      maxReminders: 5,
    });
    // Pretend the last reminder went out yesterday so the same-day guard passes
    const { getDatabase } = require('../../database/db');
    const db = getDatabase();
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE receipts SET last_reminder_sent_at = datetime('now', '-1 day') WHERE id = ?`,
        [overdueReceipt.id],
        err => (err ? reject(err) : resolve())
      );
    });
    sendMailMock.mockRejectedValueOnce(new Error('SMTP down'));

    const result = await scheduler.checkAndSendReminders();
    expect(result.errors).toBeGreaterThanOrEqual(1);
    expect(result.sent).toBe(0);
  });

  it('reports status, config copies and statistics', async () => {
    const status = scheduler.getStatus();
    expect(status.isRunning).toBe(false);
    expect(status.activeJobs).toEqual([]);
    expect(status.config.reminderDays).toEqual([daysOverdueFor(overdueReceipt)]);

    const stats = await scheduler.getStatistics(30);
    expect(Number(stats.total_receipts)).toBeGreaterThanOrEqual(1);
    expect(stats).toHaveProperty('unpaid_receipts');
    expect(stats).toHaveProperty('avg_reminders_per_receipt');
  });

  it('starts and stops the cron job', () => {
    scheduler.start();
    let status = scheduler.getStatus();
    expect(status.isRunning).toBe(true);
    expect(status.activeJobs).toContain('daily-reminder');

    // starting twice is a no-op
    scheduler.start();
    expect(scheduler.getStatus().activeJobs).toHaveLength(1);

    scheduler.stop();
    status = scheduler.getStatus();
    expect(status.isRunning).toBe(false);
    expect(status.activeJobs).toEqual([]);
  });

  it('restarts on config change while running and stops when disabled', () => {
    scheduler.start();

    scheduler.updateConfig({ schedule: '30 8 * * 1' });
    expect(scheduler.getConfig().schedule).toBe('30 8 * * 1');
    expect(scheduler.getStatus().isRunning).toBe(true);

    scheduler.updateConfig({ enabled: false });
    expect(scheduler.getStatus().isRunning).toBe(false);

    // invalid cron was already covered by cronConfig.test.js through HTTP
  });
});
