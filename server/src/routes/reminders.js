/**
 * Reminder Routes
 * Task 1.2.3: Reminder Scheduling Service
 */

const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');

// GET /api/reminders/status - Get scheduler status
router.get('/status', reminderController.getStatus);

// GET /api/reminders/statistics - Get reminder statistics
router.get('/statistics', reminderController.getStatistics);

// POST /api/reminders/trigger - Manually trigger reminder check
router.post('/trigger', reminderController.triggerManualCheck);

// PUT /api/reminders/config - Update scheduler configuration
router.put('/config', reminderController.updateConfig);

// POST /api/reminders/start - Start scheduler
router.post('/start', reminderController.startScheduler);

// POST /api/reminders/stop - Stop scheduler
router.post('/stop', reminderController.stopScheduler);

module.exports = router;
