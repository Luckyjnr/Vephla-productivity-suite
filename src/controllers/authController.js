const authService = require('../services/authService');

const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: {
          code: 'MISSING_FIELDS',
          message: 'Email and password are required'
        }
      });
    }

    const result = await authService.registerUser(email, password);
    res.status(201).json(result);

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.message === 'INVALID_EMAIL') {
      return res.status(400).json({
        error: {
          code: 'INVALID_EMAIL',
          message: 'Please provide a valid email address'
        }
      });
    }
    
    if (error.message === 'INVALID_PASSWORD') {
      return res.status(400).json({
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Password must be at least 6 characters long'
        }
      });
    }
    
    if (error.message === 'EMAIL_EXISTS') {
      return res.status(409).json({
        error: {
          code: 'EMAIL_EXISTS',
          message: 'User with this email already exists'
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

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: {
          code: 'MISSING_FIELDS',
          message: 'Email and password are required'
        }
      });
    }

    const result = await authService.loginUser(email, password);
    res.json(result);

  } catch (error) {
    console.error('Login error:', error);
    
    if (error.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
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

module.exports = {
  register,
  login
};