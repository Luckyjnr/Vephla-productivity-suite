const File = require('../models/File');
const mongoose = require('mongoose');

class FileRepository {
  /**
   * Create a new file record
   * @param {Object} fileData - File data
   * @returns {Promise<Object>} Created file
   */
  async create(fileData) {
    const file = new File(fileData);
    return await file.save();
  }

  /**
   * Find files by user ID with filtering and pagination
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Files with pagination info
   */
  async findByUserId(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      category = [],
      tags = [],
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const skip = (page - 1) * limit;
    const query = { userId };

    // Add category filtering (based on mime type)
    if (category.length > 0) {
      const mimeTypePatterns = [];
      
      category.forEach(cat => {
        switch (cat.toLowerCase()) {
          case 'image':
            mimeTypePatterns.push(/^image\//);
            break;
          case 'document':
            mimeTypePatterns.push(/pdf|word|document|excel|spreadsheet|powerpoint|presentation/);
            break;
          case 'text':
            mimeTypePatterns.push(/^text\//);
            break;
          case 'video':
            mimeTypePatterns.push(/^video\//);
            break;
          case 'audio':
            mimeTypePatterns.push(/^audio\//);
            break;
          case 'archive':
            mimeTypePatterns.push(/zip|rar|tar/);
            break;
        }
      });
      
      if (mimeTypePatterns.length > 0) {
        query.mimeType = { $in: mimeTypePatterns };
      }
    }

    // Add tag filtering
    if (tags.length > 0) {
      query['metadata.tags'] = { $in: tags };
    }

    // Add text search
    if (search) {
      query.$or = [
        { originalName: { $regex: search, $options: 'i' } },
        { 'metadata.description': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [files, totalCount] = await Promise.all([
      File.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      File.countDocuments(query)
    ]);

    return {
      files,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalFiles: totalCount,
        limit,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1
      }
    };
  }

  /**
   * Find a file by ID and user ID
   * @param {string} fileId - File ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} File or null
   */
  async findByIdAndUserId(fileId, userId) {
    return await File.findOne({ _id: fileId, userId }).lean();
  }

  /**
   * Update a file by ID and user ID
   * @param {string} fileId - File ID
   * @param {string} userId - User ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object|null>} Updated file or null
   */
  async updateByIdAndUserId(fileId, userId, updateData) {
    return await File.findOneAndUpdate(
      { _id: fileId, userId },
      { ...updateData, updatedAt: new Date() },
      { new: true, lean: true }
    );
  }

  /**
   * Delete a file by ID and user ID
   * @param {string} fileId - File ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Deleted file or null
   */
  async deleteByIdAndUserId(fileId, userId) {
    return await File.findOneAndDelete({ _id: fileId, userId }).lean();
  }

  /**
   * Get file statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} File statistics
   */
  async getStatsByUserId(userId) {
    const stats = await File.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalFiles: { $sum: 1 },
          totalSize: { $sum: '$size' },
          avgFileSize: { $avg: '$size' },
          maxFileSize: { $max: '$size' },
          minFileSize: { $min: '$size' },
          totalTags: { $sum: { $size: '$metadata.tags' } }
        }
      }
    ]);

    const categoryStats = await File.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $regexMatch: { input: '$mimeType', regex: /^image\// } }, then: 'image' },
                { case: { $regexMatch: { input: '$mimeType', regex: /pdf|word|document|excel|spreadsheet|powerpoint|presentation/ } }, then: 'document' },
                { case: { $regexMatch: { input: '$mimeType', regex: /^text\// } }, then: 'text' },
                { case: { $regexMatch: { input: '$mimeType', regex: /^video\// } }, then: 'video' },
                { case: { $regexMatch: { input: '$mimeType', regex: /^audio\// } }, then: 'audio' },
                { case: { $regexMatch: { input: '$mimeType', regex: /zip|rar|tar/ } }, then: 'archive' }
              ],
              default: 'other'
            }
          },
          count: { $sum: 1 },
          size: { $sum: '$size' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const result = stats[0] || {
      totalFiles: 0,
      totalSize: 0,
      avgFileSize: 0,
      maxFileSize: 0,
      minFileSize: 0,
      totalTags: 0
    };

    result.categoryBreakdown = categoryStats.reduce((acc, cat) => {
      acc[cat._id] = {
        count: cat.count,
        size: cat.size
      };
      return acc;
    }, {});

    return result;
  }

  /**
   * Get all unique tags for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of unique tags
   */
  async getTagsByUserId(userId) {
    const result = await File.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $unwind: '$metadata.tags' },
      { $group: { _id: '$metadata.tags', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $project: { tag: '$_id', count: 1, _id: 0 } }
    ]);

    return result;
  }

  /**
   * Find files by category for a user
   * @param {string} userId - User ID
   * @param {string} category - File category
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Files in category
   */
  async findByCategoryAndUserId(userId, category, options = {}) {
    const { limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    
    let mimeTypePattern;
    switch (category.toLowerCase()) {
      case 'image':
        mimeTypePattern = /^image\//;
        break;
      case 'document':
        mimeTypePattern = /pdf|word|document|excel|spreadsheet|powerpoint|presentation/;
        break;
      case 'text':
        mimeTypePattern = /^text\//;
        break;
      case 'video':
        mimeTypePattern = /^video\//;
        break;
      case 'audio':
        mimeTypePattern = /^audio\//;
        break;
      case 'archive':
        mimeTypePattern = /zip|rar|tar/;
        break;
      default:
        return [];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    return await File.find({
      userId,
      mimeType: mimeTypePattern
    })
    .sort(sort)
    .limit(limit)
    .lean();
  }

  /**
   * Get recent files for a user
   * @param {string} userId - User ID
   * @param {number} limit - Number of files to return
   * @returns {Promise<Array>} Recent files
   */
  async getRecentByUserId(userId, limit = 10) {
    return await File.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Get large files for a user (above specified size)
   * @param {string} userId - User ID
   * @param {number} minSize - Minimum file size in bytes
   * @returns {Promise<Array>} Large files
   */
  async getLargeFilesByUserId(userId, minSize = 10 * 1024 * 1024) { // 10MB default
    return await File.find({
      userId,
      size: { $gte: minSize }
    })
    .sort({ size: -1 })
    .lean();
  }

  /**
   * Bulk delete files by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteAllByUserId(userId) {
    return await File.deleteMany({ userId });
  }
}

module.exports = new FileRepository();