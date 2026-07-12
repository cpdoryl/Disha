import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { School } from './school.entity';
import { Question } from './question.entity';

export enum AssessmentStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  CLOSED = 'closed',
  ARCHIVED = 'archived',
}

export enum RespondentType {
  OWNER = 'owner',
  TEACHER = 'teacher',
  PARENT = 'parent',
  STUDENT = 'student',
  ADMIN = 'admin',
}

@Entity('assessments')
export class Assessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  schoolId: string;

  @Column({ type: 'varchar', length: 255 })
  assessmentName: string;

  @Column({ type: 'enum', enum: RespondentType })
  respondentType: RespondentType;

  @Column({ type: 'enum', enum: AssessmentStatus, default: AssessmentStatus.ACTIVE })
  status: AssessmentStatus;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => School, (school) => school.assessments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school: School;

  @OneToMany(() => Question, (question) => question.assessment)
  questions: Question[];
}
