import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm';

export enum ActionType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  READ = 'read',
  EXPORT = 'export',
  LOGIN = 'login',
  LOGOUT = 'logout',
  PERMISSION_CHANGE = 'permission_change',
}

export enum ResourceType {
  STUDENT = 'student',
  STAFF = 'staff',
  ASSESSMENT = 'assessment',
  SCHOOL = 'school',
  USER = 'user',
  RESPONSE = 'response',
  ORGANIZATION = 'organization',
  REPORT = 'report',
}

@Entity('audit_logs')
@Index(['schoolId', 'actionTimestamp'])
@Index(['userId', 'actionTimestamp'])
@Index(['resourceType', 'actionTimestamp'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string; // User who performed the action

  @Column({ type: 'uuid', nullable: true })
  schoolId: string;

  @Column({ type: 'enum', enum: ActionType })
  actionType: ActionType;

  @Column({ type: 'enum', enum: ResourceType })
  resourceType: ResourceType;

  @Column({ type: 'uuid', nullable: true })
  resourceId: string; // ID of the resource being acted upon

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  changesBefore: Record<string, any>; // Previous values for updates

  @Column({ type: 'jsonb', nullable: true })
  changesAfter: Record<string, any>; // New values for updates/creates

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent: string;

  @Column({ type: 'boolean', default: true })
  success: boolean; // Whether the action succeeded

  @Column({ type: 'text', nullable: true })
  errorMessage: string; // If action failed

  @CreateDateColumn()
  actionTimestamp: Date;
}
