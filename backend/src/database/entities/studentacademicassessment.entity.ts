import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { Student } from './Student.entity';
import { School } from './School.entity';

export enum AcademicStatus {
  EXCEEDS = 'exceeds',
  MEETS = 'meets',
  APPROACHING = 'approaching',
  BELOW = 'below',
}

@Entity('student_academic_assessments')
@Index(['studentId', 'assessmentDate'])
@Index(['schoolId', 'term'])
export class StudentAcademicAssessment {
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
  assessmentDate: Date;

  @Column({ type: 'varchar', length: 100 })
  subject: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  topic: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  scoreObtained: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  scoreMax: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  percentage: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  gradeLevelExpectation: number;

  @Column({ type: 'enum', enum: AcademicStatus, nullable: true })
  status: AcademicStatus;

  @Column({ type: 'varchar', length: 20, nullable: true })
  term: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  assessmentType: string; // Quiz, midterm, final, project, etc.

  @Column({ type: 'text', nullable: true })
  teacherNotes: string;

  @CreateDateColumn()
  createdAt: Date;
}
