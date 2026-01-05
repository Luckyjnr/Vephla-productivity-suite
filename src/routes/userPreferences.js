const express = require('express');
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// User preference routes
router.get('/', notificationController.getAllPreferences);

// Migration endpoint
router.post('/migrate', notificationController.migrateUserPreferences);

// Notification preferences
router.get('/notifications', notificationController.getNotificationPreferences);
router.put('/notifications', notificationController.updateNotificationPreferences);
router.post('/notifications/reset', notificationController.resetNotificationPreferences);

// Theme preferences
router.put('/theme', notificationController.updateThemePreference);

module.exports = router;