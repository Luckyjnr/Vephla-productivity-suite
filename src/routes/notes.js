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

// Note statistics and tags (must come before /:id routes)
router.get('/stats', getNoteStats);
router.get('/tags', getUserTags);
router.get('/search', searchNotes);

// Bulk operations
router.delete('/bulk', bulkDeleteNotes);

// CRUD operations
router.post('/', validateNote, handleValidationErrors, createNote);
router.get('/', getNotes);
router.get('/:id', getNoteById);
router.put('/:id', validateNote, handleValidationErrors, updateNote);
router.delete('/:id', deleteNote);

module.exports = router;