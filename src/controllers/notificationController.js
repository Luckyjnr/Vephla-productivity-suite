const notificationService = require('../services/notificationService');
const userPreferenceService = require('../services/userPreferenceService');

class NotificationController {
  /**
   * Get notifications for the authenticated user
   * GET /notifications
   */
  async getNotifications(req, res) {
    try {
      const userId = req.user.userId || req.user.id || req.user._id;
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
      const userId = req.user.userId || req.user.id || req.user._id;
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
      const userId = req.user.userId || req.user.id || req.user._id;
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
      const userId = req.user.userId || req.user.id || req.user._id;
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
      const userId = req.user.userId || req.user.id || req.user._id;
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
      const userId = req.user.userId || req.user.id || req.user._id;
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
      const userId = req.user.userId || req.user.id || req.user._id;
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
      const userId = req.user.userId || req.user.id || req.user._id;
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
      const userId = req.user.userId || req.user.id || req.user._id;
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
   * Test endpoint - Create a test notification
   * POST /notifications/test
   */
  async createTestNotification(req, res) {
    try {
      // Debug the user object
      console.log('🔍 req.user object:', req.user);
      
      const userId = req.user.userId || req.user.id || req.user._id;
      console.log('👤 Extracted userId:', userId);
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'USER_ID_MISSING',
            message: 'User ID not found in token',
            debug: { user: req.user }
          }
        });
      }
      
      console.log('🧪 Creating test notification for user:', userId);
      
      const notification = await notificationService.createNotification({
        userId,
        type: 'system_alert',
        title: 'Test Notification',
        message: 'This is a test notification to verify the system is working',
        priority: 'medium',
        data: { test: true }
      });

      res.json({
        success: true,
        message: 'Test notification created successfully',
        data: {
          notification: notification ? {
            id: notification._id,
            type: notification.type,
            title: notification.title,
            message: notification.message
          } : null
        }
      });
    } catch (error) {
      console.error('Error creating test notification:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create test notification',
          details: error.message
        }
      });
    }
  }
  async resetNotificationPreferences(req, res) {
    try {
      const userId = req.user.userId || req.user.id || req.user._id;
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

  /**
   * Migration endpoint - Fix user preferences structure
   * POST /user/preferences/migrate
   */
  async migrateUserPreferences(req, res) {
    try {
      const userId = req.user.userId || req.user.id || req.user._id;
      
      console.log('🔄 Migrating user preferences for user:', userId);
      
      const User = require('../models/User');
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User not found' }
        });
      }

      // Force reset preferences to correct structure
      user.preferences = {
        notifications: {
          enabled: true,
          types: {
            task_assigned: true,
            task_completed: true,
            task_due_soon: true,
            note_shared: true,
            note_updated: false,
            file_uploaded: true,
            file_shared: true,
            chat_mention: true,
            system_alert: true
          },
          delivery: {
            realtime: true,
            email: false
          }
        },
        theme: user.preferences?.theme || 'light'
      };

      await user.save();
      console.log('✅ User preferences migrated successfully');

      res.json({
        success: true,
        message: 'User preferences migrated successfully',
        data: {
          preferences: user.preferences
        }
      });
    } catch (error) {
      console.error('❌ Error migrating user preferences:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to migrate user preferences',
          details: error.message
        }
      });
    }
  }
}

module.exports = new NotificationController();