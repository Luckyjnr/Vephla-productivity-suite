const fc = require('fast-check');
const { requireRole, requireAdmin } = require('../../src/middleware/rbac');

describe('RBAC Property Tests', () => {
  describe('Property 5: Role-based access enforcement', () => {
    /**
     * **Feature: productivity-suite, Property 5: Role-based access enforcement**
     * **Validates: Requirements 3.1, 3.3**
     */
    test('For any admin operation, only users with admin role should be granted access, while standard users should receive authorization errors', () => {
      fc.assert(fc.property(
        fc.record({
          userId: fc.string(),
          role: fc.constantFrom('standard', 'admin')
        }),
        (user) => {
          const req = { user };
          const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
          };
          const next = jest.fn();

          const adminMiddleware = requireAdmin;
          adminMiddleware(req, res, next);

          if (user.role === 'admin') {
            // Admin users should be allowed to proceed
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
          } else {
            // Standard users should be denied
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
              error: {
                code: 'INSUFFICIENT_PERMISSIONS',
                message: 'admin role required'
              }
            });
            expect(next).not.toHaveBeenCalled();
          }
        }
      ), { numRuns: 100 });
    });

    test('For any role requirement, users with correct role should be granted access', () => {
      fc.assert(fc.property(
        fc.record({
          userId: fc.string(),
          role: fc.constantFrom('standard', 'admin')
        }),
        fc.constantFrom('standard', 'admin'),
        (user, requiredRole) => {
          const req = { user };
          const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
          };
          const next = jest.fn();

          const roleMiddleware = requireRole(requiredRole);
          roleMiddleware(req, res, next);

          if (user.role === requiredRole) {
            // Users with correct role should be allowed
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
          } else {
            // Users with incorrect role should be denied
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
              error: {
                code: 'INSUFFICIENT_PERMISSIONS',
                message: `${requiredRole} role required`
              }
            });
            expect(next).not.toHaveBeenCalled();
          }
        }
      ), { numRuns: 100 });
    });

    test('For any request without user context, access should be denied', () => {
      fc.assert(fc.property(
        fc.constantFrom('standard', 'admin'),
        (requiredRole) => {
          const req = {}; // No user context
          const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
          };
          const next = jest.fn();

          const roleMiddleware = requireRole(requiredRole);
          roleMiddleware(req, res, next);

          expect(res.status).toHaveBeenCalledWith(401);
          expect(res.json).toHaveBeenCalledWith({
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required'
            }
          });
          expect(next).not.toHaveBeenCalled();
        }
      ), { numRuns: 100 });
    });
  });
});