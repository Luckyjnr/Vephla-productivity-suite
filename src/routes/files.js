const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { upload, handleMulterError } = require('../config/multer');
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

// File statistics and specialized queries (must come before /:id routes)
router.get('/stats', getFileStats);
router.get('/tags', getFileTags);
router.get('/recent', getRecentFiles);
router.get('/large', getLargeFiles);

// Maintenance operations
router.post('/cleanup', cleanupOrphanedFiles);

// Bulk operations
router.delete('/bulk', bulkDeleteFiles);

// Category-based queries
router.get('/category/:category', getFilesByCategory);

// File upload with multer middleware
router.post('/', upload.array('files', 10), handleMulterError, uploadFiles);

// CRUD operations
router.get('/', getFiles);
router.get('/:id', getFileById);
router.put('/:id', updateFileMetadata);
router.delete('/:id', deleteFile);

// File download
router.get('/:id/download', downloadFile);

module.exports = router;