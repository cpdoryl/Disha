import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { Student } from './student.entity';
import { Assessment } from './assessment.entity';
import { GapPrediction } from './gap-prediction.entity';

export enum BoardAffiliation {
  CBSE = 'CBSE',
  ICSE = 'ICSE',
  STATE_BOARD = 'STATE_BOARD',
  OTHER = 'OTHER',
}

export enum CityTier {
  TIER_1 = 'tier1',
  TIER_2 = 'tier2',
  TIER_3 = 'tier3',
}

export enum FeeBand {
  BUDGET = 'budget',
  MID = 'mid',
  PREMIUM = 'premium',
}

@Entity('schools')
@Index(['name', 'state'], { unique: true })
export class School {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'enum', enum: BoardAffiliation })
  boardAffiliation: BoardAffiliation;

  @Column({ type: 'enum', enum: CityTier })
  cityTier: CityTier;

  @Column({ type: 'enum', enum: FeeBand })
  feeBand: FeeBand;

  @Column({ type: 'integer', nullable: true })
  enrollmentSize: number;

  @Column({ type: 'varchar', length: 50 })
  state: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  contactPhone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contactEmail: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  websiteUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Student, (student) => student.school)
  students: Student[];

  @OneToMany(() => Assessment, (assessment) => assessment.school)
  assessments: Assessment[];

  @OneToMany(() => GapPrediction, (gap) => gap.school)
  gapPredictions: GapPrediction[];
}
