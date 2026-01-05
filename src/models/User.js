const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['standard', 'admin'],
    default: 'standard'
  },
  profile: {
    firstName: String,
    lastName: String,
    avatar: String
  },
  preferences: {
    notifications: {
      enabled: {
        type: Boolean,
        default: true
      },
      types: {
        task_assigned: { type: Boolean, default: true },
        task_completed: { type: Boolean, default: true },
        task_due_soon: { type: Boolean, default: true },
        note_shared: { type: Boolean, default: true },
        note_updated: { type: Boolean, default: false },
        file_uploaded: { type: Boolean, default: true },
        file_shared: { type: Boolean, default: true },
        chat_mention: { type: Boolean, default: true },
        system_alert: { type: Boolean, default: true }
      },
      delivery: {
        realtime: { type: Boolean, default: true },
        email: { type: Boolean, default: false }
      }
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    }
  },
  lastLoginAt: Date
}, {
  timestamps: true
});

userSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);