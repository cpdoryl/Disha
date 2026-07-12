import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { Assessment } from './assessment.entity';
import { Question } from './question.entity';

export enum RespondentType {
  OWNER = 'owner',
  TEACHER = 'teacher',
  PARENT = 'parent',
  STUDENT = 'student',
  ADMIN = 'admin',
}

@Entity('assessment_responses')
@Unique(['assessmentId', 'respondentId', 'questionId'])
@Index(['respondentType', 'respondentId'])
export class AssessmentResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  assessmentId: string;

  @Column({ type: 'uuid', nullable: true })
  respondentId: string;

  @Column({ type: 'enum', enum: RespondentType })
  respondentType: RespondentType;

  @Column({ type: 'uuid' })
  questionId: string;

  @Column({ type: 'integer', nullable: true })
  answerNumeric: number;

  @Column({ type: 'text', nullable: true })
  answerText: string;

  @Column({ type: 'jsonb', nullable: true })
  answerJson: any;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  confidence: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Assessment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assessmentId' })
  assessment: Assessment;

  @ManyToOne(() => Question)
  @JoinColumn({ name: 'questionId' })
  question: Question;
}
