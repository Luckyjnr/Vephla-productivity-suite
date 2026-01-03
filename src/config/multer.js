const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create user-specific directory
    const userId = req.user?.userId;
    if (!userId) {
      return cb(new Error('User not authenticated'), null);
    }

    const userDir = path.join(uploadsDir, userId);
    
    // Create user directory if it doesn't exist
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    cb(null, userDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp and random string
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(file.originalname);
    const filename = `${timestamp}-${randomString}${extension}`;
    
    cb(null, filename);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Check if file type is allowed
  const allowedMimeTypes = [
    // Images
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Text files
    'text/plain', 'text/csv', 'text/html', 'text/css', 'text/javascript',
    'application/json', 'application/xml',
    // Archives
    'application/zip', 'application/x-rar-compressed', 'application/x-tar',
    // Audio
    'audio/mpeg', 'audio/wav', 'audio/ogg',
    // Video
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10 // Maximum 10 files per request
  }
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'File size exceeds 50MB limit'
          }
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          error: {
            code: 'TOO_MANY_FILES',
            message: 'Maximum 10 files allowed per upload'
          }
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          error: {
            code: 'UNEXPECTED_FILE',
            message: 'Unexpected file field'
          }
        });
      default:
        return res.status(400).json({
          error: {
            code: 'UPLOAD_ERROR',
            message: error.message
          }
        });
    }
  }

  if (error.message.includes('File type') && error.message.includes('not allowed')) {
    return res.status(400).json({
      error: {
        code: 'INVALID_FILE_TYPE',
        message: error.message
      }
    });
  }

  if (error.message === 'User not authenticated') {
    return res.status(401).json({
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'User authentication required for file upload'
      }
    });
  }

  next(error);
};

// Utility function to clean up uploaded files on error
const cleanupFiles = (files) => {
  if (!files) return;
  
  const filesToClean = Array.isArray(files) ? files : [files];
  
  filesToClean.forEach(file => {
    if (file.path && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (error) {
        console.error('Error cleaning up file:', file.path, error);
      }
    }
  });
};

// Utility function to get file info
const getFileInfo = (file) => {
  return {
    filename: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    path: file.path
  };
};

module.exports = {
  upload,
  handleMulterError,
  cleanupFiles,
  getFileInfo,
  uploadsDir
};