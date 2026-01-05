const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { upload, handleMulterError } = require('../config/multer');
const { validateFileMetadata, handleValidationErrors } = require('../utils/validators');
const {
  uploadFiles,
  getFiles,
  getFileById,
  updateFileMetadata,
  deleteFile,
  downloadFile,
  getFileStats,
  getFileTags,
  getFilesByCategory,
  getRecentFiles,
  getLargeFiles,
  bulkDeleteFiles,
  cleanupOrphanedFiles
} = require('../controllers/fileController');

const router = express.Router();

// All file routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /files/stats:
 *   get:
 *     summary: Get user file statistics
 *     tags: [Files]
 *     responses:
 *       200:
 *         description: File statistics retrieved successfully
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
 *                     totalFiles:
 *                       type: number
 *                       example: 25
 *                     totalSize:
 *                       type: number
 *                       description: Total size in bytes
 *                       example: 52428800
 *                     averageSize:
 *                       type: number
 *                       description: Average file size in bytes
 *                       example: 2097152
 *                     fileTypes:
 *                       type: object
 *                       description: Count by file type
 *                       example: { "image": 10, "document": 8, "video": 5, "other": 2 }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/stats', getFileStats);

/**
 * @swagger
 * /files/tags:
 *   get:
 *     summary: Get user's file tags
 *     tags: [Files]
 *     responses:
 *       200:
 *         description: File tags retrieved successfully
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
 *                   example: ['document', 'image', 'project', 'important']
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/tags', getFileTags);

/**
 * @swagger
 * /files/recent:
 *   get:
 *     summary: Get recently uploaded files
 *     tags: [Files]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 30
 *           default: 7
 *         description: Number of days to look back
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of files to return
 *     responses:
 *       200:
 *         description: Recent files retrieved successfully
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
 *                     $ref: '#/components/schemas/File'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/recent', getRecentFiles);

/**
 * @swagger
 * /files/large:
 *   get:
 *     summary: Get large files (over specified size)
 *     tags: [Files]
 *     parameters:
 *       - in: query
 *         name: minSize
 *         schema:
 *           type: integer
 *           minimum: 1024
 *           default: 1048576
 *         description: Minimum file size in bytes (default 1MB)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of files to return
 *     responses:
 *       200:
 *         description: Large files retrieved successfully
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
 *                     $ref: '#/components/schemas/File'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/large', getLargeFiles);

/**
 * @swagger
 * /files/cleanup:
 *   post:
 *     summary: Clean up orphaned files (admin operation)
 *     tags: [Files]
 *     responses:
 *       200:
 *         description: Cleanup completed successfully
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
 *                   example: Cleanup completed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedFiles:
 *                       type: number
 *                       example: 3
 *                     freedSpace:
 *                       type: number
 *                       description: Space freed in bytes
 *                       example: 15728640
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/cleanup', cleanupOrphanedFiles);

/**
 * @swagger
 * /files/bulk:
 *   delete:
 *     summary: Delete multiple files
 *     tags: [Files]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileIds
 *             properties:
 *               fileIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of file IDs to delete
 *                 example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012']
 *     responses:
 *       200:
 *         description: Files deleted successfully
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
 *                   example: Files deleted successfully
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
router.delete('/bulk', bulkDeleteFiles);

/**
 * @swagger
 * /files/category/{category}:
 *   get:
 *     summary: Get files by category
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [image, document, video, audio, other]
 *         description: File category
 *         example: document
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
 *         description: Number of files per page
 *     responses:
 *       200:
 *         description: Files retrieved successfully
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
 *                     files:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/File'
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
router.get('/category/:category', getFilesByCategory);

/**
 * @swagger
 * /files:
 *   post:
 *     summary: Upload files
 *     tags: [Files]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Files to upload (max 10 files, 10MB each)
 *               description:
 *                 type: string
 *                 description: File description
 *                 example: Project documents
 *               tags:
 *                 type: string
 *                 description: Comma-separated tags
 *                 example: document,project,important
 *     responses:
 *       201:
 *         description: Files uploaded successfully
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
 *                   example: Files uploaded successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/File'
 *       400:
 *         description: File upload error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               fileTooLarge:
 *                 summary: File too large
 *                 value:
 *                   error:
 *                     code: 'FILE_TOO_LARGE'
 *                     message: 'File size exceeds 10MB limit'
 *                     timestamp: '2024-01-01T00:00:00.000Z'
 *               invalidFileType:
 *                 summary: Invalid file type
 *                 value:
 *                   error:
 *                     code: 'INVALID_FILE_TYPE'
 *                     message: 'File type not allowed'
 *                     timestamp: '2024-01-01T00:00:00.000Z'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   get:
 *     summary: Get user files
 *     tags: [Files]
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
 *         description: Number of files per page
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated list of tags to filter by
 *         example: document,important
 *       - in: query
 *         name: mimeType
 *         schema:
 *           type: string
 *         description: Filter by MIME type
 *         example: application/pdf
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, size, originalName]
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
 *         description: Files retrieved successfully
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
 *                     files:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/File'
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
router.post('/', upload.array('files', 10), handleMulterError, uploadFiles);
router.get('/', getFiles);

/**
 * @swagger
 * /files/{id}:
 *   get:
 *     summary: Get file by ID
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: File retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/File'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     summary: Update file metadata
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *                 description: File description
 *                 example: Updated project document
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: File tags
 *                 example: ['document', 'project', 'updated']
 *     responses:
 *       200:
 *         description: File metadata updated successfully
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
 *                   example: File metadata updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/File'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   delete:
 *     summary: Delete file
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: File deleted successfully
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
 *                   example: File deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', getFileById);
router.put('/:id', validateFileMetadata, handleValidationErrors, updateFileMetadata);
router.delete('/:id', deleteFile);

/**
 * @swagger
 * /files/{id}/download:
 *   get:
 *     summary: Download file
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: File download
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Disposition:
 *             description: Attachment with original filename
 *             schema:
 *               type: string
 *               example: attachment; filename="document.pdf"
 *           Content-Type:
 *             description: Original file MIME type
 *             schema:
 *               type: string
 *               example: application/pdf
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id/download', downloadFile);

module.exports = router;