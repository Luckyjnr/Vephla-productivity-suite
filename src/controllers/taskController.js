const taskService = require('../services/taskService');

/**
 * Create a new task
 * POST /tasks
 */
const createTask = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { title, description, status, priority, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({
        error: {
          code: 'MISSING_TITLE',
          message: 'Title is required'
        }
      });
    }

    const result = await taskService.createTask(userId, {
      title,
      description,
      status,
      priority,
      dueDate
    });

    res.status(201).json(result);

  } catch (error) {
    console.error('Create task error:', error);

    if (error.message === 'INVALID_TITLE') {
      return res.status(400).json({
        error: {
          code: 'INVALID_TITLE',
          message: 'Title must be between 1 and 200 characters'
        }
      });
    }

    if (error.message === 'INVALID_DESCRIPTION') {
      return res.status(400).json({
        error: {
          code: 'INVALID_DESCRIPTION',
          message: 'Description must be less than 1000 characters'
        }
      });
    }

    if (error.message === 'INVALID_STATUS') {
      return res.status(400).json({
        error: {
          code: 'INVALID_STATUS',
          message: 'Status must be pending, in-progress, or completed'
        }
      });
    }

    if (error.message === 'INVALID_PRIORITY') {
      return res.status(400).json({
        error: {
          code: 'INVALID_PRIORITY',
          message: 'Priority must be low, medium, or high'
        }
      });
    }

    if (error.message === 'INVALID_DUE_DATE') {
      return res.status(400).json({
        error: {
          code: 'INVALID_DUE_DATE',
          message: 'Due date must be a valid date'
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

/**
 * Get tasks with filtering and pagination
 * GET /tasks
 */
const getTasks = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      page,
      limit,
      status,
      priority,
      overdue,
      dueDateFrom,
      dueDateTo,
      sortBy,
      sortOrder
    } = req.query;

    const result = await taskService.getTasks(userId, {
      page,
      limit,
      status,
      priority,
      overdue,
      dueDateFrom,
      dueDateTo,
      sortBy,
      sortOrder
    });

    res.json(result);

  } catch (error) {
    console.error('Get tasks error:', error);

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
};

/**
 * Get a single task by ID
 * GET /tasks/:id
 */
const getTaskById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id: taskId } = req.params;

    const result = await taskService.getTaskById(userId, taskId);
    res.json(result);

  } catch (error) {
    console.error('Get task by ID error:', error);

    if (error.message === 'INVALID_TASK_ID') {
      return res.status(400).json({
        error: {
          code: 'INVALID_TASK_ID',
          message: 'Invalid task ID format'
        }
      });
    }

    if (error.message === 'TASK_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'TASK_NOT_FOUND',
          message: 'Task not found or access denied'
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

/**
 * Update a task
 * PUT /tasks/:id
 */
const updateTask = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id: taskId } = req.params;
    const { title, description, status, priority, dueDate } = req.body;

    const result = await taskService.updateTask(userId, taskId, {
      title,
      description,
      status,
      priority,
      dueDate
    });

    res.json(result);

  } catch (error) {
    console.error('Update task error:', error);

    if (error.message === 'INVALID_TASK_ID') {
      return res.status(400).json({
        error: {
          code: 'INVALID_TASK_ID',
          message: 'Invalid task ID format'
        }
      });
    }

    if (error.message === 'TASK_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'TASK_NOT_FOUND',
          message: 'Task not found or access denied'
        }
      });
    }

    if (error.message === 'INVALID_TITLE') {
      return res.status(400).json({
        error: {
          code: 'INVALID_TITLE',
          message: 'Title must be between 1 and 200 characters'
        }
      });
    }

    if (error.message === 'INVALID_DESCRIPTION') {
      return res.status(400).json({
        error: {
          code: 'INVALID_DESCRIPTION',
          message: 'Description must be less than 1000 characters'
        }
      });
    }

    if (error.message === 'INVALID_STATUS') {
      return res.status(400).json({
        error: {
          code: 'INVALID_STATUS',
          message: 'Status must be pending, in-progress, or completed'
        }
      });
    }

    if (error.message === 'INVALID_PRIORITY') {
      return res.status(400).json({
        error: {
          code: 'INVALID_PRIORITY',
          message: 'Priority must be low, medium, or high'
        }
      });
    }

    if (error.message === 'INVALID_DUE_DATE') {
      return res.status(400).json({
        error: {
          code: 'INVALID_DUE_DATE',
          message: 'Due date must be a valid date'
        }
      });
    }

    if (error.message === 'INVALID_STATUS_TRANSITION') {
      return res.status(400).json({
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: 'Invalid status transition'
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

/**
 * Delete a task
 * DELETE /tasks/:id
 */
const deleteTask = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id: taskId } = req.params;

    const result = await taskService.deleteTask(userId, taskId);
    res.json(result);

  } catch (error) {
    console.error('Delete task error:', error);

    if (error.message === 'INVALID_TASK_ID') {
      return res.status(400).json({
        error: {
          code: 'INVALID_TASK_ID',
          message: 'Invalid task ID format'
        }
      });
    }

    if (error.message === 'TASK_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'TASK_NOT_FOUND',
          message: 'Task not found or access denied'
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

/**
 * Mark task as completed
 * PATCH /tasks/:id/complete
 */
const completeTask = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id: taskId } = req.params;

    const result = await taskService.completeTask(userId, taskId);
    res.json(result);

  } catch (error) {
    console.error('Complete task error:', error);

    if (error.message === 'INVALID_TASK_ID') {
      return res.status(400).json({
        error: {
          code: 'INVALID_TASK_ID',
          message: 'Invalid task ID format'
        }
      });
    }

    if (error.message === 'TASK_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'TASK_NOT_FOUND',
          message: 'Task not found or access denied'
        }
      });
    }

    if (error.message === 'TASK_ALREADY_COMPLETED') {
      return res.status(400).json({
        error: {
          code: 'TASK_ALREADY_COMPLETED',
          message: 'Task is already completed'
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

/**
 * Get task statistics
 * GET /tasks/stats
 */
const getTaskStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await taskService.getTaskStats(userId);
    res.json(result);

  } catch (error) {
    console.error('Get task stats error:', error);

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
};

/**
 * Get overdue tasks
 * GET /tasks/overdue
 */
const getOverdueTasks = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await taskService.getOverdueTasks(userId);
    res.json(result);

  } catch (error) {
    console.error('Get overdue tasks error:', error);

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
};

/**
 * Get upcoming tasks
 * GET /tasks/upcoming
 */
const getUpcomingTasks = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { days } = req.query;

    const result = await taskService.getUpcomingTasks(userId, days);
    res.json(result);

  } catch (error) {
    console.error('Get upcoming tasks error:', error);

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
};

/**
 * Get tasks by status
 * GET /tasks/status/:status
 */
const getTasksByStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.params;
    const { limit, sortBy, sortOrder } = req.query;

    const result = await taskService.getTasksByStatus(userId, status, {
      limit,
      sortBy,
      sortOrder
    });

    res.json(result);

  } catch (error) {
    console.error('Get tasks by status error:', error);

    if (error.message === 'INVALID_STATUS') {
      return res.status(400).json({
        error: {
          code: 'INVALID_STATUS',
          message: 'Status must be pending, in-progress, or completed'
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

/**
 * Bulk update task status
 * PATCH /tasks/bulk/status
 */
const bulkUpdateStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { taskIds, status } = req.body;

    if (!taskIds || !Array.isArray(taskIds)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'taskIds array is required'
        }
      });
    }

    if (!status) {
      return res.status(400).json({
        error: {
          code: 'MISSING_STATUS',
          message: 'Status is required'
        }
      });
    }

    const result = await taskService.bulkUpdateStatus(userId, taskIds, status);
    res.json(result);

  } catch (error) {
    console.error('Bulk update status error:', error);

    if (error.message === 'INVALID_TASK_IDS') {
      return res.status(400).json({
        error: {
          code: 'INVALID_TASK_IDS',
          message: 'Invalid task IDs provided'
        }
      });
    }

    if (error.message === 'TOO_MANY_TASKS') {
      return res.status(400).json({
        error: {
          code: 'TOO_MANY_TASKS',
          message: 'Maximum 50 tasks can be updated at once'
        }
      });
    }

    if (error.message === 'INVALID_STATUS') {
      return res.status(400).json({
        error: {
          code: 'INVALID_STATUS',
          message: 'Status must be pending, in-progress, or completed'
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

module.exports = {
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
};