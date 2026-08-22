/**
 * Reminder Routes
 * Task 1.2.3: Reminder Scheduling Service
 */

const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const { requireAdmin } = require('../middleware/auth');

// GET /api/reminders/status - Get scheduler status
router.get('/status', reminderController.getStatus);

// GET /api/reminders/statistics - Get reminder statistics
router.get('/statistics', reminderController.getStatistics);

// Scheduler control is admin-only (#16)
router.post('/trigger', requireAdmin, reminderController.triggerManualCheck);
router.put('/config', requireAdmin, reminderController.updateConfig);
router.post('/start', requireAdmin, reminderController.startScheduler);
router.post('/stop', requireAdmin, reminderController.stopScheduler);

module.exports = router;
