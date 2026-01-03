const fileRepository = require('../repositories/fileRepository');
const { 
  validateFileDescription, 
  validateFileTags, 
  validateFileSize,
  validateMimeType,
  sanitizeNote 
} = require('../utils/validators');
const { cleanupFiles } = require('../config/multer');
const fs = require('fs');
const path = require('path');

class FileService {
  /**
   * Upload and create file records
   * @param {string} userId - User ID
   * @param {Array|Object} files - Uploaded files from multer
   * @param {Object} metadata - File metadata
   * @returns {Promise<Object>} Upload result
   */
  async uploadFiles(userId, files, metadata = {}) {
    const { description, tags = [] } = metadata;
    
    // Ensure files is an array
    const fileArray = Array.isArray(files) ? files : [files];
    
    if (fileArray.length === 0) {
      throw new Error('NO_FILES_PROVIDED');
    }

    // Validate metadata
    if (description && !validateFileDescription(description)) {
      cleanupFiles(fileArray);
      throw new Error('INVALID_DESCRIPTION');
    }

    if (!validateFileTags(tags)) {
      cleanupFiles(fileArray);
      throw new Error('INVALID_TAGS');
    }

    const uploadedFiles = [];
    const errors = [];

    for (const file of fileArray) {
      try {
        // Validate file
        if (!validateFileSize(file.size)) {
          throw new Error('FILE_TOO_LARGE');
        }

        if (!validateMimeType(file.mimetype)) {
          throw new Error('INVALID_FILE_TYPE');
        }

        // Sanitize metadata
        const sanitizedDescription = description ? sanitizeNote(description.trim()) : undefined;
        const sanitizedTags = tags.map(tag => sanitizeNote(tag.trim().toLowerCase()));

        // Create file record
        const fileData = {
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: file.path,
          userId,
          metadata: {
            description: sanitizedDescription,
            tags: sanitizedTags
          }
        };

        const createdFile = await fileRepository.create(fileData);
        uploadedFiles.push(this._formatFileResponse(createdFile));

      } catch (error) {
        // Clean up the file on error
        if (file.path && fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
          } catch (cleanupError) {
            console.error('Error cleaning up file:', file.path, cleanupError);
          }
        }

        errors.push({
          filename: file.originalname,
          error: error.message
        });
      }
    }

    return {
      message: `Upload completed: ${uploadedFiles.length} successful, ${errors.length} failed`,
      uploadedFiles,
      errors: errors.length > 0 ? errors : undefined,
      totalUploaded: uploadedFiles.length,
      totalErrors: errors.length
    };
  }

  /**
   * Get files for a user with filtering and pagination
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Files with pagination
   */
  async getFiles(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      category = [],
      tags = [],
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    // Validate pagination parameters
    const validatedPage = Math.max(1, parseInt(page));
    const validatedLimit = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 per page

    // Validate sort parameters
    const validSortFields = ['createdAt', 'updatedAt', 'originalName', 'size'];
    const validatedSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const validatedSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';

    // Parse category and tags arrays
    const parsedCategory = Array.isArray(category) ? category : (category ? category.split(',') : []);
    const parsedTags = Array.isArray(tags) ? tags : (tags ? tags.split(',') : []);

    const queryOptions = {
      page: validatedPage,
      limit: validatedLimit,
      category: parsedCategory,
      tags: parsedTags,
      search: search.trim(),
      sortBy: validatedSortBy,
      sortOrder: validatedSortOrder
    };

    const result = await fileRepository.findByUserId(userId, queryOptions);

    return {
      files: result.files.map(file => this._formatFileResponse(file)),
      pagination: result.pagination,
      filters: {
        category: parsedCategory,
        tags: parsedTags,
        search: search.trim(),
        sortBy: validatedSortBy,
        sortOrder: validatedSortOrder
      }
    };
  }

  /**
   * Get a single file by ID
   * @param {string} userId - User ID
   * @param {string} fileId - File ID
   * @returns {Promise<Object>} File
   */
  async getFileById(userId, fileId) {
    if (!fileId || typeof fileId !== 'string') {
      throw new Error('INVALID_FILE_ID');
    }

    const file = await fileRepository.findByIdAndUserId(fileId, userId);
    
    if (!file) {
      throw new Error('FILE_NOT_FOUND');
    }

    return {
      file: this._formatFileResponse(file)
    };
  }

  /**
   * Update file metadata
   * @param {string} userId - User ID
   * @param {string} fileId - File ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated file
   */
  async updateFileMetadata(userId, fileId, updateData) {
    if (!fileId || typeof fileId !== 'string') {
      throw new Error('INVALID_FILE_ID');
    }

    const { description, tags } = updateData;
    const updateFields = {};

    // Validate and sanitize description if provided
    if (description !== undefined) {
      if (description && !validateFileDescription(description)) {
        throw new Error('INVALID_DESCRIPTION');
      }
      updateFields['metadata.description'] = description ? sanitizeNote(description.trim()) : undefined;
    }

    // Validate and sanitize tags if provided
    if (tags !== undefined) {
      if (!validateFileTags(tags)) {
        throw new Error('INVALID_TAGS');
      }
      updateFields['metadata.tags'] = tags.map(tag => sanitizeNote(tag.trim().toLowerCase()));
    }

    // Check if file exists and belongs to user
    const existingFile = await fileRepository.findByIdAndUserId(fileId, userId);
    if (!existingFile) {
      throw new Error('FILE_NOT_FOUND');
    }

    // Update file metadata
    const updatedFile = await fileRepository.updateByIdAndUserId(fileId, userId, updateFields);

    return {
      message: 'File metadata updated successfully',
      file: this._formatFileResponse(updatedFile)
    };
  }

  /**
   * Delete a file
   * @param {string} userId - User ID
   * @param {string} fileId - File ID
   * @returns {Promise<Object>} Success message
   */
  async deleteFile(userId, fileId) {
    if (!fileId || typeof fileId !== 'string') {
      throw new Error('INVALID_FILE_ID');
    }

    const deletedFile = await fileRepository.deleteByIdAndUserId(fileId, userId);
    
    if (!deletedFile) {
      throw new Error('FILE_NOT_FOUND');
    }

    // Delete physical file
    if (deletedFile.path && fs.existsSync(deletedFile.path)) {
      try {
        fs.unlinkSync(deletedFile.path);
      } catch (error) {
        console.error('Error deleting physical file:', deletedFile.path, error);
        // Don't throw error here as database record is already deleted
      }
    }

    return {
      message: 'File deleted successfully',
      deletedFile: {
        id: deletedFile._id,
        originalName: deletedFile.originalName
      }
    };
  }

  /**
   * Download a file
   * @param {string} userId - User ID
   * @param {string} fileId - File ID
   * @returns {Promise<Object>} File download info
   */
  async downloadFile(userId, fileId) {
    if (!fileId || typeof fileId !== 'string') {
      throw new Error('INVALID_FILE_ID');
    }

    const file = await fileRepository.findByIdAndUserId(fileId, userId);
    
    if (!file) {
      throw new Error('FILE_NOT_FOUND');
    }

    // Check if physical file exists
    if (!fs.existsSync(file.path)) {
      throw new Error('PHYSICAL_FILE_NOT_FOUND');
    }

    return {
      file: this._formatFileResponse(file),
      downloadPath: file.path,
      downloadName: file.originalName
    };
  }

  /**
   * Get file statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} File statistics
   */
  async getFileStats(userId) {
    const stats = await fileRepository.getStatsByUserId(userId);
    
    // Convert bytes to human readable format
    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return {
      statistics: {
        totalFiles: stats.totalFiles,
        totalSize: stats.totalSize,
        totalSizeFormatted: formatBytes(stats.totalSize),
        averageFileSize: Math.round(stats.avgFileSize || 0),
        averageFileSizeFormatted: formatBytes(Math.round(stats.avgFileSize || 0)),
        largestFile: stats.maxFileSize,
        largestFileFormatted: formatBytes(stats.maxFileSize || 0),
        smallestFile: stats.minFileSize,
        smallestFileFormatted: formatBytes(stats.minFileSize || 0),
        totalTags: stats.totalTags,
        categoryBreakdown: stats.categoryBreakdown
      },
      message: 'Statistics retrieved successfully'
    };
  }

  /**
   * Get user's file tags with statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Tags with statistics
   */
  async getFileTags(userId) {
    const tags = await fileRepository.getTagsByUserId(userId);
    
    return {
      tags,
      totalTags: tags.length,
      message: tags.length > 0 ? 'Tags retrieved successfully' : 'No tags found'
    };
  }

  /**
   * Get files by category
   * @param {string} userId - User ID
   * @param {string} category - File category
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Files by category
   */
  async getFilesByCategory(userId, category, options = {}) {
    const validCategories = ['image', 'document', 'text', 'video', 'audio', 'archive'];
    
    if (!validCategories.includes(category.toLowerCase())) {
      throw new Error('INVALID_CATEGORY');
    }

    const { limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const files = await fileRepository.findByCategoryAndUserId(userId, category, {
      limit: Math.min(100, Math.max(1, parseInt(limit))),
      sortBy,
      sortOrder
    });

    return {
      files: files.map(file => this._formatFileResponse(file)),
      category,
      count: files.length,
      message: `${category} files retrieved successfully`
    };
  }

  /**
   * Get recent files for a user
   * @param {string} userId - User ID
   * @param {number} limit - Number of files to return
   * @returns {Promise<Object>} Recent files
   */
  async getRecentFiles(userId, limit = 10) {
    const validatedLimit = Math.min(50, Math.max(1, parseInt(limit)));
    const files = await fileRepository.getRecentByUserId(userId, validatedLimit);
    
    return {
      files: files.map(file => this._formatFileResponse(file)),
      count: files.length,
      message: 'Recent files retrieved successfully'
    };
  }

  /**
   * Get large files for a user
   * @param {string} userId - User ID
   * @param {number} minSize - Minimum file size in MB
   * @returns {Promise<Object>} Large files
   */
  async getLargeFiles(userId, minSize = 10) {
    const minSizeBytes = Math.max(1, parseInt(minSize)) * 1024 * 1024; // Convert MB to bytes
    const files = await fileRepository.getLargeFilesByUserId(userId, minSizeBytes);
    
    return {
      files: files.map(file => this._formatFileResponse(file)),
      count: files.length,
      minSizeMB: minSize,
      message: `Files larger than ${minSize}MB retrieved successfully`
    };
  }

  /**
   * Bulk delete files
   * @param {string} userId - User ID
   * @param {Array} fileIds - Array of file IDs
   * @returns {Promise<Object>} Bulk delete result
   */
  async bulkDeleteFiles(userId, fileIds) {
    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      throw new Error('INVALID_FILE_IDS');
    }

    if (fileIds.length > 50) {
      throw new Error('TOO_MANY_FILES'); // Limit bulk operations
    }

    let deletedCount = 0;
    const errors = [];
    const deletedFiles = [];

    for (const fileId of fileIds) {
      try {
        const deletedFile = await fileRepository.deleteByIdAndUserId(fileId, userId);
        if (deletedFile) {
          deletedCount++;
          deletedFiles.push({
            id: deletedFile._id,
            originalName: deletedFile.originalName
          });

          // Delete physical file
          if (deletedFile.path && fs.existsSync(deletedFile.path)) {
            try {
              fs.unlinkSync(deletedFile.path);
            } catch (error) {
              console.error('Error deleting physical file:', deletedFile.path, error);
            }
          }
        }
      } catch (error) {
        errors.push({ fileId, error: error.message });
      }
    }

    return {
      message: `Bulk delete completed`,
      deletedCount,
      totalRequested: fileIds.length,
      deletedFiles,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Clean up orphaned files (files without database records)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupOrphanedFiles(userId) {
    const userDir = path.join(__dirname, '../../uploads', userId);
    
    if (!fs.existsSync(userDir)) {
      return {
        message: 'No user directory found',
        cleanedFiles: 0
      };
    }

    const physicalFiles = fs.readdirSync(userDir);
    const dbFiles = await fileRepository.findByUserId(userId, { limit: 1000 }); // Get all files
    const dbFilenames = new Set(dbFiles.files.map(f => f.filename));

    let cleanedCount = 0;
    const cleanedFiles = [];

    for (const filename of physicalFiles) {
      if (!dbFilenames.has(filename)) {
        const filePath = path.join(userDir, filename);
        try {
          fs.unlinkSync(filePath);
          cleanedCount++;
          cleanedFiles.push(filename);
        } catch (error) {
          console.error('Error cleaning orphaned file:', filePath, error);
        }
      }
    }

    return {
      message: `Cleanup completed: ${cleanedCount} orphaned files removed`,
      cleanedFiles,
      cleanedCount
    };
  }

  /**
   * Format file response for API
   * @private
   * @param {Object} file - Raw file from database
   * @returns {Object} Formatted file
   */
  _formatFileResponse(file) {
    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getCategory = (mimeType) => {
      const mime = mimeType.toLowerCase();
      if (mime.startsWith('image/')) return 'image';
      if (mime.startsWith('video/')) return 'video';
      if (mime.startsWith('audio/')) return 'audio';
      if (mime.includes('pdf')) return 'pdf';
      if (mime.includes('word') || mime.includes('document')) return 'document';
      if (mime.includes('spreadsheet') || mime.includes('excel')) return 'spreadsheet';
      if (mime.includes('presentation') || mime.includes('powerpoint')) return 'presentation';
      if (mime.includes('text/')) return 'text';
      if (mime.includes('zip') || mime.includes('rar') || mime.includes('tar')) return 'archive';
      return 'other';
    };

    const getExtension = (filename) => {
      const parts = filename.split('.');
      return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
    };

    return {
      id: file._id,
      filename: file.filename,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      sizeFormatted: formatBytes(file.size),
      category: getCategory(file.mimeType),
      extension: getExtension(file.originalName),
      metadata: {
        description: file.metadata?.description || null,
        tags: file.metadata?.tags || []
      },
      createdAt: file.createdAt,
      updatedAt: file.updatedAt
    };
  }
}

module.exports = new FileService();