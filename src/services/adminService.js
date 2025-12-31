const User = require('../models/User');
const auditService = require('./auditService');

const getAllUsers = async (page = 1, limit = 50) => {
  const skip = (page - 1) * limit;
  
  const users = await User.find()
    .select('-passwordHash')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
  const total = await User.countDocuments();
  
  return {
    users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

const updateUserRole = async (adminId, targetUserId, newRole, ipAddress) => {
  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw new Error('USER_NOT_FOUND');
  }

  if (!['standard', 'admin'].includes(newRole)) {
    throw new Error('INVALID_ROLE');
  }

  const oldRole = targetUser.role;
  if (oldRole === newRole) {
    throw new Error('ROLE_UNCHANGED');
  }

  // Update user role
  targetUser.role = newRole;
  await targetUser.save();

  // Log the action
  await auditService.logAction(
    adminId,
    'role_change',
    targetUserId,
    { oldRole, newRole },
    ipAddress
  );

  return {
    user: {
      id: targetUser._id,
      email: targetUser.email,
      role: targetUser.role,
      updatedAt: targetUser.updatedAt
    }
  };
};

module.exports = {
  getAllUsers,
  updateUserRole
};