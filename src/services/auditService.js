const AuditLog = require('../models/AuditLog');

const logAction = async (adminId, action, targetUserId = null, changes = null, ipAddress = null) => {
  try {
    const auditLog = new AuditLog({
      adminId,
      action,
      targetUserId,
      changes,
      ipAddress
    });
    
    await auditLog.save();
    return auditLog;
  } catch (error) {
    console.error('Audit logging error:', error);
    // Don't throw error to avoid breaking the main operation
  }
};

const getAuditLogs = async (page = 1, limit = 50) => {
  const skip = (page - 1) * limit;
  
  const logs = await AuditLog.find()
    .populate('adminId', 'email role')
    .populate('targetUserId', 'email role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
  const total = await AuditLog.countDocuments();
  
  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

module.exports = {
  logAction,
  getAuditLogs
};