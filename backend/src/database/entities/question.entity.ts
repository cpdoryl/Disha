import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { Assessment } from './Assessment.entity';
import { AssessmentResponse } from './AssessmentResponse.entity';

export enum QuestionType {
  LIKERT_5 = 'likert_5',
  LIKERT_5_REVERSE = 'likert_5_reverse',
  MULTIPLE_CHOICE = 'multiple_choice',
  YES_NO = 'yes_no',
  OPEN_TEXT = 'open_text',
  RATING_NPS = 'rating_nps',
}

export enum RespondentType {
  STUDENT_6_8 = 'student_6_8',
  STUDENT_9_12 = 'student_9_12',
  STUDENT_13_18 = 'student_13_18',
  TEACHER = 'teacher',
  PARENT = 'parent',
  SCHOOL_LEADER = 'school_leader',
}

@Entity('questions')
@Index(['assessmentId', 'respondentType'])
@Index(['challengeDomain'])
@Index(['respondentType'])
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Assessment, (assessment) => assessment.questions, {
    onDelete: 'CASCADE',
  })
  assessment: Assessment;

  @Column({ type: 'uuid' })
  assessmentId: string;

  @Column({ type: 'varchar', length: 50 })
  questionCode: string; // e.g., "Q1_RETENTION_912", "Q2_DROPOUT_TEACHER"

  @Column({ type: 'text' })
  questionText: string;

  @Column({ type: 'enum', enum: QuestionType })
  questionType: QuestionType;

  @Column({ type: 'enum', enum: RespondentType })
  respondentType: RespondentType;

  @Column({ type: 'varchar', length: 100, nullable: true })
  challengeDomain: string; // "student_retention", "dropout", "academic_performance", etc.

  @Column({ type: 'int' })
  orderInForm: number; // Position in the survey

  @Column({ type: 'boolean', default: true })
  isMandatory: boolean;

  @Column({ type: 'jsonb', nullable: true })
  skipLogic: Record<string, any>; // Conditional display logic

  @Column({ type: 'jsonb', nullable: true })
  options: string[]; // For multiple choice questions

  @Column({ type: 'varchar', length: 50, nullable: true })
  correctAnswer: string; // For validation if applicable

  @OneToMany(() => AssessmentResponse, (response) => response.question)
  responses: AssessmentResponse[];

  @CreateDateColumn()
  createdAt: Date;
}
