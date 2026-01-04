const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'task_assigned',
      'task_completed', 
      'task_due_soon',
      'note_shared',
      'note_updated',
      'file_uploaded',
      'file_shared',
      'chat_mention',
      'system_alert',
      'user_joined',
      'user_left'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  expiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for notification age
notificationSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Virtual for formatted timestamp
notificationSchema.virtual('formattedTimestamp').get(function() {
  return this.createdAt.toISOString();
});

// Ensure virtuals are included in JSON output
notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });

// Static method to get unread count for a user
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ userId, isRead: false });
};

// Static method to get notifications for a user with pagination
notificationSchema.statics.getUserNotifications = function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    unreadOnly = false,
    type = null
  } = options;

  const query = { userId };
  
  if (unreadOnly) {
    query.isRead = false;
  }
  
  if (type) {
    query.type = type;
  }

  const skip = (page - 1) * limit;

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

// Static method to mark notifications as read
notificationSchema.statics.markAsRead = function(userId, notificationIds = null) {
  const query = { userId };
  
  if (notificationIds) {
    query._id = { $in: notificationIds };
  }

  return this.updateMany(query, { 
    isRead: true,
    readAt: new Date()
  });
};

// Static method to clean up old notifications
notificationSchema.statics.cleanupOldNotifications = function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    isRead: true
  });
};

// Instance method to format notification for client
notificationSchema.methods.toClientFormat = function() {
  return {
    id: this._id,
    type: this.type,
    title: this.title,
    message: this.message,
    isRead: this.isRead,
    priority: this.priority,
    data: this.data,
    timestamp: this.createdAt.toISOString(),
    age: this.age
  };
};

// Pre-save middleware
notificationSchema.pre('save', function(next) {
  // Set expiration for certain notification types
  if (!this.expiresAt) {
    switch (this.type) {
      case 'task_due_soon':
        // Expire 1 day after creation
        this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        break;
      case 'system_alert':
        // Expire 7 days after creation
        this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        // Most notifications expire after 30 days
        this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  }
  
  next();
});

module.exports = mongoose.model('Notification', notificationSchema);