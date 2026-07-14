import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index, CreateDateColumn } from 'typeorm';
import { School } from './School.entity';

export enum ScorecardMetric {
  STUDENT_RETENTION = 'student_retention',
  TEACHER_RETENTION = 'teacher_retention',
  ACADEMIC_PERFORMANCE = 'academic_performance',
  PARENTAL_SATISFACTION = 'parental_satisfaction',
  STUDENT_WELLBEING = 'student_wellbeing',
  SYSTEM_DUPLICATION = 'system_duplication',
  OPERATIONAL_EFFICIENCY = 'operational_efficiency',
}

@Entity('monitoring_scorecards')
@Index(['schoolId', 'scorecardMonth'])
@Index(['metric', 'scorecardMonth'])
export class MonitoringScorecard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => School)
  school: School;

  @Column({ type: 'uuid' })
  schoolId: string;

  @Column({ type: 'date' })
  scorecardMonth: Date; // Year-month for aggregation

  @Column({ type: 'enum', enum: ScorecardMetric })
  metric: ScorecardMetric;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  targetValue: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  achievedValue: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  variancePercentage: number; // (achieved - target) / target * 100

  @Column({ type: 'text', nullable: true })
  analysisNotes: string;

  @Column({ type: 'jsonb', nullable: true })
  subMetrics: Record<string, number>; // Breakdown of metric components

  @Column({ type: 'varchar', length: 50, nullable: true })
  status: string; // on_track, at_risk, off_track

  @CreateDateColumn()
  createdAt: Date;
}
