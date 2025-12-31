const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `${requiredRole} role required`
        }
      });
    }

    next();
  };
};

const requireAdmin = requireRole('admin');

module.exports = {
  requireRole,
  requireAdmin
};