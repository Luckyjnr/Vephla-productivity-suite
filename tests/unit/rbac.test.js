const { requireRole, requireAdmin } = require('../../src/middleware/rbac');

describe('RBAC Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('requireRole middleware', () => {
    test('should allow access when user has required role', () => {
      req.user = { userId: '123', role: 'admin' };
      const middleware = requireRole('admin');
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should deny access when user has different role', () => {
      req.user = { userId: '123', role: 'standard' };
      const middleware = requireRole('admin');
      
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'admin role required'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should deny access when user is not authenticated', () => {
      // req.user is undefined
      const middleware = requireRole('admin');
      
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should work with standard role requirement', () => {
      req.user = { userId: '123', role: 'standard' };
      const middleware = requireRole('standard');
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin middleware', () => {
    test('should allow access for admin users', () => {
      req.user = { userId: '123', role: 'admin' };
      
      requireAdmin(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should deny access for standard users', () => {
      req.user = { userId: '123', role: 'standard' };
      
      requireAdmin(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'admin role required'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should deny access for unauthenticated users', () => {
      // req.user is undefined
      
      requireAdmin(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});