/**
 * Reminder Scheduler Service
 * Task 1.2.3: Reminder Scheduling Service
 *
 * Automated scheduling for payment reminders using node-cron
 */

const cron = require('node-cron');
const Receipt = require('../models/Receipt');
const Tenant = require('../models/Tenant');
const emailService = require('../utils/emailService');
const { getDatabase } = require('../database/db');

class ReminderScheduler {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;

    // Default reminder configuration
    this.config = {
      enabled: process.env.REMINDERS_ENABLED !== 'false',
      schedule: process.env.REMINDER_SCHEDULE || '0 9 * * *', // Daily at 9 AM
      reminderDays: [3, 7, 14, 21, 30], // Days after due date to send reminders
      maxReminders: 5, // Maximum reminders per receipt
      dueDay: 5, // Payment due on 5th of following month
    };
  }

  /**
   * Initialize and start the scheduler
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ Reminder scheduler is already running');
      return;
    }

    if (!this.config.enabled) {
      console.log('ℹ️ Reminder scheduler is disabled');
      return;
    }

    // Schedule daily reminder check
    const job = cron.schedule(
      this.config.schedule,
      async () => {
        console.log(`🔔 Running scheduled reminder check at ${new Date().toISOString()}`);
        await this.checkAndSendReminders();
      },
      {
        scheduled: true,
        timezone: process.env.TZ || 'Europe/Paris',
      }
    );

    this.jobs.set('daily-reminder', job);
    this.isRunning = true;

    console.log(`✅ Reminder scheduler started (schedule: ${this.config.schedule})`);
    console.log(`📅 Reminder days: ${this.config.reminderDays.join(', ')}`);
  }

  /**
   * Stop the scheduler
   */
  stop() {
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`🛑 Stopped scheduler job: ${name}`);
    });

    this.jobs.clear();
    this.isRunning = false;
    console.log('✅ Reminder scheduler stopped');
  }

  /**
   * Check for overdue payments and send reminders
   */
  async checkAndSendReminders() {
    try {
      const overdueReceipts = await this.getOverdueReceipts();

      console.log(`📊 Found ${overdueReceipts.length} overdue receipts`);

      let sentCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      for (const receipt of overdueReceipts) {
        try {
          const daysOverdue = this.calculateDaysOverdue(receipt);
          const shouldSendReminder = this.shouldSendReminder(receipt, daysOverdue);

          if (shouldSendReminder) {
            await this.sendReminder(receipt, daysOverdue);
            sentCount++;
          } else {
            skippedCount++;
          }
        } catch (error) {
          console.error(`Error processing receipt ${receipt.id}:`, error);
          errorCount++;
        }
      }

      console.log(
        `✅ Reminder check complete: ${sentCount} sent, ${skippedCount} skipped, ${errorCount} errors`
      );

      return {
        total: overdueReceipts.length,
        sent: sentCount,
        skipped: skippedCount,
        errors: errorCount,
      };
    } catch (error) {
      console.error('Error in reminder check:', error);
      throw error;
    }
  }

  /**
   * Get all overdue receipts that need reminders
   */
  async getOverdueReceipts() {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      db.all(
        `
        SELECT r.*, t.firstName, t.lastName, t.email, t.gender
        FROM receipts r
        JOIN tenants t ON r.tenant_id = t.id
        WHERE r.payment_status != 'paid'
          AND t.email IS NOT NULL
          AND t.email != ''
          AND t.isActive = 1
        ORDER BY r.year DESC, r.month DESC
      `,
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows);
        }
      );
    });
  }

  /**
   * Calculate days overdue for a receipt
   */
  calculateDaysOverdue(receipt) {
    // Payment is due on the 5th of the following month
    const dueDate = new Date(receipt.year, receipt.month, this.config.dueDay);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = today - dueDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  }

  /**
   * Determine if a reminder should be sent
   */
  shouldSendReminder(receipt, daysOverdue) {
    // Check if we've reached max reminders
    const reminderCount = receipt.reminder_sent_count || 0;
    if (reminderCount >= this.config.maxReminders) {
      console.log(`⏭️ Receipt ${receipt.id}: Max reminders reached (${reminderCount})`);
      return false;
    }

    // Check if days overdue matches a reminder day
    if (!this.config.reminderDays.includes(daysOverdue)) {
      return false;
    }

    // Check if we already sent a reminder today
    if (receipt.last_reminder_sent_at) {
      const lastSent = new Date(receipt.last_reminder_sent_at);
      const today = new Date();

      if (lastSent.toDateString() === today.toDateString()) {
        console.log(`⏭️ Receipt ${receipt.id}: Reminder already sent today`);
        return false;
      }
    }

    return true;
  }

  /**
   * Send a payment reminder
   */
  async sendReminder(receipt, daysOverdue) {
    try {
      // Get tenant info
      const tenant = {
        firstName: receipt.firstName,
        lastName: receipt.lastName,
        email: receipt.email,
        gender: receipt.gender,
      };

      // Send reminder email
      const result = await emailService.sendPaymentReminder(tenant, receipt, daysOverdue);

      // Update reminder count in database
      await this.updateReminderCount(receipt.id);

      console.log(
        `✉️ Sent reminder for receipt ${receipt.id} (${daysOverdue} days overdue) to ${tenant.email}`
      );

      return result;
    } catch (error) {
      console.error(`Failed to send reminder for receipt ${receipt.id}:`, error);
      throw error;
    }
  }

  /**
   * Update reminder count for a receipt
   */
  async updateReminderCount(receiptId) {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        UPDATE receipts 
        SET reminder_sent_count = reminder_sent_count + 1,
            last_reminder_sent_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      stmt.run([receiptId], function (err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ updated: this.changes });
      });

      stmt.finalize();
    });
  }

  /**
   * Manually trigger reminder check (for testing or manual execution)
   */
  async triggerManualCheck() {
    console.log('🔔 Manual reminder check triggered');
    return await this.checkAndSendReminders();
  }

  /**
   * Update scheduler configuration
   */
  updateConfig(newConfig) {
    // Task 4.5 (#41): validate cron expressions BEFORE touching state so an
    // invalid schedule keeps the previous configuration.
    if (
      newConfig.schedule !== undefined &&
      newConfig.schedule !== this.config.schedule &&
      !cron.validate(newConfig.schedule)
    ) {
      const err = new Error(`Invalid cron expression: ${newConfig.schedule}`);
      err.status = 400;
      throw err;
    }

    this.config = { ...this.config, ...newConfig };

    // Restart scheduler if it's running
    if (this.isRunning && this.config.enabled) {
      const restore = { ...this.config };
      try {
        this.stop();
        this.start();
      } catch (restartErr) {
        console.error(
          '⚠ Scheduler restart failed, restoring previous schedule:',
          restartErr.message
        );
        this.config = restore;
        this.stop();
        this.start();
      }
    } else if (this.isRunning && !this.config.enabled) {
      this.stop();
    }

    console.log('✅ Scheduler configuration updated:', this.config.schedule);
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      config: this.getConfig(),
      activeJobs: Array.from(this.jobs.keys()),
    };
  }

  /**
   * Get reminder statistics
   */
  async getStatistics(days = 30) {
    const db = getDatabase();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return new Promise((resolve, reject) => {
      db.get(
        `
        SELECT 
          COUNT(*) as total_receipts,
          SUM(CASE WHEN payment_status != 'paid' THEN 1 ELSE 0 END) as unpaid_receipts,
          SUM(reminder_sent_count) as total_reminders_sent,
          AVG(reminder_sent_count) as avg_reminders_per_receipt,
          MAX(reminder_sent_count) as max_reminders_sent
        FROM receipts
        WHERE created_at >= ?
      `,
        [startDate.toISOString()],
        (err, stats) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(stats);
        }
      );
    });
  }
}

// Export singleton instance
const reminderScheduler = new ReminderScheduler();

module.exports = reminderScheduler;
