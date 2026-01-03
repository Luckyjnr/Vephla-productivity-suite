const fileService = require('../services/fileService');

/**
 * Upload files
 * POST /files
 */
const uploadFiles = async (req, res) => {
  try {
    const userId = req.user.userId;
    const files = req.files;
    const { description, tags } = req.body;

    if (!files || files.length === 0) {
      return res.status(400).json({
        error: {
          code: 'NO_FILES_PROVIDED',
          message: 'No files were uploaded'
        }
      });
    }

    // Parse tags if provided as string
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (error) {
        return res.status(400).json({
          error: {
            code: 'INVALID_TAGS_FORMAT',
            message: 'Tags must be a valid JSON array'
          }
        });
      }
    }

    const result = await fileService.uploadFiles(userId, files, {
      description,
      tags: parsedTags
    });

    res.status(201).json(result);

  } catch (error) {
    console.error('Upload files error:', error);

    if (error.message === 'NO_FILES_PROVIDED') {
      return res.status(400).json({
        error: {
          code: 'NO_FILES_PROVIDED',
          message: 'No files were uploaded'
        }
      });
    }

    if (error.message === 'INVALID_DESCRIPTION') {
      return res.status(400).json({
        error: {
          code: 'INVALID_DESCRIPTION',
          message: 'Description must be less than 500 characters'
        }
      });
    }

    if (error.message === 'INVALID_TAGS') {
      return res.status(400).json({
        error: {
          code: 'INVALID_TAGS',
          message: 'Tags must be an array of strings, max 10 tags, each max 50 characters'
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
 * Get files with filtering and pagination
 * GET /files
 */
const getFiles = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      page,
      limit,
      category,
      tags,
      search,
      sortBy,
      sortOrder
    } = req.query;

    const result = await fileService.getFiles(userId, {
      page,
      limit,
      category,
      tags,
      search,
      sortBy,
      sortOrder
    });

    res.json(result);

  } catch (error) {
    console.error('Get files error:', error);

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
};

/**
 * Get a single file by ID
 * GET /files/:id
 */
const getFileById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id: fileId } = req.params;

    const result = await fileService.getFileById(userId, fileId);
    res.json(result);

  } catch (error) {
    console.error('Get file by ID error:', error);

    if (error.message === 'INVALID_FILE_ID') {
      return res.status(400).json({
        error: {
          code: 'INVALID_FILE_ID',
          message: 'Invalid file ID format'
        }
      });
    }

    if (error.message === 'FILE_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'File not found or access denied'
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
 * Update file metadata
 * PUT /files/:id
 */
const updateFileMetadata = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id: fileId } = req.params;
    const { description, tags } = req.body;

    const result = await fileService.updateFileMetadata(userId, fileId, {
      description,
      tags
    });

    res.json(result);

  } catch (error) {
    console.error('Update file metadata error:', error);

    if (error.message === 'INVALID_FILE_ID') {
      return res.status(400).json({
        error: {
          code: 'INVALID_FILE_ID',
          message: 'Invalid file ID format'
        }
      });
    }

    if (error.message === 'FILE_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'File not found or access denied'
        }
      });
    }

    if (error.message === 'INVALID_DESCRIPTION') {
      return res.status(400).json({
        error: {
          code: 'INVALID_DESCRIPTION',
          message: 'Description must be less than 500 characters'
        }
      });
    }

    if (error.message === 'INVALID_TAGS') {
      return res.status(400).json({
        error: {
          code: 'INVALID_TAGS',
          message: 'Tags must be an array of strings, max 10 tags, each max 50 characters'
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
 * Delete a file
 * DELETE /files/:id
 */
const deleteFile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id: fileId } = req.params;

    const result = await fileService.deleteFile(userId, fileId);
    res.json(result);

  } catch (error) {
    console.error('Delete file error:', error);

    if (error.message === 'INVALID_FILE_ID') {
      return res.status(400).json({
        error: {
          code: 'INVALID_FILE_ID',
          message: 'Invalid file ID format'
        }
      });
    }

    if (error.message === 'FILE_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'File not found or access denied'
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
 * Download a file
 * GET /files/:id/download
 */
const downloadFile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id: fileId } = req.params;

    const result = await fileService.downloadFile(userId, fileId);
    
    // Set appropriate headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${result.downloadName}"`);
    res.setHeader('Content-Type', result.file.mimeType);
    
    // Send the file
    res.sendFile(result.downloadPath);

  } catch (error) {
    console.error('Download file error:', error);

    if (error.message === 'INVALID_FILE_ID') {
      return res.status(400).json({
        error: {
          code: 'INVALID_FILE_ID',
          message: 'Invalid file ID format'
        }
      });
    }

    if (error.message === 'FILE_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'File not found or access denied'
        }
      });
    }

    if (error.message === 'PHYSICAL_FILE_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'PHYSICAL_FILE_NOT_FOUND',
          message: 'Physical file not found on server'
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
 * Get file statistics
 * GET /files/stats
 */
const getFileStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await fileService.getFileStats(userId);
    res.json(result);

  } catch (error) {
    console.error('Get file stats error:', error);

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
};

/**
 * Get file tags
 * GET /files/tags
 */
const getFileTags = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await fileService.getFileTags(userId);
    res.json(result);

  } catch (error) {
    console.error('Get file tags error:', error);

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
};

/**
 * Get files by category
 * GET /files/category/:category
 */
const getFilesByCategory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { category } = req.params;
    const { limit, sortBy, sortOrder } = req.query;

    const result = await fileService.getFilesByCategory(userId, category, {
      limit,
      sortBy,
      sortOrder
    });

    res.json(result);

  } catch (error) {
    console.error('Get files by category error:', error);

    if (error.message === 'INVALID_CATEGORY') {
      return res.status(400).json({
        error: {
          code: 'INVALID_CATEGORY',
          message: 'Category must be one of: image, document, text, video, audio, archive'
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
 * Get recent files
 * GET /files/recent
 */
const getRecentFiles = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit } = req.query;

    const result = await fileService.getRecentFiles(userId, limit);
    res.json(result);

  } catch (error) {
    console.error('Get recent files error:', error);

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
};

/**
 * Get large files
 * GET /files/large
 */
const getLargeFiles = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { minSize } = req.query;

    const result = await fileService.getLargeFiles(userId, minSize);
    res.json(result);

  } catch (error) {
    console.error('Get large files error:', error);

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
};

/**
 * Bulk delete files
 * DELETE /files/bulk
 */
const bulkDeleteFiles = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { fileIds } = req.body;

    if (!fileIds || !Array.isArray(fileIds)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'fileIds array is required'
        }
      });
    }

    const result = await fileService.bulkDeleteFiles(userId, fileIds);
    res.json(result);

  } catch (error) {
    console.error('Bulk delete files error:', error);

    if (error.message === 'INVALID_FILE_IDS') {
      return res.status(400).json({
        error: {
          code: 'INVALID_FILE_IDS',
          message: 'Invalid file IDs provided'
        }
      });
    }

    if (error.message === 'TOO_MANY_FILES') {
      return res.status(400).json({
        error: {
          code: 'TOO_MANY_FILES',
          message: 'Maximum 50 files can be deleted at once'
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
 * Cleanup orphaned files
 * POST /files/cleanup
 */
const cleanupOrphanedFiles = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await fileService.cleanupOrphanedFiles(userId);
    res.json(result);

  } catch (error) {
    console.error('Cleanup orphaned files error:', error);

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
};

module.exports = {
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
};