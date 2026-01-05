const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { validateNote, handleValidationErrors } = require('../utils/validators');
const {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
  getUserTags,
  getNoteStats,
  searchNotes,
  bulkDeleteNotes
} = require('../controllers/noteController');

const router = express.Router();

// All note routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /notes/stats:
 *   get:
 *     summary: Get user note statistics
 *     tags: [Notes]
 *     responses:
 *       200:
 *         description: Note statistics retrieved successfully
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
 *                     totalNotes:
 *                       type: number
 *                       example: 25
 *                     privateNotes:
 *                       type: number
 *                       example: 15
 *                     publicNotes:
 *                       type: number
 *                       example: 10
 *                     totalTags:
 *                       type: number
 *                       example: 8
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/stats', getNoteStats);

/**
 * @swagger
 * /notes/tags:
 *   get:
 *     summary: Get user's note tags
 *     tags: [Notes]
 *     responses:
 *       200:
 *         description: Tags retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ['work', 'personal', 'important', 'meeting']
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/tags', getUserTags);

/**
 * @swagger
 * /notes/search:
 *   get:
 *     summary: Search notes by content or title
 *     tags: [Notes]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *         example: meeting
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
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
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
 *                     notes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Note'
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
router.get('/search', searchNotes);

/**
 * @swagger
 * /notes/bulk:
 *   delete:
 *     summary: Delete multiple notes
 *     tags: [Notes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - noteIds
 *             properties:
 *               noteIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of note IDs to delete
 *                 example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012']
 *     responses:
 *       200:
 *         description: Notes deleted successfully
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
 *                   example: Notes deleted successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedCount:
 *                       type: number
 *                       example: 2
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.delete('/bulk', bulkDeleteNotes);

/**
 * @swagger
 * /notes:
 *   post:
 *     summary: Create a new note
 *     tags: [Notes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 description: Note title
 *                 example: Meeting Notes
 *               content:
 *                 type: string
 *                 description: Note content
 *                 example: Discussed project timeline and deliverables
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Note tags
 *                 example: ['work', 'meeting', 'important']
 *               isPrivate:
 *                 type: boolean
 *                 description: Whether note is private
 *                 example: true
 *     responses:
 *       201:
 *         description: Note created successfully
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
 *                   example: Note created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Note'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   get:
 *     summary: Get user notes
 *     tags: [Notes]
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
 *         description: Number of notes per page
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated list of tags to filter by
 *         example: work,important
 *       - in: query
 *         name: isPrivate
 *         schema:
 *           type: boolean
 *         description: Filter by privacy status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, title]
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
 *         description: Notes retrieved successfully
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
 *                     notes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Note'
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
 *                           example: 25
 *                         pages:
 *                           type: number
 *                           example: 3
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/', validateNote, handleValidationErrors, createNote);
router.get('/', getNotes);

/**
 * @swagger
 * /notes/{id}:
 *   get:
 *     summary: Get note by ID
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Note ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Note retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Note'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     summary: Update note
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Note ID
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
 *                 description: Note title
 *                 example: Updated Meeting Notes
 *               content:
 *                 type: string
 *                 description: Note content
 *                 example: Updated content with new information
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Note tags
 *                 example: ['work', 'meeting', 'updated']
 *               isPrivate:
 *                 type: boolean
 *                 description: Whether note is private
 *                 example: false
 *     responses:
 *       200:
 *         description: Note updated successfully
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
 *                   example: Note updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Note'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   delete:
 *     summary: Delete note
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Note ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Note deleted successfully
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
 *                   example: Note deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', getNoteById);
router.put('/:id', validateNote, handleValidationErrors, updateNote);
router.delete('/:id', deleteNote);

module.exports = router;