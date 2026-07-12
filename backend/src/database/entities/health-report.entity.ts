import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { School } from './school.entity';

export enum ReportType {
  PRIORITY_GAP = 'priority_gap',
  FULL_HEALTH_CHECK = 'full_health_check',
}

@Entity('health_reports')
@Index('idx_school_created', ['schoolId', 'createdAt'])
export class HealthReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  schoolId: string;

  @Column({ type: 'varchar', length: 50 })
  academicYear: string;

  @Column({ type: 'enum', enum: ReportType })
  reportType: ReportType;

  @Column({ type: 'integer' })
  reportVersion: number;

  @CreateDateColumn()
  generatedAt: Date;

  // Report content stored as JSONB
  @Column({ type: 'jsonb', nullable: true })
  executiveSummary: any;

  @Column({ type: 'jsonb', nullable: true })
  twelveLensScorecard: any;

  @Column({ type: 'jsonb', nullable: true })
  perceptionVsDataFindings: any;

  @Column({ type: 'jsonb', nullable: true })
  digitalCompetitivePosition: any;

  @Column({ type: 'jsonb', nullable: true })
  rootCauseMap: any;

  @Column({ type: 'jsonb', nullable: true })
  prioritizedRoadmap: any;

  // Metadata
  @Column({ type: 'integer', nullable: true })
  totalGapsIdentified: number;

  @Column({ type: 'uuid', array: true, nullable: true })
  top3GapIds: string[];

  @Column({ type: 'text', nullable: true })
  schoolOwnerNotes: string;

  // Relations
  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school: School;
}
