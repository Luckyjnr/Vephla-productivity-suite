const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  originalName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  mimeType: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  size: {
    type: Number,
    required: true,
    min: 0,
    max: 50 * 1024 * 1024 // 50MB max file size
  },
  path: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  metadata: {
    description: {
      type: String,
      trim: true,
      maxlength: 500
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 50
    }]
  }
}, {
  timestamps: true
});

// Compound indexes for efficient querying
fileSchema.index({ userId: 1, createdAt: -1 });
fileSchema.index({ userId: 1, mimeType: 1 });
fileSchema.index({ userId: 1, 'metadata.tags': 1 });

// Virtual for file extension
fileSchema.virtual('extension').get(function() {
  const parts = this.originalName.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
});

// Virtual for human-readable file size
fileSchema.virtual('humanSize').get(function() {
  const bytes = this.size;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, i)).toFixed(2);
  
  return `${size} ${sizes[i]}`;
});

// Virtual for file type category
fileSchema.virtual('category').get(function() {
  const mimeType = this.mimeType.toLowerCase();
  
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
  if (mimeType.includes('text/')) return 'text';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'archive';
  
  return 'other';
});

// Static method to validate file type
fileSchema.statics.isAllowedMimeType = function(mimeType) {
  const allowedTypes = [
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
  
  return allowedTypes.includes(mimeType.toLowerCase());
};

// Static method to get max file size
fileSchema.statics.getMaxFileSize = function() {
  return 50 * 1024 * 1024; // 50MB
};

// Pre-save middleware to validate file
fileSchema.pre('save', function(next) {
  // Validate mime type
  if (!this.constructor.isAllowedMimeType(this.mimeType)) {
    return next(new Error('File type not allowed'));
  }
  
  // Validate file size
  if (this.size > this.constructor.getMaxFileSize()) {
    return next(new Error('File size exceeds maximum limit'));
  }
  
  next();
});

// Ensure virtuals are included in JSON output
fileSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('File', fileSchema);