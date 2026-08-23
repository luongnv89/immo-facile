/**
 * Reminder Controller
 * Task 1.2.3: Reminder Scheduling Service
 *
 * Handles manual reminder operations and scheduler management
 */

const reminderScheduler = require('../services/reminderScheduler');

const reminderController = {
  /**
   * Get scheduler status
   * GET /api/reminders/status
   */
  async getStatus(req, res) {
    try {
      const status = reminderScheduler.getStatus();

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      console.error('Error fetching scheduler status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch scheduler status',
        message: error.message,
      });
    }
  },

  /**
   * Get reminder statistics
   * GET /api/reminders/statistics
   */
  async getStatistics(req, res) {
    try {
      const { days = 30 } = req.query;
      const stats = await reminderScheduler.getStatistics(parseInt(days));

      res.json({
        success: true,
        data: stats,
        period_days: parseInt(days),
      });
    } catch (error) {
      console.error('Error fetching reminder statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch statistics',
        message: error.message,
      });
    }
  },

  /**
   * Trigger manual reminder check
   * POST /api/reminders/trigger
   */
  async triggerManualCheck(req, res) {
    try {
      console.log('📬 Manual reminder check triggered by user');
      const result = await reminderScheduler.triggerManualCheck();

      res.json({
        success: true,
        data: result,
        message: `Reminder check complete: ${result.sent} sent, ${result.skipped} skipped, ${result.errors} errors`,
      });
    } catch (error) {
      console.error('Error triggering manual reminder check:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to trigger reminder check',
        message: error.message,
      });
    }
  },

  /**
   * Update scheduler configuration
   * PUT /api/reminders/config
   */
  async updateConfig(req, res) {
    try {
      const { enabled, schedule, reminderDays, maxReminders, dueDay } = req.body;

      const newConfig = {};
      if (enabled !== undefined) newConfig.enabled = enabled;
      if (schedule) newConfig.schedule = schedule;
      if (reminderDays) newConfig.reminderDays = reminderDays;
      if (maxReminders !== undefined) newConfig.maxReminders = maxReminders;
      if (dueDay !== undefined) newConfig.dueDay = dueDay;

      reminderScheduler.updateConfig(newConfig);

      res.json({
        success: true,
        data: reminderScheduler.getConfig(),
        message: 'Scheduler configuration updated successfully',
      });
    } catch (error) {
      console.error('Error updating scheduler configuration:', error);
      if (error.status === 400) {
        return res.status(400).json({
          success: false,
          error: 'Invalid configuration',
          message: error.message,
        });
      }
      res.status(500).json({
        success: false,
        error: 'Failed to update configuration',
        message: error.message,
      });
    }
  },

  /**
   * Start scheduler
   * POST /api/reminders/start
   */
  async startScheduler(req, res) {
    try {
      reminderScheduler.start();

      res.json({
        success: true,
        message: 'Scheduler started successfully',
        data: reminderScheduler.getStatus(),
      });
    } catch (error) {
      console.error('Error starting scheduler:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start scheduler',
        message: error.message,
      });
    }
  },

  /**
   * Stop scheduler
   * POST /api/reminders/stop
   */
  async stopScheduler(req, res) {
    try {
      reminderScheduler.stop();

      res.json({
        success: true,
        message: 'Scheduler stopped successfully',
        data: reminderScheduler.getStatus(),
      });
    } catch (error) {
      console.error('Error stopping scheduler:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to stop scheduler',
        message: error.message,
      });
    }
  },
};

module.exports = reminderController;
