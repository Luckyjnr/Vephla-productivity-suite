const fc = require('fast-check');
const auditService = require('../../src/services/auditService');
const AuditLog = require('../../src/models/AuditLog');

// Mock the AuditLog model
jest.mock('../../src/models/AuditLog');

describe('Audit Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Property 6: Administrative action logging', () => {
    /**
     * **Feature: productivity-suite, Property 6: Administrative action logging**
     * **Validates: Requirements 3.2, 3.4, 3.5**
     */
    test('For any admin operation performed, the system should create audit logs', () => {
      fc.assert(fc.asyncProperty(
        fc.record({
          adminId: fc.string({ minLength: 1 }),
          action: fc.constantFrom('role_change', 'user_delete', 'system_config')
        }),
        async (logData) => {
          // Create a mock that works properly
          const mockSave = jest.fn().mockResolvedValue(true);
          const mockAuditLog = {
            adminId: logData.adminId,
            action: logData.action,
            save: mockSave
          };

          AuditLog.mockImplementation(() => mockAuditLog);

          // Perform admin operation (log action)
          const result = await auditService.logAction(logData.adminId, logData.action);

          // Verify audit log was created
          expect(AuditLog).toHaveBeenCalledWith({
            adminId: logData.adminId,
            action: logData.action,
            targetUserId: null,
            changes: null,
            ipAddress: null
          });

          expect(mockSave).toHaveBeenCalled();
          expect(result).toBe(mockAuditLog);
        }
      ), { numRuns: 10 });
    });

    test('For any audit log retrieval, pagination should work correctly', () => {
      fc.assert(fc.asyncProperty(
        fc.integer({ min: 0, max: 10 }),
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 3 }),
        async (totalLogs, page, limit) => {
          const expectedLogsCount = Math.min(limit, Math.max(0, totalLogs - (page - 1) * limit));
          const mockLogs = Array.from({ length: expectedLogsCount }, 
            (_, i) => ({ adminId: `admin${i}`, action: `action${i}` }));

          AuditLog.find.mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue(mockLogs)
          });
          AuditLog.countDocuments.mockResolvedValue(totalLogs);

          const result = await auditService.getAuditLogs(page, limit);

          expect(result.pagination.page).toBe(page);
          expect(result.pagination.limit).toBe(limit);
          expect(result.pagination.total).toBe(totalLogs);
          expect(result.logs).toHaveLength(expectedLogsCount);
        }
      ), { numRuns: 10 });
    });

    test('For any admin action with all parameters, audit log should be created', () => {
      fc.assert(fc.asyncProperty(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        async (adminId, action) => {
          const mockSave = jest.fn().mockResolvedValue(true);
          const mockAuditLog = { adminId, action, save: mockSave };

          AuditLog.mockImplementation(() => mockAuditLog);

          const result = await auditService.logAction(adminId, action);

          expect(AuditLog).toHaveBeenCalled();
          expect(mockSave).toHaveBeenCalled();
          expect(result).toBe(mockAuditLog);
        }
      ), { numRuns: 10 });
    });
  });
});