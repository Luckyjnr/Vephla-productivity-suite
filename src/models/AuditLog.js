const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  changes: {
    type: Object
  },
  ipAddress: {
    type: String
  }
}, {
  timestamps: true
});

auditLogSchema.index({ adminId: 1, createdAt: -1 });
auditLogSchema.index({ targetUserId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);