const { verifyToken } = require('../utils/jwt');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      error: { 
        code: 'MISSING_TOKEN',
        message: 'Access token is required' 
      } 
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: { 
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired' 
        } 
      });
    }
    
    return res.status(401).json({ 
      error: { 
        code: 'INVALID_TOKEN',
        message: 'Invalid token' 
      } 
    });
  }
};

module.exports = {
  authenticateToken
};