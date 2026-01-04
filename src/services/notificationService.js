const notificationRepository = require('../repositories/notificationRepository');

class NotificationService {
  constructor() {
    this.offlineQueue = new Map(); // Store notifications for offline users
  }

  /**
   * Create and send a notification
   */
  async createNotification(notificationData) {
    try {
      // Validate required fields
      const { userId, type, title, message } = notificationData;
      
      if (!userId || !type || !title || !message) {
        throw new Error('MISSING_REQUIRED_FIELDS');
      }

      // Create notification in database
      const notification = await notificationRepository.createNotification(notificationData);

      // Try to send real-time notification
      await this.sendRealTimeNotification(notification);

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Send real-time notification via Socket.io
   */
  async sendRealTimeNotification(notification) {
    try {
      // Get Socket.io instance (will be injected later)
      const io = this.getSocketInstance();
      
      if (!io) {
        // Queue notification for offline user
        this.queueNotificationForOfflineUser(notification);
        return;
      }

      // Send to specific user if they're online
      const userSocketId = this.getUserSocketId(notification.userId);
      
      if (userSocketId) {
        io.to(userSocketId).emit('new_notification', {
          id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          data: notification.data,
          timestamp: notification.createdAt
        });
      } else {
        // User is offline, queue the notification
        this.queueNotificationForOfflineUser(notification);
      }
    } catch (error) {
      console.error('Error sending real-time notification:', error);
      // Don't throw error - notification is still saved in DB
    }
  }

  /**
   * Queue notification for offline user
   */
  queueNotificationForOfflineUser(notification) {
    const userId = notification.userId.toString();
    
    if (!this.offlineQueue.has(userId)) {
      this.offlineQueue.set(userId, []);
    }
    
    this.offlineQueue.get(userId).push({
      id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      data: notification.data,
      timestamp: notification.createdAt
    });

    // Limit queue size to prevent memory issues
    const queue = this.offlineQueue.get(userId);
    if (queue.length > 100) {
      queue.shift(); // Remove oldest notification
    }
  }

  /**
   * Send queued notifications when user comes online
   */
  async sendQueuedNotifications(userId, socketId) {
    try {
      const userIdStr = userId.toString();
      
      if (!this.offlineQueue.has(userIdStr)) {
        return;
      }

      const io = this.getSocketInstance();
      if (!io) return;

      const queuedNotifications = this.offlineQueue.get(userIdStr);
      
      // Send all queued notifications
      for (const notification of queuedNotifications) {
        io.to(socketId).emit('new_notification', notification);
      }

      // Clear the queue
      this.offlineQueue.delete(userIdStr);
      
      console.log(`Sent ${queuedNotifications.length} queued notifications to user ${userId}`);
    } catch (error) {
      console.error('Error sending queued notifications:', error);
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId, options = {}) {
    try {
      return await notificationRepository.getUserNotifications(userId, options);
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId) {
    try {
      return await notificationRepository.getUnreadCount(userId);
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(userId, notificationIds = null) {
    try {
      const result = await notificationRepository.markAsRead(userId, notificationIds);
      
      // Send real-time update about read status
      await this.sendReadStatusUpdate(userId, notificationIds);
      
      return result;
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  }

  /**
   * Send real-time update about read status
   */
  async sendReadStatusUpdate(userId, notificationIds) {
    try {
      const io = this.getSocketInstance();
      if (!io) return;

      const userSocketId = this.getUserSocketId(userId);
      if (!userSocketId) return;

      io.to(userSocketId).emit('notifications_read', {
        notificationIds: notificationIds || 'all',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error sending read status update:', error);
    }
  }

  /**
   * Delete notifications
   */
  async deleteNotifications(userId, notificationIds) {
    try {
      return await notificationRepository.deleteNotifications(userId, notificationIds);
    } catch (error) {
      console.error('Error deleting notifications:', error);
      throw error;
    }
  }

  /**
   * Create task-related notification
   */
  async createTaskNotification(taskData, type, recipientUserId) {
    const notificationMap = {
      'task_assigned': {
        title: 'New Task Assigned',
        message: `You have been assigned a new task: "${taskData.title}"`
      },
      'task_completed': {
        title: 'Task Completed',
        message: `Task "${taskData.title}" has been completed`
      },
      'task_due_soon': {
        title: 'Task Due Soon',
        message: `Task "${taskData.title}" is due soon`
      }
    };

    const notificationTemplate = notificationMap[type];
    if (!notificationTemplate) {
      throw new Error('INVALID_NOTIFICATION_TYPE');
    }

    return await this.createNotification({
      userId: recipientUserId,
      type,
      title: notificationTemplate.title,
      message: notificationTemplate.message,
      priority: type === 'task_due_soon' ? 'high' : 'medium',
      data: {
        taskId: taskData._id || taskData.id,
        taskTitle: taskData.title
      }
    });
  }

  /**
   * Create note-related notification
   */
  async createNoteNotification(noteData, type, recipientUserId) {
    const notificationMap = {
      'note_shared': {
        title: 'Note Shared',
        message: `A note "${noteData.title}" has been shared with you`
      },
      'note_updated': {
        title: 'Note Updated',
        message: `Note "${noteData.title}" has been updated`
      }
    };

    const notificationTemplate = notificationMap[type];
    if (!notificationTemplate) {
      throw new Error('INVALID_NOTIFICATION_TYPE');
    }

    return await this.createNotification({
      userId: recipientUserId,
      type,
      title: notificationTemplate.title,
      message: notificationTemplate.message,
      priority: 'medium',
      data: {
        noteId: noteData._id || noteData.id,
        noteTitle: noteData.title
      }
    });
  }

  /**
   * Create file-related notification
   */
  async createFileNotification(fileData, type, recipientUserId) {
    const notificationMap = {
      'file_uploaded': {
        title: 'File Uploaded',
        message: `New file uploaded: "${fileData.originalName}"`
      },
      'file_shared': {
        title: 'File Shared',
        message: `File "${fileData.originalName}" has been shared with you`
      }
    };

    const notificationTemplate = notificationMap[type];
    if (!notificationTemplate) {
      throw new Error('INVALID_NOTIFICATION_TYPE');
    }

    return await this.createNotification({
      userId: recipientUserId,
      type,
      title: notificationTemplate.title,
      message: notificationTemplate.message,
      priority: 'low',
      data: {
        fileId: fileData._id || fileData.id,
        fileName: fileData.originalName
      }
    });
  }

  /**
   * Create system notification
   */
  async createSystemNotification(title, message, userIds, priority = 'medium') {
    try {
      const notifications = userIds.map(userId => ({
        userId,
        type: 'system_alert',
        title,
        message,
        priority,
        data: {}
      }));

      return await notificationRepository.createBulkNotifications(notifications);
    } catch (error) {
      console.error('Error creating system notification:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(userId) {
    try {
      return await notificationRepository.getNotificationStats(userId);
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw error;
    }
  }

  /**
   * Clean up old notifications
   */
  async cleanupOldNotifications(daysOld = 30) {
    try {
      return await notificationRepository.cleanupOldNotifications(daysOld);
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      throw error;
    }
  }

  // Helper methods (to be implemented with Socket.io integration)
  getSocketInstance() {
    // This will be set when Socket.io is integrated
    return global.io || null;
  }

  getUserSocketId(userId) {
    // This will be implemented with Socket.io user tracking
    const io = this.getSocketInstance();
    if (!io || !io.userSockets) return null;
    
    return io.userSockets.get(userId.toString());
  }

  /**
   * Set Socket.io instance for real-time notifications
   */
  setSocketInstance(io) {
    global.io = io;
  }

  /**
   * Register user socket for notifications
   */
  registerUserSocket(userId, socketId) {
    const io = this.getSocketInstance();
    if (!io) return;

    if (!io.userSockets) {
      io.userSockets = new Map();
    }

    io.userSockets.set(userId.toString(), socketId);
    
    // Send queued notifications when user comes online
    this.sendQueuedNotifications(userId, socketId);
  }

  /**
   * Unregister user socket
   */
  unregisterUserSocket(userId) {
    const io = this.getSocketInstance();
    if (!io || !io.userSockets) return;

    io.userSockets.delete(userId.toString());
  }
}

module.exports = new NotificationService();