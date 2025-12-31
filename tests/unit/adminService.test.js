const adminService = require('../../src/services/adminService');
const auditService = require('../../src/services/auditService');
const User = require('../../src/models/User');

// Mock the User model and audit service
jest.mock('../../src/models/User');
jest.mock('../../src/services/auditService');

describe('Admin Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    test('should return paginated users without password hashes', async () => {
      const mockUsers = [
        { _id: '1', email: 'user1@test.com', role: 'standard', createdAt: new Date() },
        { _id: '2', email: 'user2@test.com', role: 'admin', createdAt: new Date() }
      ];

      User.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockUsers)
      });
      User.countDocuments.mockResolvedValue(3);

      const result = await adminService.getAllUsers(1, 2);

      expect(result.users).toEqual(mockUsers);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.pages).toBe(2);
      expect(User.find).toHaveBeenCalled();
    });

    test('should handle empty user list', async () => {
      User.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });
      User.countDocuments.mockResolvedValue(0);

      const result = await adminService.getAllUsers();

      expect(result.users).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.pages).toBe(0);
    });
  });

  describe('updateUserRole', () => {
    test('should successfully update user role and log action', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@test.com',
        role: 'standard',
        save: jest.fn().mockResolvedValue(true),
        updatedAt: new Date()
      };

      User.findById.mockResolvedValue(mockUser);
      auditService.logAction.mockResolvedValue(true);

      const adminId = 'admin123';
      const result = await adminService.updateUserRole(
        adminId,
        'user123',
        'admin',
        '127.0.0.1'
      );

      expect(mockUser.role).toBe('admin');
      expect(mockUser.save).toHaveBeenCalled();
      expect(result.user.role).toBe('admin');
      expect(result.user.email).toBe('test@test.com');

      expect(auditService.logAction).toHaveBeenCalledWith(
        adminId,
        'role_change',
        'user123',
        { oldRole: 'standard', newRole: 'admin' },
        '127.0.0.1'
      );
    });

    test('should throw error for non-existent user', async () => {
      User.findById.mockResolvedValue(null);

      await expect(
        adminService.updateUserRole('admin123', 'user123', 'admin', '127.0.0.1')
      ).rejects.toThrow('USER_NOT_FOUND');
    });

    test('should throw error for invalid role', async () => {
      const mockUser = { _id: 'user123', role: 'standard' };
      User.findById.mockResolvedValue(mockUser);

      await expect(
        adminService.updateUserRole('admin123', 'user123', 'invalid', '127.0.0.1')
      ).rejects.toThrow('INVALID_ROLE');
    });

    test('should throw error when role is unchanged', async () => {
      const mockUser = { _id: 'user123', role: 'admin' };
      User.findById.mockResolvedValue(mockUser);

      await expect(
        adminService.updateUserRole('admin123', 'user123', 'admin', '127.0.0.1')
      ).rejects.toThrow('ROLE_UNCHANGED');
    });
  });
});