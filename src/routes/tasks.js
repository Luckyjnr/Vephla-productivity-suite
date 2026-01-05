const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { validateTask, handleValidationErrors } = require('../utils/validators');
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

/**
 * @swagger
 * /tasks/stats:
 *   get:
 *     summary: Get user task statistics
 *     tags: [Tasks]
 *     responses:
 *       200:
 *         description: Task statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalTasks:
 *                       type: number
 *                       example: 50
 *                     pendingTasks:
 *                       type: number
 *                       example: 20
 *                     inProgressTasks:
 *                       type: number
 *                       example: 15
 *                     completedTasks:
 *                       type: number
 *                       example: 15
 *                     overdueTasks:
 *                       type: number
 *                       example: 5
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/stats', getTaskStats);

/**
 * @swagger
 * /tasks/overdue:
 *   get:
 *     summary: Get overdue tasks
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of tasks per page
 *     responses:
 *       200:
 *         description: Overdue tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     tasks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Task'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: number
 *                           example: 1
 *                         limit:
 *                           type: number
 *                           example: 10
 *                         total:
 *                           type: number
 *                           example: 5
 *                         pages:
 *                           type: number
 *                           example: 1
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/overdue', getOverdueTasks);

/**
 * @swagger
 * /tasks/upcoming:
 *   get:
 *     summary: Get upcoming tasks (due within next 7 days)
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 30
 *           default: 7
 *         description: Number of days to look ahead
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of tasks per page
 *     responses:
 *       200:
 *         description: Upcoming tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     tasks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Task'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: number
 *                           example: 1
 *                         limit:
 *                           type: number
 *                           example: 10
 *                         total:
 *                           type: number
 *                           example: 8
 *                         pages:
 *                           type: number
 *                           example: 1
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/upcoming', getUpcomingTasks);

/**
 * @swagger
 * /tasks/bulk/status:
 *   patch:
 *     summary: Bulk update task status
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskIds
 *               - status
 *             properties:
 *               taskIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of task IDs to update
 *                 example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012']
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, completed]
 *                 description: New status for all tasks
 *                 example: completed
 *     responses:
 *       200:
 *         description: Tasks updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Tasks updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     updatedCount:
 *                       type: number
 *                       example: 2
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.patch('/bulk/status', bulkUpdateStatus);

/**
 * @swagger
 * /tasks/status/{status}:
 *   get:
 *     summary: Get tasks by status
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed]
 *         description: Task status
 *         example: pending
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of tasks per page
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     tasks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Task'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: number
 *                           example: 1
 *                         limit:
 *                           type: number
 *                           example: 10
 *                         total:
 *                           type: number
 *                           example: 20
 *                         pages:
 *                           type: number
 *                           example: 2
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       400:
 *         description: Invalid status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/status/:status', getTasksByStatus);

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 description: Task title
 *                 example: Complete project documentation
 *               description:
 *                 type: string
 *                 description: Task description
 *                 example: Write comprehensive API documentation for the project
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 description: Task priority
 *                 example: high
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: Task due date
 *                 example: 2024-12-31T23:59:59.000Z
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Task created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   get:
 *     summary: Get user tasks
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of tasks per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed]
 *         description: Filter by task status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Filter by task priority
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, dueDate, priority, title]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     tasks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Task'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: number
 *                           example: 1
 *                         limit:
 *                           type: number
 *                           example: 10
 *                         total:
 *                           type: number
 *                           example: 50
 *                         pages:
 *                           type: number
 *                           example: 5
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/', validateTask, handleValidationErrors, createTask);
router.get('/', getTasks);

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Get task by ID
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Task retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     summary: Update task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Task title
 *                 example: Updated task title
 *               description:
 *                 type: string
 *                 description: Task description
 *                 example: Updated task description
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, completed]
 *                 description: Task status
 *                 example: in_progress
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 description: Task priority
 *                 example: medium
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: Task due date
 *                 example: 2024-12-31T23:59:59.000Z
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Task updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   delete:
 *     summary: Delete task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Task deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', getTaskById);
router.put('/:id', validateTask, handleValidationErrors, updateTask);
router.delete('/:id', deleteTask);

/**
 * @swagger
 * /tasks/{id}/complete:
 *   patch:
 *     summary: Mark task as completed
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Task completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Task completed successfully
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       400:
 *         description: Task already completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error:
 *                 code: 'TASK_ALREADY_COMPLETED'
 *                 message: 'Task is already completed'
 *                 timestamp: '2024-01-01T00:00:00.000Z'
 */
router.patch('/:id/complete', completeTask);

module.exports = router;