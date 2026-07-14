import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditService } from './audit.service';
import { AuditLog, ActionType, ResourceType } from 'src/database/entities';
import { createMockRepo, MockRepo } from 'src/test-utils/mock-repository';

describe('AuditService', () => {
  let service: AuditService;
  let repo: MockRepo<AuditLog>;

  beforeEach(async () => {
    repo = createMockRepo<AuditLog>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditService, { provide: getRepositoryToken(AuditLog), useValue: repo }],
    }).compile();

    service = module.get(AuditService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('logAction', () => {
    it('defaults success to true and stamps the action timestamp', async () => {
      (repo.create as jest.Mock).mockImplementation((entity) => entity);
      (repo.save as jest.Mock).mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.logAction({
        userId: 'user-1',
        actionType: ActionType.CREATE,
        resourceType: ResourceType.SCHOOL,
      });

      expect(result.success).toBe(true);
      expect(result.actionTimestamp).toBeInstanceOf(Date);
    });

    it('respects an explicit success: false', async () => {
      (repo.create as jest.Mock).mockImplementation((entity) => entity);
      (repo.save as jest.Mock).mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.logAction({
        userId: 'user-1',
        actionType: ActionType.CREATE,
        resourceType: ResourceType.SCHOOL,
        success: false,
        errorMessage: 'boom',
      });

      expect(result.success).toBe(false);
      expect(result.errorMessage).toBe('boom');
    });
  });

  describe('logCreate/logUpdate/logDelete/logExport', () => {
    beforeEach(() => {
      (repo.create as jest.Mock).mockImplementation((entity) => entity);
      (repo.save as jest.Mock).mockImplementation((entity) => Promise.resolve(entity));
    });

    it('logCreate records the created payload as changesAfter', async () => {
      const result = await service.logCreate('user-1', ResourceType.STUDENT, 'student-1', { name: 'Asha' });

      expect(result.actionType).toBe(ActionType.CREATE);
      expect(result.changesAfter).toEqual({ name: 'Asha' });
    });

    it('logUpdate records both before and after snapshots', async () => {
      const result = await service.logUpdate(
        'user-1',
        ResourceType.STUDENT,
        'student-1',
        { name: 'Old' },
        { name: 'New' },
      );

      expect(result.actionType).toBe(ActionType.UPDATE);
      expect(result.changesBefore).toEqual({ name: 'Old' });
      expect(result.changesAfter).toEqual({ name: 'New' });
    });

    it('logDelete records the deleted payload as changesBefore', async () => {
      const result = await service.logDelete('user-1', ResourceType.STUDENT, 'student-1', { name: 'Asha' });

      expect(result.actionType).toBe(ActionType.DELETE);
      expect(result.changesBefore).toEqual({ name: 'Asha' });
    });

    it('logExport records the record count in the description', async () => {
      const result = await service.logExport('user-1', ResourceType.STUDENT, 42);

      expect(result.actionType).toBe(ActionType.EXPORT);
      expect(result.description).toContain('42');
    });
  });

  describe('getAuditTrail', () => {
    it('filters by school and date range, optionally by resource type', async () => {
      const qb: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      await service.getAuditTrail('school-1', new Date('2026-01-01'), new Date('2026-01-31'), ResourceType.STUDENT);

      expect(qb.where).toHaveBeenCalledWith('audit.schoolId = :schoolId', { schoolId: 'school-1' });
      expect(qb.andWhere).toHaveBeenCalledWith('audit.resourceType = :resourceType', {
        resourceType: ResourceType.STUDENT,
      });
    });
  });

  describe('getUserActivityReport', () => {
    it('breaks activity down by action/resource type within the date window', async () => {
      const inWindow = (offsetMs: number, actionType: ActionType, resourceType: ResourceType) => ({
        userId: 'user-1',
        actionType,
        resourceType,
        actionTimestamp: new Date(Date.parse('2026-01-15') + offsetMs),
      });
      (repo.find as jest.Mock).mockResolvedValue([
        inWindow(0, ActionType.CREATE, ResourceType.STUDENT),
        inWindow(1000, ActionType.CREATE, ResourceType.STUDENT),
        inWindow(2000, ActionType.UPDATE, ResourceType.SCHOOL),
      ]);

      const report = await service.getUserActivityReport('user-1', new Date('2026-01-01'), new Date('2026-01-31'));

      expect(report.totalActions).toBe(3);
      expect(report.actionBreakdown[ActionType.CREATE]).toBe(2);
      expect(report.actionBreakdown[ActionType.UPDATE]).toBe(1);
      expect(report.resourceBreakdown[ResourceType.STUDENT]).toBe(2);
    });

    it('excludes activity outside the requested date window', async () => {
      (repo.find as jest.Mock).mockResolvedValue([
        {
          userId: 'user-1',
          actionType: ActionType.CREATE,
          resourceType: ResourceType.STUDENT,
          actionTimestamp: new Date('2020-01-01'),
        },
      ]);

      const report = await service.getUserActivityReport('user-1', new Date('2026-01-01'), new Date('2026-01-31'));

      expect(report.totalActions).toBe(0);
    });
  });

  describe('getFailedActions', () => {
    it('filters failed actions within the school and date range', async () => {
      (repo.find as jest.Mock).mockResolvedValue([]);
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      await service.getFailedActions('school-1', startDate, endDate);

      expect(repo.find).toHaveBeenCalledWith({
        where: {
          schoolId: 'school-1',
          success: false,
          actionTimestamp: expect.anything(),
        },
      });
    });
  });

  describe('getSuspiciousActivity', () => {
    it('flags a user who crosses the threshold within 60 minutes', async () => {
      const base = Date.parse('2026-01-15T10:00:00Z');
      const burst = Array.from({ length: 12 }, (_, i) => ({
        userId: 'user-1',
        actionTimestamp: new Date(base + i * 60_000), // 12 actions across 11 minutes
      }));
      (repo.find as jest.Mock).mockResolvedValue(burst);

      const result = await service.getSuspiciousActivity('school-1', 10);

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user-1');
      expect(result[0].actionCount).toBe(12);
    });

    it('does not flag activity spread across more than 60 minutes', async () => {
      const base = Date.parse('2026-01-15T10:00:00Z');
      const spread = Array.from({ length: 12 }, (_, i) => ({
        userId: 'user-1',
        actionTimestamp: new Date(base + i * 10 * 60_000), // spread across ~2 hours
      }));
      (repo.find as jest.Mock).mockResolvedValue(spread);

      const result = await service.getSuspiciousActivity('school-1', 10);

      expect(result).toHaveLength(0);
    });
  });
});
