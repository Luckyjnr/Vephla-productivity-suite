const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.messageType !== 'system';
    }
  },
  room: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  messageType: {
    type: String,
    enum: ['text', 'system', 'notification'],
    default: 'text'
  },
  metadata: {
    edited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
messageSchema.index({ room: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ room: 1, messageType: 1, createdAt: -1 });

// Virtual for formatted timestamp
messageSchema.virtual('formattedTimestamp').get(function() {
  return this.createdAt.toISOString();
});

// Virtual to populate sender info
messageSchema.virtual('senderInfo', {
  ref: 'User',
  localField: 'sender',
  foreignField: '_id',
  justOne: true,
  select: 'email role name'
});

// Ensure virtuals are included in JSON output
messageSchema.set('toJSON', { virtuals: true });
messageSchema.set('toObject', { virtuals: true });

// Pre-save middleware for validation
messageSchema.pre('save', function(next) {
  // Validate room format (should be like 'general', 'project-123', etc.)
  if (this.room && !/^[a-zA-Z0-9\-_]+$/.test(this.room)) {
    return next(new Error('Room name can only contain letters, numbers, hyphens, and underscores'));
  }
  
  // Set editedAt if message is being edited
  if (this.isModified('content') && !this.isNew) {
    this.metadata.edited = true;
    this.metadata.editedAt = new Date();
  }
  
  next();
});

// Static method to get recent messages for a room
messageSchema.statics.getRecentMessages = function(room, limit = 50) {
  return this.find({ room })
    .populate('sender', 'email role name')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

// Static method to get message history with pagination
messageSchema.statics.getMessageHistory = function(room, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  return this.find({ room })
    .populate('sender', 'email role name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

// Instance method to format message for client
messageSchema.methods.toClientFormat = function() {
  const senderInfo = this.sender ? {
    id: this.sender._id || this.sender,
    email: this.sender.email,
    role: this.sender.role,
    name: this.sender.name
  } : null;

  return {
    id: this._id,
    content: this.content,
    sender: senderInfo,
    room: this.room,
    messageType: this.messageType,
    timestamp: this.createdAt.toISOString(),
    edited: this.metadata.edited,
    editedAt: this.metadata.editedAt?.toISOString()
  };
};

module.exports = mongoose.model('Message', messageSchema);