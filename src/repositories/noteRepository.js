const Note = require('../models/Note');
const mongoose = require('mongoose');

class NoteRepository {
  /**
   * Create a new note
   * @param {Object} noteData - Note data
   * @returns {Promise<Object>} Created note
   */
  async create(noteData) {
    const note = new Note(noteData);
    return await note.save();
  }

  /**
   * Find notes by user ID with pagination and filtering
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Notes with pagination info
   */
  async findByUserId(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      tags = [],
      search = '',
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = options;

    const skip = (page - 1) * limit;
    const query = { userId };

    // Add tag filtering
    if (tags.length > 0) {
      query.tags = { $in: tags };
    }

    // Add text search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [notes, totalCount] = await Promise.all([
      Note.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Note.countDocuments(query)
    ]);

    return {
      notes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalNotes: totalCount,
        limit,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1
      }
    };
  }

  /**
   * Find a note by ID and user ID
   * @param {string} noteId - Note ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Note or null
   */
  async findByIdAndUserId(noteId, userId) {
    return await Note.findOne({ _id: noteId, userId }).lean();
  }

  /**
   * Update a note by ID and user ID
   * @param {string} noteId - Note ID
   * @param {string} userId - User ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object|null>} Updated note or null
   */
  async updateByIdAndUserId(noteId, userId, updateData) {
    return await Note.findOneAndUpdate(
      { _id: noteId, userId },
      { ...updateData, updatedAt: new Date() },
      { new: true, lean: true }
    );
  }

  /**
   * Delete a note by ID and user ID
   * @param {string} noteId - Note ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Deleted note or null
   */
  async deleteByIdAndUserId(noteId, userId) {
    return await Note.findOneAndDelete({ _id: noteId, userId }).lean();
  }

  /**
   * Get all unique tags for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of unique tags
   */
  async getTagsByUserId(userId) {
    const result = await Note.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $project: { tag: '$_id', count: 1, _id: 0 } }
    ]);

    return result;
  }

  /**
   * Get note statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Note statistics
   */
  async getStatsByUserId(userId) {
    const stats = await Note.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalNotes: { $sum: 1 },
          totalTags: { $sum: { $size: '$tags' } },
          avgContentLength: { $avg: { $strLenCP: '$content' } },
          lastUpdated: { $max: '$updatedAt' }
        }
      }
    ]);

    return stats[0] || {
      totalNotes: 0,
      totalTags: 0,
      avgContentLength: 0,
      lastUpdated: null
    };
  }

  /**
   * Bulk delete notes by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteAllByUserId(userId) {
    return await Note.deleteMany({ userId });
  }
}

module.exports = new NoteRepository();