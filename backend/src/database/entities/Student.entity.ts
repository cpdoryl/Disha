import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Generated,
} from 'typeorm';
import { School } from './School.entity';
import { AssessmentResponse } from './AssessmentResponse.entity';

export enum StudentStatus {
  ACTIVE = 'active',
  WITHDRAWN = 'withdrawn',
  TRANSFERRED = 'transferred',
  GRADUATED = 'graduated',
}

export enum AgeGroup {
  AGE_6_8 = '6_8',
  AGE_9_12 = '9_12',
  AGE_13_18 = '13_18',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

@Entity('students')
@Index(['schoolId', 'status'])
@Index(['enrollmentNumber'])
@Index(['gradeLevel'])
@Index(['ageGroup'])
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => School, (school) => school.students, { onDelete: 'CASCADE' })
  school: School;

  @Column({ type: 'uuid' })
  schoolId: string;

  @Column({ type: 'varchar', length: 50 })
  enrollmentNumber: string;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName: string;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender: Gender;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ type: 'int', nullable: true })
  gradeLevel: number; // 1-12

  @Column({ type: 'varchar', length: 10, nullable: true })
  classSection: string; // A, B, C, etc.

  @Column({
    type: 'enum',
    enum: AgeGroup,
    nullable: true,
  })
  ageGroup: AgeGroup; // Derived from DOB or manually set

  @Column({ type: 'date' })
  enrollmentDate: Date;

  @Column({ type: 'enum', enum: StudentStatus, default: StudentStatus.ACTIVE })
  status: StudentStatus;

  @Column({ type: 'date', nullable: true })
  withdrawalDate: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  withdrawalReasonCode: string; // academic_gap, fee, behavioral, relocation, better_school, other

  @Column({ type: 'text', nullable: true })
  withdrawalReasonDetail: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  guardianName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  guardianPhone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  guardianEmail: string;

  @OneToMany(() => AssessmentResponse, (response) => response.respondentId, {
    cascade: false,
  })
  assessmentResponses: AssessmentResponse[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
