const Notification = require('../models/Notification');

class NotificationRepository {
  /**
   * Create a new notification
   */
  async createNotification(notificationData) {
    try {
      const notification = new Notification(notificationData);
      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a user with pagination and filtering
   */
  async getUserNotifications(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        unreadOnly = false,
        type = null,
        priority = null
      } = options;

      const query = { userId };
      
      if (unreadOnly) {
        query.isRead = false;
      }
      
      if (type) {
        query.type = type;
      }

      if (priority) {
        query.priority = priority;
      }

      const skip = (page - 1) * limit;

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Notification.countDocuments(query);

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId) {
    try {
      return await Notification.countDocuments({ 
        userId, 
        isRead: false 
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  /**
   * Mark notification(s) as read
   */
  async markAsRead(userId, notificationIds = null) {
    try {
      const query = { userId };
      
      if (notificationIds) {
        // Mark specific notifications as read
        if (Array.isArray(notificationIds)) {
          query._id = { $in: notificationIds };
        } else {
          query._id = notificationIds;
        }
      }

      const result = await Notification.updateMany(query, { 
        isRead: true,
        readAt: new Date()
      });

      return result;
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete notification(s)
   */
  async deleteNotifications(userId, notificationIds) {
    try {
      const query = { userId };
      
      if (Array.isArray(notificationIds)) {
        query._id = { $in: notificationIds };
      } else {
        query._id = notificationIds;
      }

      const result = await Notification.deleteMany(query);
      return result;
    } catch (error) {
      console.error('Error deleting notifications:', error);
      throw error;
    }
  }

  /**
   * Get notification by ID (with user ownership check)
   */
  async getNotificationById(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        _id: notificationId,
        userId
      });

      return notification;
    } catch (error) {
      console.error('Error getting notification by ID:', error);
      throw error;
    }
  }

  /**
   * Get notifications by type for a user
   */
  async getNotificationsByType(userId, type, options = {}) {
    try {
      const { limit = 10, unreadOnly = false } = options;

      const query = { userId, type };
      
      if (unreadOnly) {
        query.isRead = false;
      }

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return notifications;
    } catch (error) {
      console.error('Error getting notifications by type:', error);
      throw error;
    }
  }

  /**
   * Clean up old read notifications
   */
  async cleanupOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const result = await Notification.deleteMany({
        createdAt: { $lt: cutoffDate },
        isRead: true
      });

      console.log(`Cleaned up ${result.deletedCount} old notifications`);
      return result;
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics for a user
   */
  async getNotificationStats(userId) {
    try {
      const stats = await Notification.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            unread: {
              $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
            },
            byType: {
              $push: {
                type: '$type',
                isRead: '$isRead'
              }
            }
          }
        }
      ]);

      if (stats.length === 0) {
        return {
          total: 0,
          unread: 0,
          byType: {}
        };
      }

      // Process type statistics
      const typeStats = {};
      stats[0].byType.forEach(item => {
        if (!typeStats[item.type]) {
          typeStats[item.type] = { total: 0, unread: 0 };
        }
        typeStats[item.type].total++;
        if (!item.isRead) {
          typeStats[item.type].unread++;
        }
      });

      return {
        total: stats[0].total,
        unread: stats[0].unread,
        byType: typeStats
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw error;
    }
  }

  /**
   * Create bulk notifications for multiple users
   */
  async createBulkNotifications(notifications) {
    try {
      const result = await Notification.insertMany(notifications);
      return result;
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      throw error;
    }
  }
}

module.exports = new NotificationRepository();