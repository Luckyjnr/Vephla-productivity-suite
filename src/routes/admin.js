const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { getUsers, updateUserRole, getAuditLogs } = require('../controllers/adminController');
const { validateRoleUpdate, handleValidationErrors } = require('../utils/validators');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/users', getUsers);
router.put('/users/:id/role', validateRoleUpdate, handleValidationErrors, updateUserRole);
router.get('/audit-logs', getAuditLogs);

module.exports = router;