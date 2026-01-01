const { body, validationResult } = require('express-validator');

/**
 * Validation rules for user registration
 */
const validateUserRegistration = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ min: 5, max: 100 })
    .withMessage('Email must be between 5 and 100 characters'),
  
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes')
];

/**
 * Validation rules for user login
 */
const validateUserLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * Validation rules for user profile update
 */
const validateUserProfileUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),
  
  body('preferences.notifications')
    .optional()
    .isBoolean()
    .withMessage('Notifications preference must be a boolean'),
  
  body('preferences.theme')
    .optional()
    .isIn(['light', 'dark'])
    .withMessage('Theme must be either light or dark')
];

/**
 * Validation rules for role update (admin only)
 */
const validateRoleUpdate = [
  body('role')
    .isIn(['standard', 'admin'])
    .withMessage('Role must be either standard or admin')
];

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: formattedErrors,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  next();
};

/**
 * Custom validation functions
 */
const customValidators = {
  /**
   * Check if email format is valid
   */
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Check if password meets security requirements
   */
  isStrongPassword: (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  },

  /**
   * Check if name contains only valid characters
   */
  isValidName: (name) => {
    const nameRegex = /^[a-zA-Z\s'-]+$/;
    return nameRegex.test(name);
  },

  /**
   * Sanitize user input to prevent XSS
   */
  sanitizeInput: (input) => {
    if (typeof input !== 'string') return input;
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, ''); // Remove event handlers
  }
};

// Export individual validation functions for direct use
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // At least 6 characters for basic validation (can be made stricter later)
  return password && password.length >= 6;
};

/**
 * Sanitize note input to prevent XSS
 */
const sanitizeNote = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

/**
 * Validate note title
 */
const validateNoteTitle = (title) => {
  return title && 
         typeof title === 'string' && 
         title.trim().length > 0 && 
         title.trim().length <= 200;
};

/**
 * Validate note content
 */
const validateNoteContent = (content) => {
  return content && 
         typeof content === 'string' && 
         content.trim().length > 0 && 
         content.trim().length <= 10000;
};

/**
 * Validate note tags
 */
const validateNoteTags = (tags) => {
  if (!tags) return true;
  if (!Array.isArray(tags)) return false;
  if (tags.length > 20) return false; // Max 20 tags
  
  return tags.every(tag => 
    typeof tag === 'string' && 
    tag.trim().length > 0 && 
    tag.trim().length <= 50
  );
};

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateUserProfileUpdate,
  validateRoleUpdate,
  handleValidationErrors,
  customValidators,
  validateEmail,
  validatePassword,
  sanitizeNote,
  validateNoteTitle,
  validateNoteContent,
  validateNoteTags
};