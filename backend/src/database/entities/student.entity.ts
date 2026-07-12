import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, Index, JoinColumn } from 'typeorm';
import { School } from './school.entity';

export enum StudentStatus {
  ACTIVE = 'active',
  WITHDRAWN = 'withdrawn',
  TRANSFERRED = 'transferred',
  GRADUATED = 'graduated',
}

@Entity('students')
@Index(['schoolId', 'enrollmentId', 'academicYear'], { unique: true })
@Index(['schoolId', 'status'])
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  schoolId: string;

  @Column({ type: 'varchar', length: 50 })
  enrollmentId: string;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ type: 'varchar', length: 10, nullable: true })
  grade: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  section: string;

  @Column({ type: 'varchar', length: 100 })
  academicYear: string;

  @Column({ type: 'enum', enum: StudentStatus, default: StudentStatus.ACTIVE })
  status: StudentStatus;

  @Column({ type: 'date', nullable: true })
  enrollmentDate: Date;

  @Column({ type: 'date', nullable: true })
  withdrawalDate: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  withdrawalReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => School, (school) => school.students, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school: School;
}
