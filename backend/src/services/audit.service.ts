import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { AuditLog, ActionType, ResourceType } from 'src/database/entities';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async logAction(auditDto: {
    userId: string;
    schoolId?: string;
    actionType: ActionType;
    resourceType: ResourceType;
    resourceId?: string;
    description?: string;
    changesBefore?: Record<string, any>;
    changesAfter?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    success?: boolean;
    errorMessage?: string;
  }): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      ...auditDto,
      actionTimestamp: new Date(),
      success: auditDto.success ?? true,
    });
    return this.auditLogRepository.save(auditLog);
  }

  async logCreate(
    userId: string,
    resourceType: ResourceType,
    resourceId: string,
    data: Record<string, any>,
    schoolId?: string,
  ): Promise<AuditLog> {
    return this.logAction({
      userId,
      schoolId,
      actionType: ActionType.CREATE,
      resourceType,
      resourceId,
      changesAfter: data,
      description: `Created new ${resourceType}`,
    });
  }

  async logUpdate(
    userId: string,
    resourceType: ResourceType,
    resourceId: string,
    before: Record<string, any>,
    after: Record<string, any>,
    schoolId?: string,
  ): Promise<AuditLog> {
    return this.logAction({
      userId,
      schoolId,
      actionType: ActionType.UPDATE,
      resourceType,
      resourceId,
      changesBefore: before,
      changesAfter: after,
      description: `Updated ${resourceType}`,
    });
  }

  async logDelete(
    userId: string,
    resourceType: ResourceType,
    resourceId: string,
    data: Record<string, any>,
    schoolId?: string,
  ): Promise<AuditLog> {
    return this.logAction({
      userId,
      schoolId,
      actionType: ActionType.DELETE,
      resourceType,
      resourceId,
      changesBefore: data,
      description: `Deleted ${resourceType}`,
    });
  }

  async logExport(
    userId: string,
    resourceType: ResourceType,
    recordCount: number,
    schoolId?: string,
  ): Promise<AuditLog> {
    return this.logAction({
      userId,
      schoolId,
      actionType: ActionType.EXPORT,
      resourceType,
      description: `Exported ${recordCount} ${resourceType} records`,
    });
  }

  async logLogin(userId: string, ipAddress: string, userAgent: string): Promise<AuditLog> {
    return this.logAction({
      userId,
      actionType: ActionType.LOGIN,
      resourceType: ResourceType.USER,
      description: 'User login',
      ipAddress,
      userAgent,
    });
  }

  async logLogout(userId: string): Promise<AuditLog> {
    return this.logAction({
      userId,
      actionType: ActionType.LOGOUT,
      resourceType: ResourceType.USER,
      description: 'User logout',
    });
  }

  async logPermissionChange(
    userId: string,
    targetUserId: string,
    oldRoleType: string,
    newRoleType: string,
    schoolId?: string,
  ): Promise<AuditLog> {
    return this.logAction({
      userId,
      schoolId,
      actionType: ActionType.PERMISSION_CHANGE,
      resourceType: ResourceType.USER,
      resourceId: targetUserId,
      description: `Changed role from ${oldRoleType} to ${newRoleType}`,
      changesBefore: { roleType: oldRoleType },
      changesAfter: { roleType: newRoleType },
    });
  }

  async getAuditTrail(
    schoolId: string,
    startDate: Date,
    endDate: Date,
    resourceType?: ResourceType,
  ): Promise<AuditLog[]> {
    const query = this.auditLogRepository
      .createQueryBuilder('audit')
      .where('audit.schoolId = :schoolId', { schoolId })
      .andWhere('audit.actionTimestamp >= :startDate', { startDate })
      .andWhere('audit.actionTimestamp <= :endDate', { endDate });

    if (resourceType) {
      query.andWhere('audit.resourceType = :resourceType', {
        resourceType,
      });
    }

    return query.orderBy('audit.actionTimestamp', 'DESC').getMany();
  }

  async getUserActivityReport(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    userId: string;
    totalActions: number;
    actionBreakdown: Record<ActionType, number>;
    resourceBreakdown: Record<ResourceType, number>;
    firstActivity: Date;
    lastActivity: Date;
  }> {
    const logs = await this.auditLogRepository.find({
      where: { userId },
    });

    const filteredLogs = logs.filter((l) => l.actionTimestamp >= startDate && l.actionTimestamp <= endDate);

    const actionBreakdown: Record<ActionType, number> = {} as any;
    const resourceBreakdown: Record<ResourceType, number> = {} as any;

    filteredLogs.forEach((log) => {
      actionBreakdown[log.actionType] = (actionBreakdown[log.actionType] || 0) + 1;
      resourceBreakdown[log.resourceType] = (resourceBreakdown[log.resourceType] || 0) + 1;
    });

    const timestamps = filteredLogs.map((l) => l.actionTimestamp);

    return {
      userId,
      totalActions: filteredLogs.length,
      actionBreakdown,
      resourceBreakdown,
      firstActivity: timestamps.length > 0 ? new Date(Math.min(...timestamps.map((t) => t.getTime()))) : startDate,
      lastActivity: timestamps.length > 0 ? new Date(Math.max(...timestamps.map((t) => t.getTime()))) : endDate,
    };
  }

  async getFailedActions(schoolId: string, startDate: Date, endDate: Date): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: {
        schoolId,
        success: false,
        actionTimestamp: Between(startDate, endDate),
      },
    });
  }

  async getSuspiciousActivity(
    schoolId: string,
    threshold: number = 10,
  ): Promise<
    Array<{
      userId: string;
      actionCount: number;
      timeSpanMinutes: number;
      actions: AuditLog[];
    }>
  > {
    const recentLogs = await this.auditLogRepository.find({
      where: { schoolId },
    });

    // Group by userId and check for suspicious patterns
    const userActions: Record<string, AuditLog[]> = {};
    recentLogs.forEach((log) => {
      if (!userActions[log.userId]) {
        userActions[log.userId] = [];
      }
      userActions[log.userId].push(log);
    });

    const suspicious: Array<{
      userId: string;
      actionCount: number;
      timeSpanMinutes: number;
      actions: AuditLog[];
    }> = [];
    Object.entries(userActions).forEach(([userId, actions]) => {
      if (actions.length >= threshold) {
        const timestamps = actions.map((a) => a.actionTimestamp.getTime());
        const timeSpan = (Math.max(...timestamps) - Math.min(...timestamps)) / 60000;
        if (timeSpan < 60) {
          // More than threshold actions in less than 60 minutes
          suspicious.push({
            userId,
            actionCount: actions.length,
            timeSpanMinutes: timeSpan,
            actions: actions.slice(0, 10),
          });
        }
      }
    });

    return suspicious;
  }
}
