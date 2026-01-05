const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * GraphQL Context Function
 * Extracts user information from JWT token for GraphQL operations
 */
const createContext = async ({ req }) => {
  // Initialize context with default values
  let context = {
    user: null,
    isAuthenticated: false
  };

  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      
      if (token && token !== 'null' && token !== 'undefined') {
        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const user = await User.findById(decoded.userId).select('-password');
        
        if (user) {
          context.user = user;
          context.isAuthenticated = true;
        }
      }
    }
  } catch (error) {
    // Log authentication errors but don't throw
    // This allows unauthenticated queries to still work
    console.log('GraphQL authentication error:', error.message);
  }

  return context;
};

module.exports = { createContext };