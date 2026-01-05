const notificationService = require('../services/notificationService');
const userPreferenceService = require('../services/userPreferenceService');

class NotificationController {
  /**
   * Get notifications for the authenticated user
   * GET /notifications
   */
  async getNotifications(req, res) {
    try {
      const userId = req.user.id;
      const {
        page = 1,
        limit = 20,
        unreadOnly = false,
        type = null,
        priority = null
      } = req.query;

      // Validate query parameters
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 per page
      const unreadOnlyBool = unreadOnly === 'true';

      const options = {
        page: pageNum,
        limit: limitNum,
        unreadOnly: unreadOnlyBool,
        type: type || null,
        priority: priority || null
      };

      const result = await notificationService.getUserNotifications(userId, options);

      res.json({
        success: true,
        data: {
          notifications: result.notifications,
          pagination: result.pagination
        }
      });
    } catch (error) {
      console.error('Error getting notifications:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve notifications'
        }
      });
    }
  }

  /**
   * Get unread notification count
   * GET /notifications/unread-count
   */
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;
      const count = await notificationService.getUnreadCount(userId);

      res.json({
        success: true,
        data: {
          unreadCount: count
        }
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get unread count'
        }
      });
    }
  }

  /**
   * Mark notification(s) as read
   * PUT /notifications/:id/read
   * PUT /notifications/read (mark all as read)
   */
  async markAsRead(req, res) {
    try {
      const userId = req.user.id;
      const notificationId = req.params.id;

      let result;
      
      if (notificationId && notificationId !== 'all') {
        // Mark specific notification as read
        result = await notificationService.markAsRead(userId, notificationId);
      } else {
        // Mark all notifications as read
        result = await notificationService.markAsRead(userId);
      }

      res.json({
        success: true,
        message: notificationId && notificationId !== 'all' 
          ? 'Notification marked as read' 
          : 'All notifications marked as read',
        data: {
          modifiedCount: result.modifiedCount
        }
      });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      
      if (error.message === 'NOTIFICATION_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOTIFICATION_NOT_FOUND',
            message: 'Notification not found'
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to mark notification as read'
        }
      });
    }
  }

  /**
   * Delete notification(s)
   * DELETE /notifications/:id
   * DELETE /notifications (delete all read notifications)
   */
  async deleteNotifications(req, res) {
    try {
      const userId = req.user.id;
      const notificationId = req.params.id;

      let result;
      
      if (notificationId) {
        // Delete specific notification
        result = await notificationService.deleteNotifications(userId, notificationId);
      } else {
        // This would be implemented to delete all read notifications
        // For now, we'll require specific notification ID
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Notification ID is required'
          }
        });
      }

      if (result.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOTIFICATION_NOT_FOUND',
            message: 'Notification not found'
          }
        });
      }

      res.json({
        success: true,
        message: 'Notification deleted successfully',
        data: {
          deletedCount: result.deletedCount
        }
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete notification'
        }
      });
    }
  }

  /**
   * Get notification statistics
   * GET /notifications/stats
   */
  async getNotificationStats(req, res) {
    try {
      const userId = req.user.id;
      const stats = await notificationService.getNotificationStats(userId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting notification stats:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get notification statistics'
        }
      });
    }
  }

  /**
   * Get user notification preferences
   * GET /user/preferences/notifications
   */
  async getNotificationPreferences(req, res) {
    try {
      const userId = req.user.id;
      const preferences = await userPreferenceService.getNotificationPreferences(userId);

      res.json({
        success: true,
        data: {
          preferences
        }
      });
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      
      if (error.message === 'USER_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get notification preferences'
        }
      });
    }
  }

  /**
   * Update user notification preferences
   * PUT /user/preferences/notifications
   */
  async updateNotificationPreferences(req, res) {
    try {
      const userId = req.user.id;
      const preferences = req.body;

      // Validate request body
      if (!preferences || typeof preferences !== 'object') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST_BODY',
            message: 'Valid preferences object is required'
          }
        });
      }

      const updatedPreferences = await userPreferenceService.updateNotificationPreferences(
        userId, 
        preferences
      );

      res.json({
        success: true,
        message: 'Notification preferences updated successfully',
        data: {
          preferences: updatedPreferences
        }
      });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      
      if (error.message === 'USER_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update notification preferences'
        }
      });
    }
  }

  /**
   * Get all user preferences (notifications + theme)
   * GET /user/preferences
   */
  async getAllPreferences(req, res) {
    try {
      const userId = req.user.id;
      const preferences = await userPreferenceService.getAllPreferences(userId);

      res.json({
        success: true,
        data: {
          preferences
        }
      });
    } catch (error) {
      console.error('Error getting all preferences:', error);
      
      if (error.message === 'USER_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get user preferences'
        }
      });
    }
  }

  /**
   * Update user theme preference
   * PUT /user/preferences/theme
   */
  async updateThemePreference(req, res) {
    try {
      const userId = req.user.id;
      const { theme } = req.body;

      if (!theme || !['light', 'dark'].includes(theme)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_THEME',
            message: 'Theme must be either "light" or "dark"'
          }
        });
      }

      const result = await userPreferenceService.updateThemePreference(userId, theme);

      res.json({
        success: true,
        message: 'Theme preference updated successfully',
        data: result
      });
    } catch (error) {
      console.error('Error updating theme preference:', error);
      
      if (error.message === 'USER_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update theme preference'
        }
      });
    }
  }

  /**
   * Reset notification preferences to defaults
   * POST /user/preferences/notifications/reset
   */
  async resetNotificationPreferences(req, res) {
    try {
      const userId = req.user.id;
      const preferences = await userPreferenceService.resetNotificationPreferences(userId);

      res.json({
        success: true,
        message: 'Notification preferences reset to defaults',
        data: {
          preferences
        }
      });
    } catch (error) {
      console.error('Error resetting notification preferences:', error);
      
      if (error.message === 'USER_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to reset notification preferences'
        }
      });
    }
  }
}

module.exports = new NotificationController();