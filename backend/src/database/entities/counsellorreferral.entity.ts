import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index, CreateDateColumn } from 'typeorm';
import { Student } from './Student.entity';
import { School } from './School.entity';

export enum ReferralSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ResolutionStatus {
  RESOLVED = 'resolved',
  ONGOING = 'ongoing',
  ESCALATED = 'escalated',
}

@Entity('counsellor_referrals')
@Index(['studentId', 'referralDate'])
@Index(['schoolId', 'severity'])
export class CounsellorReferral {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  student: Student;

  @Column({ type: 'uuid' })
  studentId: string;

  @ManyToOne(() => School)
  school: School;

  @Column({ type: 'uuid' })
  schoolId: string;

  @Column({ type: 'date' })
  referralDate: Date;

  @Column({ type: 'varchar', length: 100 })
  reasonCode: string; // academic_stress, peer_conflict, family_issues, mental_health, self_harm, etc.

  @Column({ type: 'enum', enum: ReferralSeverity })
  severity: ReferralSeverity;

  @Column({ type: 'varchar', length: 100, nullable: true })
  referredBy: string;

  @Column({ type: 'boolean', default: false })
  counsellingProvided: boolean;

  @Column({ type: 'int', default: 0 })
  sessionsCount: number;

  @Column({ type: 'enum', enum: ResolutionStatus, nullable: true })
  resolutionStatus: ResolutionStatus;

  @Column({ type: 'boolean', default: false })
  outsideReferral: boolean; // Referred to external professional

  @Column({ type: 'varchar', length: 255, nullable: true })
  externalReferralTo: string; // Name of external service/professional

  @Column({ type: 'text', nullable: true })
  counsellorNotes: string;

  @Column({ type: 'date', nullable: true })
  resolutionDate: Date;

  @CreateDateColumn()
  createdAt: Date;
}
