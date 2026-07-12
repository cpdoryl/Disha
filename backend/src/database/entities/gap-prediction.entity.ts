import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { School } from './school.entity';
import { Challenge } from './challenge.entity';

export enum TrendDirection {
  WORSENING = 'worsening',
  STABLE = 'stable',
  IMPROVING = 'improving',
  UNKNOWN = 'unknown',
}

export enum ConfidenceTier {
  TIER_A = 'A',
  TIER_B = 'B',
  TIER_C = 'C',
}

@Entity('gap_predictions')
@Index(['schoolId', 'academicYear', 'priorityRank'])
export class GapPrediction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  schoolId: string;

  @Column({ type: 'varchar', length: 50 })
  academicYear: string;

  @Column({ type: 'uuid' })
  challengeId: string;

  // Four scores from specification
  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  selfReportedSeverity: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  dataConfirmedSeverity: number;

  @Column({ type: 'enum', enum: TrendDirection, default: TrendDirection.UNKNOWN })
  trendDirection: TrendDirection;

  @Column({ type: 'enum', enum: ConfidenceTier, default: ConfidenceTier.TIER_C })
  confidenceTier: ConfidenceTier;

  // Composite ranking
  @Column({ type: 'decimal', precision: 4, scale: 3 })
  combinedScore: number;

  @Column({ type: 'integer' })
  priorityRank: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  urgencyFactor: number;

  @Column({ type: 'jsonb', nullable: true })
  dataSources: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => School, (school) => school.gapPredictions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school: School;

  @ManyToOne(() => Challenge)
  @JoinColumn({ name: 'challengeId' })
  challenge: Challenge;
}
