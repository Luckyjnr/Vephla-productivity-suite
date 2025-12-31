const adminService = require('../services/adminService');
const auditService = require('../services/auditService');

const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const result = await adminService.getAllUsers(page, limit);
    res.json(result);

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { id: targetUserId } = req.params;
    const { role: newRole } = req.body;
    const adminId = req.user.userId;
    const ipAddress = req.ip || req.connection.remoteAddress;

    if (!newRole) {
      return res.status(400).json({
        error: {
          code: 'MISSING_ROLE',
          message: 'Role is required'
        }
      });
    }

    const result = await adminService.updateUserRole(adminId, targetUserId, newRole, ipAddress);
    res.json(result);

  } catch (error) {
    console.error('Update user role error:', error);

    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    if (error.message === 'INVALID_ROLE') {
      return res.status(400).json({
        error: {
          code: 'INVALID_ROLE',
          message: 'Role must be either standard or admin'
        }
      });
    }

    if (error.message === 'ROLE_UNCHANGED') {
      return res.status(400).json({
        error: {
          code: 'ROLE_UNCHANGED',
          message: 'User already has this role'
        }
      });
    }

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const result = await auditService.getAuditLogs(page, limit);
    res.json(result);

  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
};

module.exports = {
  getUsers,
  updateUserRole,
  getAuditLogs
};