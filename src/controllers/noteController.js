const noteService = require('../services/noteService');

/**
 * Create a new note
 * POST /notes
 */
const createNote = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { title, content, tags, isPrivate } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        error: {
          code: 'MISSING_FIELDS',
          message: 'Title and content are required'
        }
      });
    }

    const result = await noteService.createNote(userId, {
      title,
      content,
      tags,
      isPrivate
    });

    res.status(201).json(result);

  } catch (error) {
    console.error('Create note error:', error);

    if (error.message === 'INVALID_TITLE') {
      return res.status(400).json({
        error: {
          code: 'INVALID_TITLE',
          message: 'Title must be between 1 and 200 characters'
        }
      });
    }

    if (error.message === 'INVALID_CONTENT') {
      return res.status(400).json({
        error: {
          code: 'INVALID_CONTENT',
          message: 'Content must be between 1 and 10000 characters'
        }
      });
    }

    if (error.message === 'INVALID_TAGS') {
      return res.status(400).json({
        error: {
          code: 'INVALID_TAGS',
          message: 'Tags must be an array of strings, max 20 tags, each max 50 characters'
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
 * Get notes with filtering and pagination
 * GET /notes
 */
const getNotes = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      page,
      limit,
      tags,
      search,
      sortBy,
      sortOrder
    } = req.query;

    const result = await noteService.getNotes(userId, {
      page,
      limit,
      tags,
      search,
      sortBy,
      sortOrder
    });

    res.json(result);

  } catch (error) {
    console.error('Get notes error:', error);

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
};

/**
 * Get a single note by ID
 * GET /notes/:id
 */
const getNoteById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id: noteId } = req.params;

    const result = await noteService.getNoteById(userId, noteId);
    res.json(result);

  } catch (error) {
    console.error('Get note by ID error:', error);

    if (error.message === 'INVALID_NOTE_ID') {
      return res.status(400).json({
        error: {
          code: 'INVALID_NOTE_ID',
          message: 'Invalid note ID format'
        }
      });
    }

    if (error.message === 'NOTE_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'NOTE_NOT_FOUND',
          message: 'Note not found or access denied'
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
 * Update a note
 * PUT /notes/:id
 */
const updateNote = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id: noteId } = req.params;
    const { title, content, tags, isPrivate } = req.body;

    const result = await noteService.updateNote(userId, noteId, {
      title,
      content,
      tags,
      isPrivate
    });

    res.json(result);

  } catch (error) {
    console.error('Update note error:', error);

    if (error.message === 'INVALID_NOTE_ID') {
      return res.status(400).json({
        error: {
          code: 'INVALID_NOTE_ID',
          message: 'Invalid note ID format'
        }
      });
    }

    if (error.message === 'NOTE_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'NOTE_NOT_FOUND',
          message: 'Note not found or access denied'
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

    if (error.message === 'INVALID_CONTENT') {
      return res.status(400).json({
        error: {
          code: 'INVALID_CONTENT',
          message: 'Content must be between 1 and 10000 characters'
        }
      });
    }

    if (error.message === 'INVALID_TAGS') {
      return res.status(400).json({
        error: {
          code: 'INVALID_TAGS',
          message: 'Tags must be an array of strings, max 20 tags, each max 50 characters'
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
 * Delete a note
 * DELETE /notes/:id
 */
const deleteNote = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id: noteId } = req.params;

    const result = await noteService.deleteNote(userId, noteId);
    res.json(result);

  } catch (error) {
    console.error('Delete note error:', error);

    if (error.message === 'INVALID_NOTE_ID') {
      return res.status(400).json({
        error: {
          code: 'INVALID_NOTE_ID',
          message: 'Invalid note ID format'
        }
      });
    }

    if (error.message === 'NOTE_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'NOTE_NOT_FOUND',
          message: 'Note not found or access denied'
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
 * Get user's tags with statistics
 * GET /notes/tags
 */
const getUserTags = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await noteService.getUserTags(userId);
    res.json(result);

  } catch (error) {
    console.error('Get user tags error:', error);

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
};

/**
 * Get note statistics
 * GET /notes/stats
 */
const getNoteStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await noteService.getNoteStats(userId);
    res.json(result);

  } catch (error) {
    console.error('Get note stats error:', error);

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
};

/**
 * Search notes with advanced filtering
 * GET /notes/search
 */
const searchNotes = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      query,
      tags,
      dateFrom,
      dateTo,
      page,
      limit
    } = req.query;

    const result = await noteService.searchNotes(userId, {
      query,
      tags: tags ? tags.split(',') : [],
      dateFrom,
      dateTo,
      page,
      limit
    });

    res.json(result);

  } catch (error) {
    console.error('Search notes error:', error);

    if (error.message === 'SEARCH_QUERY_REQUIRED') {
      return res.status(400).json({
        error: {
          code: 'SEARCH_QUERY_REQUIRED',
          message: 'Search query or tags are required'
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
 * Bulk delete notes
 * DELETE /notes/bulk
 */
const bulkDeleteNotes = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { noteIds } = req.body;

    if (!noteIds || !Array.isArray(noteIds)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'noteIds array is required'
        }
      });
    }

    const result = await noteService.bulkDeleteNotes(userId, noteIds);
    res.json(result);

  } catch (error) {
    console.error('Bulk delete notes error:', error);

    if (error.message === 'INVALID_NOTE_IDS') {
      return res.status(400).json({
        error: {
          code: 'INVALID_NOTE_IDS',
          message: 'Invalid note IDs provided'
        }
      });
    }

    if (error.message === 'TOO_MANY_NOTES') {
      return res.status(400).json({
        error: {
          code: 'TOO_MANY_NOTES',
          message: 'Maximum 50 notes can be deleted at once'
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
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
  getUserTags,
  getNoteStats,
  searchNotes,
  bulkDeleteNotes
};