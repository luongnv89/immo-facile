/**
 * Reminder Controller
 *
 * Handles manual reminder operations and scheduler management
 */

const reminderScheduler = require('../services/reminderScheduler');
const { ValidationError } = require('../utils/errors');

const reminderController = {
  /**
   * Get scheduler status
   * GET /api/reminders/status
   */
  async getStatus(req, res) {
    const status = reminderScheduler.getStatus();

    res.json({
      success: true,
      data: status,
    });
  },

  /**
   * Get reminder statistics
   * GET /api/reminders/statistics
   */
  async getStatistics(req, res) {
    const { days = 30 } = req.query;
    const stats = await reminderScheduler.getStatistics(parseInt(days));

    res.json({
      success: true,
      data: stats,
      period_days: parseInt(days),
    });
  },

  /**
   * Trigger manual reminder check
   * POST /api/reminders/trigger
   */
  async triggerManualCheck(req, res) {
    console.log('📬 Manual reminder check triggered by user');
    const result = await reminderScheduler.triggerManualCheck();

    res.json({
      success: true,
      data: result,
      message: `Reminder check complete: ${result.sent} sent, ${result.skipped} skipped, ${result.errors} errors`,
    });
  },

  /**
   * Update scheduler configuration
   * PUT /api/reminders/config
   */
  async updateConfig(req, res) {
    const { enabled, schedule, reminderDays, maxReminders, dueDay } = req.body;

    const newConfig = {};
    if (enabled !== undefined) newConfig.enabled = enabled;
    if (schedule) newConfig.schedule = schedule;
    if (reminderDays) newConfig.reminderDays = reminderDays;
    if (maxReminders !== undefined) newConfig.maxReminders = maxReminders;
    if (dueDay !== undefined) newConfig.dueDay = dueDay;

    try {
      reminderScheduler.updateConfig(newConfig);
    } catch (err) {
      if (err.status === 400) throw new ValidationError(err.message);
      throw err;
    }

    res.json({
      success: true,
      data: reminderScheduler.getConfig(),
      message: 'Scheduler configuration updated successfully',
    });
  },

  /**
   * Start scheduler
   * POST /api/reminders/start
   */
  async startScheduler(req, res) {
    reminderScheduler.start();

    res.json({
      success: true,
      message: 'Scheduler started successfully',
      data: reminderScheduler.getStatus(),
    });
  },

  /**
   * Stop scheduler
   * POST /api/reminders/stop
   */
  async stopScheduler(req, res) {
    reminderScheduler.stop();

    res.json({
      success: true,
      message: 'Scheduler stopped successfully',
      data: reminderScheduler.getStatus(),
    });
  },
};

module.exports = reminderController;
