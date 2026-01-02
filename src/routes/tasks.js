const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  completeTask,
  getTaskStats,
  getOverdueTasks,
  getUpcomingTasks,
  getTasksByStatus,
  bulkUpdateStatus
} = require('../controllers/taskController');

const router = express.Router();

// All task routes require authentication
router.use(authenticateToken);

// Task statistics and specialized queries (must come before /:id routes)
router.get('/stats', getTaskStats);
router.get('/overdue', getOverdueTasks);
router.get('/upcoming', getUpcomingTasks);

// Bulk operations
router.patch('/bulk/status', bulkUpdateStatus);

// Status-based queries
router.get('/status/:status', getTasksByStatus);

// CRUD operations
router.post('/', createTask);
router.get('/', getTasks);
router.get('/:id', getTaskById);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

// Task completion
router.patch('/:id/complete', completeTask);

module.exports = router;