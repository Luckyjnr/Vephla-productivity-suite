const auditService = require('../../src/services/auditService');
const AuditLog = require('../../src/models/AuditLog');

// Mock the AuditLog model
jest.mock('../../src/models/AuditLog');

describe('Audit Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logAction', () => {
    test('should create audit log with all parameters', async () => {
      const mockAuditLog = {
        adminId: 'admin123',
        action: 'role_change',
        targetUserId: 'user123',
        changes: { oldRole: 'standard', newRole: 'admin' },
        ipAddress: '127.0.0.1',
        save: jest.fn().mockResolvedValue(true)
      };

      AuditLog.mockImplementation(() => mockAuditLog);

      const result = await auditService.logAction(
        'admin123',
        'role_change',
        'user123',
        { oldRole: 'standard', newRole: 'admin' },
        '127.0.0.1'
      );

      expect(AuditLog).toHaveBeenCalledWith({
        adminId: 'admin123',
        action: 'role_change',
        targetUserId: 'user123',
        changes: { oldRole: 'standard', newRole: 'admin' },
        ipAddress: '127.0.0.1'
      });
      expect(mockAuditLog.save).toHaveBeenCalled();
      expect(result).toBe(mockAuditLog);
    });

    test('should create audit log with minimal parameters', async () => {
      const mockAuditLog = {
        adminId: 'admin123',
        action: 'system_config',
        targetUserId: null,
        changes: null,
        ipAddress: null,
        save: jest.fn().mockResolvedValue(true)
      };

      AuditLog.mockImplementation(() => mockAuditLog);

      const result = await auditService.logAction('admin123', 'system_config');

      expect(AuditLog).toHaveBeenCalledWith({
        adminId: 'admin123',
        action: 'system_config',
        targetUserId: null,
        changes: null,
        ipAddress: null
      });
      expect(result).toBe(mockAuditLog);
    });

    test('should handle errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      AuditLog.mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await auditService.logAction('admin123', 'test_action');

      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('getAuditLogs', () => {
    test('should return paginated audit logs', async () => {
      const mockLogs = [
        { adminId: 'admin1', action: 'action1' },
        { adminId: 'admin2', action: 'action2' }
      ];

      AuditLog.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockLogs)
      });
      AuditLog.countDocuments.mockResolvedValue(3);

      const result = await auditService.getAuditLogs(1, 2);

      expect(result.logs).toEqual(mockLogs);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(2);
      expect(result.pagination.pages).toBe(2);
    });

    test('should handle empty audit log collection', async () => {
      AuditLog.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });
      AuditLog.countDocuments.mockResolvedValue(0);

      const result = await auditService.getAuditLogs();

      expect(result.logs).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.pages).toBe(0);
    });

    test('should use default pagination values', async () => {
      AuditLog.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });
      AuditLog.countDocuments.mockResolvedValue(0);

      const result = await auditService.getAuditLogs();

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(50);
    });
  });
});