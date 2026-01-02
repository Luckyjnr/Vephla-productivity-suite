const Task = require('../models/Task');
const mongoose = require('mongoose');

class TaskRepository {
  /**
   * Create a new task
   * @param {Object} taskData - Task data
   * @returns {Promise<Object>} Created task
   */
  async create(taskData) {
    const task = new Task(taskData);
    return await task.save();
  }

  /**
   * Find tasks by user ID with filtering and sorting
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Tasks with pagination info
   */
  async findByUserId(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      status = [],
      priority = [],
      overdue = null,
      dueDateFrom = null,
      dueDateTo = null,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const skip = (page - 1) * limit;
    const query = { userId };

    // Add status filtering
    if (status.length > 0) {
      query.status = { $in: status };
    }

    // Add priority filtering
    if (priority.length > 0) {
      query.priority = { $in: priority };
    }

    // Add due date range filtering
    if (dueDateFrom || dueDateTo) {
      query.dueDate = {};
      if (dueDateFrom) query.dueDate.$gte = new Date(dueDateFrom);
      if (dueDateTo) query.dueDate.$lte = new Date(dueDateTo);
    }

    // Add overdue filtering
    if (overdue === true) {
      query.dueDate = { $lt: new Date() };
      query.status = { $ne: 'completed' };
    } else if (overdue === false) {
      query.$or = [
        { dueDate: { $gte: new Date() } },
        { dueDate: null },
        { status: 'completed' }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [tasks, totalCount] = await Promise.all([
      Task.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Task.countDocuments(query)
    ]);

    return {
      tasks,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalTasks: totalCount,
        limit,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1
      }
    };
  }

  /**
   * Find a task by ID and user ID
   * @param {string} taskId - Task ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Task or null
   */
  async findByIdAndUserId(taskId, userId) {
    return await Task.findOne({ _id: taskId, userId }).lean();
  }

  /**
   * Update a task by ID and user ID
   * @param {string} taskId - Task ID
   * @param {string} userId - User ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object|null>} Updated task or null
   */
  async updateByIdAndUserId(taskId, userId, updateData) {
    return await Task.findOneAndUpdate(
      { _id: taskId, userId },
      { ...updateData, updatedAt: new Date() },
      { new: true, lean: true }
    );
  }

  /**
   * Delete a task by ID and user ID
   * @param {string} taskId - Task ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Deleted task or null
   */
  async deleteByIdAndUserId(taskId, userId) {
    return await Task.findOneAndDelete({ _id: taskId, userId }).lean();
  }

  /**
   * Mark task as completed
   * @param {string} taskId - Task ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Updated task or null
   */
  async markAsCompleted(taskId, userId) {
    return await Task.findOneAndUpdate(
      { _id: taskId, userId },
      { 
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true, lean: true }
    );
  }

  /**
   * Get task statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Task statistics
   */
  async getStatsByUserId(userId) {
    const stats = await Task.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          pendingTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          inProgressTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
          },
          highPriorityTasks: {
            $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] }
          },
          overdueTasks: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$status', 'completed'] },
                    { $ne: ['$dueDate', null] },
                    { $lt: ['$dueDate', new Date()] }
                  ]
                },
                1,
                0
              ]
            }
          },
          avgCompletionTime: {
            $avg: {
              $cond: [
                { $ne: ['$completedAt', null] },
                { $subtract: ['$completedAt', '$createdAt'] },
                null
              ]
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      inProgressTasks: 0,
      highPriorityTasks: 0,
      overdueTasks: 0,
      avgCompletionTime: 0
    };

    // Convert avgCompletionTime from milliseconds to days
    if (result.avgCompletionTime) {
      result.avgCompletionTime = Math.round(result.avgCompletionTime / (1000 * 60 * 60 * 24));
    }

    return result;
  }

  /**
   * Get tasks by status for a user
   * @param {string} userId - User ID
   * @param {string} status - Task status
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Tasks
   */
  async findByUserIdAndStatus(userId, status, options = {}) {
    const { limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    return await Task.find({ userId, status })
      .sort(sort)
      .limit(limit)
      .lean();
  }

  /**
   * Get overdue tasks for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Overdue tasks
   */
  async findOverdueByUserId(userId) {
    return await Task.find({
      userId,
      status: { $ne: 'completed' },
      dueDate: { $lt: new Date() }
    })
    .sort({ dueDate: 1 })
    .lean();
  }

  /**
   * Get upcoming tasks (due within specified days)
   * @param {string} userId - User ID
   * @param {number} days - Number of days ahead
   * @returns {Promise<Array>} Upcoming tasks
   */
  async findUpcomingByUserId(userId, days = 7) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return await Task.find({
      userId,
      status: { $ne: 'completed' },
      dueDate: {
        $gte: today,
        $lte: futureDate
      }
    })
    .sort({ dueDate: 1 })
    .lean();
  }

  /**
   * Bulk update task status
   * @param {string} userId - User ID
   * @param {Array} taskIds - Array of task IDs
   * @param {string} status - New status
   * @returns {Promise<Object>} Update result
   */
  async bulkUpdateStatus(userId, taskIds, status) {
    const updateData = { status, updatedAt: new Date() };
    
    if (status === 'completed') {
      updateData.completedAt = new Date();
    } else {
      updateData.$unset = { completedAt: 1 };
    }

    return await Task.updateMany(
      { 
        _id: { $in: taskIds.map(id => new mongoose.Types.ObjectId(id)) },
        userId: new mongoose.Types.ObjectId(userId)
      },
      updateData
    );
  }

  /**
   * Bulk delete tasks by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteAllByUserId(userId) {
    return await Task.deleteMany({ userId });
  }
}

module.exports = new TaskRepository();