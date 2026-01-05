const express = require('express');
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of notifications per page
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [task_created, task_completed, note_created, system_alert]
 *         description: Filter by notification type
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     notifications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notification'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: number
 *                           example: 1
 *                         limit:
 *                           type: number
 *                           example: 10
 *                         total:
 *                           type: number
 *                           example: 25
 *                         pages:
 *                           type: number
 *                           example: 3
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', notificationController.getNotifications);

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     unreadCount:
 *                       type: number
 *                       example: 5
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/unread-count', notificationController.getUnreadCount);

/**
 * @swagger
 * /notifications/stats:
 *   get:
 *     summary: Get notification statistics
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Notification statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalNotifications:
 *                       type: number
 *                       example: 50
 *                     unreadNotifications:
 *                       type: number
 *                       example: 5
 *                     readNotifications:
 *                       type: number
 *                       example: 45
 *                     notificationsByType:
 *                       type: object
 *                       example: { "task_created": 20, "task_completed": 15, "note_created": 10, "system_alert": 5 }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/stats', notificationController.getNotificationStats);

/**
 * @swagger
 * /notifications/test:
 *   post:
 *     summary: Create test notification (development only)
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [task_created, task_completed, note_created, system_alert]
 *                 example: system_alert
 *               title:
 *                 type: string
 *                 example: Test Notification
 *               message:
 *                 type: string
 *                 example: This is a test notification
 *     responses:
 *       201:
 *         description: Test notification created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Test notification created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/test', notificationController.createTestNotification);

/**
 * @swagger
 * /notifications/read:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: All notifications marked as read
 *                 data:
 *                   type: object
 *                   properties:
 *                     updatedCount:
 *                       type: number
 *                       example: 5
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/read', notificationController.markAsRead);

/**
 * @swagger
 * /notifications/{id}/read:
 *   put:
 *     summary: Mark specific notification as read
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Notification marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Notification marked as read
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:id/read', notificationController.markAsRead);

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Notification deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id', notificationController.deleteNotifications);

/**
 * @swagger
 * /notifications/preferences:
 *   get:
 *     summary: Get all user preferences
 *     tags: [User Preferences]
 *     responses:
 *       200:
 *         description: User preferences retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     notifications:
 *                       type: object
 *                       properties:
 *                         email:
 *                           type: boolean
 *                           example: true
 *                         push:
 *                           type: boolean
 *                           example: true
 *                         taskCreated:
 *                           type: boolean
 *                           example: true
 *                         taskCompleted:
 *                           type: boolean
 *                           example: true
 *                         noteCreated:
 *                           type: boolean
 *                           example: false
 *                     theme:
 *                       type: string
 *                       enum: [light, dark, auto]
 *                       example: dark
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/preferences', notificationController.getAllPreferences);

/**
 * @swagger
 * /notifications/preferences/notifications:
 *   get:
 *     summary: Get notification preferences
 *     tags: [User Preferences]
 *     responses:
 *       200:
 *         description: Notification preferences retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: boolean
 *                       example: true
 *                     push:
 *                       type: boolean
 *                       example: true
 *                     taskCreated:
 *                       type: boolean
 *                       example: true
 *                     taskCompleted:
 *                       type: boolean
 *                       example: true
 *                     noteCreated:
 *                       type: boolean
 *                       example: false
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   put:
 *     summary: Update notification preferences
 *     tags: [User Preferences]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: boolean
 *                 example: true
 *               push:
 *                 type: boolean
 *                 example: true
 *               taskCreated:
 *                 type: boolean
 *                 example: true
 *               taskCompleted:
 *                 type: boolean
 *                 example: true
 *               noteCreated:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Notification preferences updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Notification preferences updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: boolean
 *                       example: true
 *                     push:
 *                       type: boolean
 *                       example: true
 *                     taskCreated:
 *                       type: boolean
 *                       example: true
 *                     taskCompleted:
 *                       type: boolean
 *                       example: true
 *                     noteCreated:
 *                       type: boolean
 *                       example: false
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/preferences/notifications', notificationController.getNotificationPreferences);
router.put('/preferences/notifications', notificationController.updateNotificationPreferences);

/**
 * @swagger
 * /notifications/preferences/theme:
 *   put:
 *     summary: Update theme preference
 *     tags: [User Preferences]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - theme
 *             properties:
 *               theme:
 *                 type: string
 *                 enum: [light, dark, auto]
 *                 example: dark
 *     responses:
 *       200:
 *         description: Theme preference updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Theme preference updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     theme:
 *                       type: string
 *                       example: dark
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/preferences/theme', notificationController.updateThemePreference);

/**
 * @swagger
 * /notifications/preferences/notifications/reset:
 *   post:
 *     summary: Reset notification preferences to defaults
 *     tags: [User Preferences]
 *     responses:
 *       200:
 *         description: Notification preferences reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Notification preferences reset to defaults
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: boolean
 *                       example: true
 *                     push:
 *                       type: boolean
 *                       example: true
 *                     taskCreated:
 *                       type: boolean
 *                       example: true
 *                     taskCompleted:
 *                       type: boolean
 *                       example: true
 *                     noteCreated:
 *                       type: boolean
 *                       example: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/preferences/notifications/reset', notificationController.resetNotificationPreferences);

module.exports = router;