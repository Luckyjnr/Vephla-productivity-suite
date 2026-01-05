const noteRepository = require('../repositories/noteRepository');
const notificationService = require('./notificationService');
const { 
  validateNoteTitle, 
  validateNoteContent, 
  validateNoteTags, 
  sanitizeNote 
} = require('../utils/validators');

class NoteService {
  /**
   * Create a new note
   * @param {string} userId - User ID
   * @param {Object} noteData - Note data
   * @returns {Promise<Object>} Created note
   */
  async createNote(userId, noteData) {
    const { title, content, tags = [], isPrivate = true } = noteData;

    // Validate input
    if (!validateNoteTitle(title)) {
      throw new Error('INVALID_TITLE');
    }

    if (!validateNoteContent(content)) {
      throw new Error('INVALID_CONTENT');
    }

    if (!validateNoteTags(tags)) {
      throw new Error('INVALID_TAGS');
    }

    // Sanitize input
    const sanitizedTitle = sanitizeNote(title.trim());
    const sanitizedContent = sanitizeNote(content.trim());
    const sanitizedTags = tags.map(tag => sanitizeNote(tag.trim().toLowerCase()));

    // Create note
    const noteToCreate = {
      title: sanitizedTitle,
      content: sanitizedContent,
      tags: sanitizedTags,
      userId,
      isPrivate
    };

    const createdNote = await noteRepository.create(noteToCreate);
    
    // Send notification for note creation (optional, could be disabled by default)
    if (!isPrivate) {
      try {
        await notificationService.createNoteNotification(
          createdNote,
          'note_shared',
          userId
        );
      } catch (notificationError) {
        console.error('Failed to send note creation notification:', notificationError);
        // Don't fail the note creation if notification fails
      }
    }
    
    return {
      message: 'Note created successfully',
      note: this._formatNoteResponse(createdNote)
    };
  }

  /**
   * Get notes for a user with filtering and pagination
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Notes with pagination
   */
  async getNotes(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      tags = [],
      search = '',
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = options;

    // Validate pagination parameters
    const validatedPage = Math.max(1, parseInt(page));
    const validatedLimit = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 per page

    // Validate sort parameters
    const validSortFields = ['createdAt', 'updatedAt', 'title'];
    const validatedSortBy = validSortFields.includes(sortBy) ? sortBy : 'updatedAt';
    const validatedSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';

    // Parse tags if string
    let parsedTags = tags;
    if (typeof tags === 'string') {
      parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }

    const queryOptions = {
      page: validatedPage,
      limit: validatedLimit,
      tags: parsedTags,
      search: search.trim(),
      sortBy: validatedSortBy,
      sortOrder: validatedSortOrder
    };

    const result = await noteRepository.findByUserId(userId, queryOptions);

    return {
      notes: result.notes.map(note => this._formatNoteResponse(note)),
      pagination: result.pagination,
      filters: {
        tags: parsedTags,
        search: search.trim(),
        sortBy: validatedSortBy,
        sortOrder: validatedSortOrder
      }
    };
  }

  /**
   * Get a single note by ID
   * @param {string} userId - User ID
   * @param {string} noteId - Note ID
   * @returns {Promise<Object>} Note
   */
  async getNoteById(userId, noteId) {
    if (!noteId || typeof noteId !== 'string') {
      throw new Error('INVALID_NOTE_ID');
    }

    const note = await noteRepository.findByIdAndUserId(noteId, userId);
    
    if (!note) {
      throw new Error('NOTE_NOT_FOUND');
    }

    return {
      note: this._formatNoteResponse(note)
    };
  }

  /**
   * Update a note
   * @param {string} userId - User ID
   * @param {string} noteId - Note ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated note
   */
  async updateNote(userId, noteId, updateData) {
    if (!noteId || typeof noteId !== 'string') {
      throw new Error('INVALID_NOTE_ID');
    }

    const { title, content, tags, isPrivate } = updateData;
    const updateFields = {};

    // Validate and sanitize title if provided
    if (title !== undefined) {
      if (!validateNoteTitle(title)) {
        throw new Error('INVALID_TITLE');
      }
      updateFields.title = sanitizeNote(title.trim());
    }

    // Validate and sanitize content if provided
    if (content !== undefined) {
      if (!validateNoteContent(content)) {
        throw new Error('INVALID_CONTENT');
      }
      updateFields.content = sanitizeNote(content.trim());
    }

    // Validate and sanitize tags if provided
    if (tags !== undefined) {
      if (!validateNoteTags(tags)) {
        throw new Error('INVALID_TAGS');
      }
      updateFields.tags = tags.map(tag => sanitizeNote(tag.trim().toLowerCase()));
    }

    // Update privacy setting if provided
    if (isPrivate !== undefined) {
      updateFields.isPrivate = Boolean(isPrivate);
    }

    // Check if note exists and belongs to user
    const existingNote = await noteRepository.findByIdAndUserId(noteId, userId);
    if (!existingNote) {
      throw new Error('NOTE_NOT_FOUND');
    }

    // Update note
    const updatedNote = await noteRepository.updateByIdAndUserId(noteId, userId, updateFields);

    // Send notification if note was updated and is not private
    if (!updatedNote.isPrivate && (title !== undefined || content !== undefined)) {
      try {
        await notificationService.createNoteNotification(
          updatedNote,
          'note_updated',
          userId
        );
      } catch (notificationError) {
        console.error('Failed to send note update notification:', notificationError);
        // Don't fail the update if notification fails
      }
    }

    return {
      message: 'Note updated successfully',
      note: this._formatNoteResponse(updatedNote)
    };
  }

  /**
   * Delete a note
   * @param {string} userId - User ID
   * @param {string} noteId - Note ID
   * @returns {Promise<Object>} Success message
   */
  async deleteNote(userId, noteId) {
    if (!noteId || typeof noteId !== 'string') {
      throw new Error('INVALID_NOTE_ID');
    }

    const deletedNote = await noteRepository.deleteByIdAndUserId(noteId, userId);
    
    if (!deletedNote) {
      throw new Error('NOTE_NOT_FOUND');
    }

    return {
      message: 'Note deleted successfully',
      deletedNote: {
        id: deletedNote._id,
        title: deletedNote.title
      }
    };
  }

  /**
   * Get user's tags with usage statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Tags with statistics
   */
  async getUserTags(userId) {
    const tags = await noteRepository.getTagsByUserId(userId);
    
    return {
      tags,
      totalTags: tags.length,
      message: tags.length > 0 ? 'Tags retrieved successfully' : 'No tags found'
    };
  }

  /**
   * Get note statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Note statistics
   */
  async getNoteStats(userId) {
    const stats = await noteRepository.getStatsByUserId(userId);
    
    return {
      statistics: {
        totalNotes: stats.totalNotes,
        totalTags: stats.totalTags,
        averageContentLength: Math.round(stats.avgContentLength || 0),
        lastUpdated: stats.lastUpdated
      },
      message: 'Statistics retrieved successfully'
    };
  }

  /**
   * Search notes with advanced filtering
   * @param {string} userId - User ID
   * @param {Object} searchOptions - Search options
   * @returns {Promise<Object>} Search results
   */
  async searchNotes(userId, searchOptions = {}) {
    const {
      query = '',
      tags = [],
      dateFrom,
      dateTo,
      page = 1,
      limit = 20
    } = searchOptions;

    if (!query.trim() && tags.length === 0) {
      throw new Error('SEARCH_QUERY_REQUIRED');
    }

    const options = {
      page: Math.max(1, parseInt(page)),
      limit: Math.min(100, Math.max(1, parseInt(limit))),
      search: query.trim(),
      tags: Array.isArray(tags) ? tags : [],
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    };

    const result = await noteRepository.findByUserId(userId, options);

    // Filter by date range if provided
    let filteredNotes = result.notes;
    if (dateFrom || dateTo) {
      filteredNotes = result.notes.filter(note => {
        const noteDate = new Date(note.updatedAt);
        if (dateFrom && noteDate < new Date(dateFrom)) return false;
        if (dateTo && noteDate > new Date(dateTo)) return false;
        return true;
      });
    }

    return {
      notes: filteredNotes.map(note => this._formatNoteResponse(note)),
      searchQuery: query.trim(),
      totalResults: filteredNotes.length,
      pagination: result.pagination,
      message: filteredNotes.length > 0 ? 'Search completed successfully' : 'No notes found matching criteria'
    };
  }

  /**
   * Bulk delete notes by IDs
   * @param {string} userId - User ID
   * @param {Array} noteIds - Array of note IDs
   * @returns {Promise<Object>} Bulk delete result
   */
  async bulkDeleteNotes(userId, noteIds) {
    if (!Array.isArray(noteIds) || noteIds.length === 0) {
      throw new Error('INVALID_NOTE_IDS');
    }

    if (noteIds.length > 50) {
      throw new Error('TOO_MANY_NOTES'); // Limit bulk operations
    }

    let deletedCount = 0;
    const errors = [];

    for (const noteId of noteIds) {
      try {
        const deleted = await noteRepository.deleteByIdAndUserId(noteId, userId);
        if (deleted) {
          deletedCount++;
        }
      } catch (error) {
        errors.push({ noteId, error: error.message });
      }
    }

    return {
      message: `Bulk delete completed`,
      deletedCount,
      totalRequested: noteIds.length,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Format note response for API
   * @private
   * @param {Object} note - Raw note from database
   * @returns {Object} Formatted note
   */
  _formatNoteResponse(note) {
    return {
      id: note._id,
      title: note.title,
      content: note.content,
      tags: note.tags || [],
      isPrivate: note.isPrivate,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      summary: note.content && note.content.length > 100 
        ? note.content.substring(0, 100) + '...' 
        : note.content
    };
  }
}

module.exports = new NoteService();