const express = require('express');
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Notification routes
router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.get('/stats', notificationController.getNotificationStats);

// Mark notifications as read
router.put('/read', notificationController.markAsRead); // Mark all as read
router.put('/:id/read', notificationController.markAsRead); // Mark specific as read

// Delete notifications
router.delete('/:id', notificationController.deleteNotifications);

// User preference routes
router.get('/preferences', notificationController.getAllPreferences);
router.get('/preferences/notifications', notificationController.getNotificationPreferences);
router.put('/preferences/notifications', notificationController.updateNotificationPreferences);
router.put('/preferences/theme', notificationController.updateThemePreference);
router.post('/preferences/notifications/reset', notificationController.resetNotificationPreferences);

module.exports = router;