import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Assessment } from './assessment.entity';
import { Student } from './student.entity';
import { Staff } from './Staff.entity';
import { Organization } from './Organization.entity';

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
@Index(['organizationId'])
@Index(['state', 'district'])
@Index(['isActive'])
@Index(['udiseCode'])
export class School {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization, { eager: true })
  organization: Organization;

  @Column({ type: 'uuid', nullable: true })
  organizationId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  district: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
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

  @Column({ type: 'varchar', length: 20, nullable: true })
  udiseCode: string; // UDISE+ reference

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  principalName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  principalPhone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  principalEmail: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  pinCode: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'date', nullable: true })
  onboardedDate: Date;

  @Column({ type: 'date', nullable: true })
  lastAssessmentDate: Date;

  @OneToMany(() => Assessment, (assessment) => assessment.school)
  assessments: Assessment[];

  @OneToMany(() => Student, (student) => student.school)
  students: Student[];

  @OneToMany(() => Staff, (staff) => staff.school)
  staff: Staff[];

  @OneToMany('GapPrediction', (gapPrediction) => (gapPrediction as any).school)
  gapPredictions: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
