import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index, CreateDateColumn } from 'typeorm';
import { School } from './School.entity';
import { User } from './User.entity';

export enum ComplaintCategory {
  ACADEMIC = 'academic',
  COMMUNICATION = 'communication',
  BEHAVIOR = 'behavior',
  FEE = 'fee',
  INFRASTRUCTURE = 'infrastructure',
  STAFF = 'staff',
  OTHER = 'other',
}

export enum ComplaintSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum ResolutionStatus {
  RESOLVED = 'resolved',
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
}

@Entity('complaints')
@Index(['schoolId', 'complaintDate'])
@Index(['severity', 'resolutionStatus'])
export class Complaint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => School)
  school: School;

  @Column({ type: 'uuid' })
  schoolId: string;

  @ManyToOne(() => User, { nullable: true })
  parent: User;

  @Column({ type: 'uuid', nullable: true })
  parentId: string;

  @Column({ type: 'date' })
  complaintDate: Date;

  @Column({ type: 'enum', enum: ComplaintCategory })
  category: ComplaintCategory;

  @Column({ type: 'enum', enum: ComplaintSeverity })
  severity: ComplaintSeverity;

  @Column({ type: 'text' })
  complaintDescription: string;

  @Column({ type: 'date', nullable: true })
  resolutionDate: Date;

  @Column({ type: 'enum', enum: ResolutionStatus, nullable: true })
  resolutionStatus: ResolutionStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  resolutionMethod: string;

  @Column({ type: 'int', nullable: true })
  parentSatisfactionRating: number; // 1-5 scale

  @Column({ type: 'text', nullable: true })
  resolutionNotes: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  handledByPrincipal: string;

  @CreateDateColumn()
  createdAt: Date;
}
