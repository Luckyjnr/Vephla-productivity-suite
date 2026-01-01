const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 50
  }],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  isPrivate: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient querying by user and tags
noteSchema.index({ userId: 1, tags: 1 });
noteSchema.index({ userId: 1, createdAt: -1 });
noteSchema.index({ userId: 1, updatedAt: -1 });

// Virtual for note summary (first 100 characters of content)
noteSchema.virtual('summary').get(function() {
  return this.content.length > 100 
    ? this.content.substring(0, 100) + '...' 
    : this.content;
});

// Ensure virtuals are included in JSON output
noteSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Note', noteSchema);