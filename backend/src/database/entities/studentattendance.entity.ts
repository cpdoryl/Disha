import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { Student } from './student.entity';
import { School } from './School.entity';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LEAVE = 'leave',
  HALF_DAY = 'half_day',
}

@Entity('student_attendance')
@Index(['studentId', 'attendanceDate'])
@Index(['schoolId', 'monthYear'])
export class StudentAttendance {
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
  attendanceDate: Date;

  @Column({ type: 'enum', enum: AttendanceStatus })
  status: AttendanceStatus;

  @Column({ type: 'varchar', length: 20, nullable: true })
  term: string; // Fall 2026, Spring 2026, etc.

  @Column({ type: 'date', nullable: true })
  monthYear: Date; // Derived for indexing

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'uuid', nullable: true })
  markedByStaffId: string;

  @CreateDateColumn()
  createdAt: Date;
}
