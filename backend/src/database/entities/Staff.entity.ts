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
import { School } from './School.entity';
import { TeacherTraining } from './TeacherTraining.entity';

export enum StaffPosition {
  PRINCIPAL = 'principal',
  VICE_PRINCIPAL = 'vice_principal',
  TEACHER = 'teacher',
  COUNSELLOR = 'counsellor',
  ADMIN_STAFF = 'admin_staff',
}

export enum EmploymentStatus {
  ACTIVE = 'active',
  LEAVE = 'leave',
  RESIGNED = 'resigned',
  RETIRED = 'retired',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

@Entity('staff')
@Index(['schoolId', 'employmentStatus'])
@Index(['employeeId'])
@Index(['position'])
export class Staff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => School, (school) => school.staff, { onDelete: 'CASCADE' })
  school: School;

  @Column({ type: 'uuid' })
  schoolId: string;

  @Column({ type: 'varchar', length: 50 })
  employeeId: string;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName: string;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender: Gender;

  @Column({ type: 'varchar', length: 100, nullable: true })
  subjectTaught: string;

  @Column({ type: 'int', nullable: true })
  gradeLevel: number; // For teachers who teach specific grades

  @Column({ type: 'enum', enum: StaffPosition })
  position: StaffPosition;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  salaryBand: string;

  @Column({
    type: 'enum',
    enum: EmploymentStatus,
    default: EmploymentStatus.ACTIVE,
  })
  employmentStatus: EmploymentStatus;

  @Column({ type: 'date', nullable: true })
  exitDate: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  exitReasonCode: string; // pay, workload, development, opportunity, personal, other

  @Column({ type: 'text', nullable: true })
  exitReasonDetail: string;

  @Column({ type: 'int', default: 40 })
  trainingHoursPerYear: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @OneToMany(() => TeacherTraining, (training) => training.staff)
  trainingSessions: TeacherTraining[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
