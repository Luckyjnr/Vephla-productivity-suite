const taskRepository = require('../repositories/taskRepository');
const notificationService = require('./notificationService');
const { 
  validateTaskTitle, 
  validateTaskDescription, 
  validateTaskStatus,
  validateTaskPriority,
  validateDueDate,
  sanitizeNote 
} = require('../utils/validators');

class TaskService {
  /**
   * Create a new task
   * @param {string} userId - User ID
   * @param {Object} taskData - Task data
   * @returns {Promise<Object>} Created task
   */
  async createTask(userId, taskData) {
    const { title, description, status = 'pending', priority = 'medium', dueDate } = taskData;

    // Validate input
    if (!validateTaskTitle(title)) {
      throw new Error('INVALID_TITLE');
    }

    if (description && !validateTaskDescription(description)) {
      throw new Error('INVALID_DESCRIPTION');
    }

    if (!validateTaskStatus(status)) {
      throw new Error('INVALID_STATUS');
    }

    if (!validateTaskPriority(priority)) {
      throw new Error('INVALID_PRIORITY');
    }

    if (dueDate && !validateDueDate(dueDate)) {
      throw new Error('INVALID_DUE_DATE');
    }

    // Sanitize input
    const sanitizedTitle = sanitizeNote(title.trim());
    const sanitizedDescription = description ? sanitizeNote(description.trim()) : undefined;

    // Create task
    const taskToCreate = {
      title: sanitizedTitle,
      description: sanitizedDescription,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      userId
    };

    const createdTask = await taskRepository.create(taskToCreate);
    
    // Send notification if task is assigned to someone (future feature)
    // For now, we'll send a notification to the task creator
    try {
      await notificationService.createTaskNotification(
        createdTask,
        'task_assigned',
        userId
      );
    } catch (notificationError) {
      console.error('Failed to send task creation notification:', notificationError);
      // Don't fail the task creation if notification fails
    }
    
    return {
      message: 'Task created successfully',
      task: this._formatTaskResponse(createdTask)
    };
  }

  /**
   * Get tasks for a user with filtering and sorting
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Tasks with pagination
   */
  async getTasks(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      status = [],
      priority = [],
      overdue = null,
      dueDateFrom,
      dueDateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    // Validate pagination parameters
    const validatedPage = Math.max(1, parseInt(page));
    const validatedLimit = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 per page

    // Validate sort parameters
    const validSortFields = ['createdAt', 'updatedAt', 'title', 'dueDate', 'priority', 'status'];
    const validatedSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const validatedSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';

    // Parse status and priority arrays
    const parsedStatus = Array.isArray(status) ? status : (status ? status.split(',') : []);
    const parsedPriority = Array.isArray(priority) ? priority : (priority ? priority.split(',') : []);

    // Validate status and priority values
    const validStatuses = ['pending', 'in-progress', 'completed'];
    const validPriorities = ['low', 'medium', 'high'];
    
    const filteredStatus = parsedStatus.filter(s => validStatuses.includes(s));
    const filteredPriority = parsedPriority.filter(p => validPriorities.includes(p));

    const queryOptions = {
      page: validatedPage,
      limit: validatedLimit,
      status: filteredStatus,
      priority: filteredPriority,
      overdue: overdue === 'true' ? true : (overdue === 'false' ? false : null),
      dueDateFrom,
      dueDateTo,
      sortBy: validatedSortBy,
      sortOrder: validatedSortOrder
    };

    const result = await taskRepository.findByUserId(userId, queryOptions);

    return {
      tasks: result.tasks.map(task => this._formatTaskResponse(task)),
      pagination: result.pagination,
      filters: {
        status: filteredStatus,
        priority: filteredPriority,
        overdue: queryOptions.overdue,
        dueDateFrom,
        dueDateTo,
        sortBy: validatedSortBy,
        sortOrder: validatedSortOrder
      }
    };
  }

  /**
   * Get a single task by ID
   * @param {string} userId - User ID
   * @param {string} taskId - Task ID
   * @returns {Promise<Object>} Task
   */
  async getTaskById(userId, taskId) {
    if (!taskId || typeof taskId !== 'string') {
      throw new Error('INVALID_TASK_ID');
    }

    const task = await taskRepository.findByIdAndUserId(taskId, userId);
    
    if (!task) {
      throw new Error('TASK_NOT_FOUND');
    }

    return {
      task: this._formatTaskResponse(task)
    };
  }

  /**
   * Update a task
   * @param {string} userId - User ID
   * @param {string} taskId - Task ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated task
   */
  async updateTask(userId, taskId, updateData) {
    if (!taskId || typeof taskId !== 'string') {
      throw new Error('INVALID_TASK_ID');
    }

    const { title, description, status, priority, dueDate } = updateData;
    const updateFields = {};

    // Validate and sanitize title if provided
    if (title !== undefined) {
      if (!validateTaskTitle(title)) {
        throw new Error('INVALID_TITLE');
      }
      updateFields.title = sanitizeNote(title.trim());
    }

    // Validate and sanitize description if provided
    if (description !== undefined) {
      if (description && !validateTaskDescription(description)) {
        throw new Error('INVALID_DESCRIPTION');
      }
      updateFields.description = description ? sanitizeNote(description.trim()) : undefined;
    }

    // Validate status if provided
    if (status !== undefined) {
      if (!validateTaskStatus(status)) {
        throw new Error('INVALID_STATUS');
      }
      updateFields.status = status;
    }

    // Validate priority if provided
    if (priority !== undefined) {
      if (!validateTaskPriority(priority)) {
        throw new Error('INVALID_PRIORITY');
      }
      updateFields.priority = priority;
    }

    // Validate due date if provided
    if (dueDate !== undefined) {
      if (dueDate && !validateDueDate(dueDate)) {
        throw new Error('INVALID_DUE_DATE');
      }
      updateFields.dueDate = dueDate ? new Date(dueDate) : undefined;
    }

    // Check if task exists and belongs to user
    const existingTask = await taskRepository.findByIdAndUserId(taskId, userId);
    if (!existingTask) {
      throw new Error('TASK_NOT_FOUND');
    }

    // Validate status transitions
    if (status && existingTask.status !== status) {
      this._validateStatusTransition(existingTask.status, status);
    }

    // Update task
    const updatedTask = await taskRepository.updateByIdAndUserId(taskId, userId, updateFields);

    // Send notification if task status changed to completed
    if (status && existingTask.status !== 'completed' && status === 'completed') {
      try {
        await notificationService.createTaskNotification(
          updatedTask,
          'task_completed',
          userId
        );
      } catch (notificationError) {
        console.error('Failed to send task completion notification:', notificationError);
        // Don't fail the update if notification fails
      }
    }

    return {
      message: 'Task updated successfully',
      task: this._formatTaskResponse(updatedTask)
    };
  }

  /**
   * Delete a task
   * @param {string} userId - User ID
   * @param {string} taskId - Task ID
   * @returns {Promise<Object>} Success message
   */
  async deleteTask(userId, taskId) {
    if (!taskId || typeof taskId !== 'string') {
      throw new Error('INVALID_TASK_ID');
    }

    const deletedTask = await taskRepository.deleteByIdAndUserId(taskId, userId);
    
    if (!deletedTask) {
      throw new Error('TASK_NOT_FOUND');
    }

    return {
      message: 'Task deleted successfully',
      deletedTask: {
        id: deletedTask._id,
        title: deletedTask.title
      }
    };
  }

  /**
   * Mark task as completed
   * @param {string} userId - User ID
   * @param {string} taskId - Task ID
   * @returns {Promise<Object>} Updated task
   */
  async completeTask(userId, taskId) {
    if (!taskId || typeof taskId !== 'string') {
      throw new Error('INVALID_TASK_ID');
    }

    // Check if task exists and belongs to user
    const existingTask = await taskRepository.findByIdAndUserId(taskId, userId);
    if (!existingTask) {
      throw new Error('TASK_NOT_FOUND');
    }

    if (existingTask.status === 'completed') {
      throw new Error('TASK_ALREADY_COMPLETED');
    }

    const completedTask = await taskRepository.markAsCompleted(taskId, userId);

    return {
      message: 'Task marked as completed',
      task: this._formatTaskResponse(completedTask)
    };
  }

  /**
   * Get task statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Task statistics
   */
  async getTaskStats(userId) {
    const stats = await taskRepository.getStatsByUserId(userId);
    
    // Calculate completion rate
    const completionRate = stats.totalTasks > 0 
      ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
      : 0;

    return {
      statistics: {
        totalTasks: stats.totalTasks,
        completedTasks: stats.completedTasks,
        pendingTasks: stats.pendingTasks,
        inProgressTasks: stats.inProgressTasks,
        highPriorityTasks: stats.highPriorityTasks,
        overdueTasks: stats.overdueTasks,
        completionRate,
        averageCompletionDays: stats.avgCompletionTime || 0
      },
      message: 'Statistics retrieved successfully'
    };
  }

  /**
   * Get overdue tasks for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Overdue tasks
   */
  async getOverdueTasks(userId) {
    const overdueTasks = await taskRepository.findOverdueByUserId(userId);
    
    return {
      tasks: overdueTasks.map(task => this._formatTaskResponse(task)),
      count: overdueTasks.length,
      message: overdueTasks.length > 0 ? 'Overdue tasks retrieved' : 'No overdue tasks found'
    };
  }

  /**
   * Get upcoming tasks (due within specified days)
   * @param {string} userId - User ID
   * @param {number} days - Number of days ahead (default: 7)
   * @returns {Promise<Object>} Upcoming tasks
   */
  async getUpcomingTasks(userId, days = 7) {
    const validatedDays = Math.max(1, Math.min(30, parseInt(days))); // 1-30 days
    const upcomingTasks = await taskRepository.findUpcomingByUserId(userId, validatedDays);
    
    return {
      tasks: upcomingTasks.map(task => this._formatTaskResponse(task)),
      count: upcomingTasks.length,
      daysAhead: validatedDays,
      message: upcomingTasks.length > 0 
        ? `Tasks due within ${validatedDays} days retrieved` 
        : `No tasks due within ${validatedDays} days`
    };
  }

  /**
   * Bulk update task status
   * @param {string} userId - User ID
   * @param {Array} taskIds - Array of task IDs
   * @param {string} newStatus - New status
   * @returns {Promise<Object>} Bulk update result
   */
  async bulkUpdateStatus(userId, taskIds, newStatus) {
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      throw new Error('INVALID_TASK_IDS');
    }

    if (taskIds.length > 50) {
      throw new Error('TOO_MANY_TASKS'); // Limit bulk operations
    }

    if (!validateTaskStatus(newStatus)) {
      throw new Error('INVALID_STATUS');
    }

    const result = await taskRepository.bulkUpdateStatus(userId, taskIds, newStatus);

    return {
      message: `Bulk status update completed`,
      updatedCount: result.modifiedCount,
      totalRequested: taskIds.length,
      newStatus
    };
  }

  /**
   * Get tasks by status
   * @param {string} userId - User ID
   * @param {string} status - Task status
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Tasks by status
   */
  async getTasksByStatus(userId, status, options = {}) {
    if (!validateTaskStatus(status)) {
      throw new Error('INVALID_STATUS');
    }

    const { limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const tasks = await taskRepository.findByUserIdAndStatus(userId, status, {
      limit: Math.min(100, Math.max(1, parseInt(limit))),
      sortBy,
      sortOrder
    });

    return {
      tasks: tasks.map(task => this._formatTaskResponse(task)),
      status,
      count: tasks.length,
      message: `${status} tasks retrieved successfully`
    };
  }

  /**
   * Validate status transition
   * @private
   * @param {string} currentStatus - Current status
   * @param {string} newStatus - New status
   */
  _validateStatusTransition(currentStatus, newStatus) {
    // Define valid transitions
    const validTransitions = {
      'pending': ['in-progress', 'completed'],
      'in-progress': ['pending', 'completed'],
      'completed': ['pending', 'in-progress'] // Allow reopening completed tasks
    };

    if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(newStatus)) {
      throw new Error('INVALID_STATUS_TRANSITION');
    }
  }

  /**
   * Format task response for API
   * @private
   * @param {Object} task - Raw task from database
   * @returns {Object} Formatted task
   */
  _formatTaskResponse(task) {
    const formattedTask = {
      id: task._id,
      title: task.title,
      description: task.description || null,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate || null,
      completedAt: task.completedAt || null,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    };

    // Add computed fields
    if (task.dueDate && task.status !== 'completed') {
      const now = new Date();
      const due = new Date(task.dueDate);
      formattedTask.isOverdue = now > due;
      
      const diffTime = due - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      formattedTask.daysUntilDue = diffDays;
    } else {
      formattedTask.isOverdue = false;
      formattedTask.daysUntilDue = null;
    }

    return formattedTask;
  }
}

module.exports = new TaskService();