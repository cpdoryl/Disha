import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Organization } from './Organization.entity';
import { Assessment } from './Assessment.entity';
import { Student } from './Student.entity';
import { Staff } from './Staff.entity';
import { GapPrediction } from './gap-prediction.entity';

export enum CityTier {
  TIER_1 = 'tier_1',
  TIER_2 = 'tier_2',
  TIER_3 = 'tier_3',
}

export enum BoardType {
  CBSE = 'cbse',
  ICSE = 'icse',
  IB = 'ib',
  STATE = 'state',
  OTHER = 'other',
}

@Entity('schools')
@Index(['name', 'state'], { unique: true })
export class School {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization, (organization) => organization.schools, {
    onDelete: 'CASCADE',
  })
  organization: Organization;

  @Column({ type: 'uuid', nullable: true })
  organizationId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  district: string;

  @Column({ type: 'varchar', length: 100 })
  state: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Column({ type: 'enum', enum: CityTier, nullable: true })
  cityTier: CityTier;

  @Column({ type: 'enum', enum: BoardType, nullable: true })
  boardType: BoardType;

  @Column({ type: 'int', nullable: true })
  studentCount: number;

  @Column({ type: 'int', nullable: true })
  staffCount: number;

  @Column({ type: 'varchar', length: 50, nullable: true, unique: true })
  udiseCode: string;

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
  longitude: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  principalName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  principalPhone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  principalEmail: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  website: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'date', nullable: true })
  onboardedDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Student, (student) => student.school)
  students: Student[];

  @OneToMany(() => Assessment, (assessment) => assessment.school)
  assessments: Assessment[];

  @OneToMany(() => Staff, (staff) => staff.school)
  staff: Staff[];

  @OneToMany(() => GapPrediction, (gap) => gap.school)
  gapPredictions: GapPrediction[];
}
