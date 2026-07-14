import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index, CreateDateColumn, Unique } from 'typeorm';
import { Assessment } from './Assessment.entity';
import { Question } from './question.entity';
import { School } from './School.entity';

@Entity('assessment_responses')
@Index(['assessmentId', 'respondentId', 'questionId'], { unique: true })
@Index(['schoolId', 'respondentType'])
@Index(['respondentId'])
@Index(['submissionTimestamp'])
export class AssessmentResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Assessment, (assessment) => assessment.responses, {
    onDelete: 'CASCADE',
  })
  assessment: Assessment;

  @Column({ type: 'uuid' })
  assessmentId: string;

  @Column({ type: 'uuid' })
  respondentId: string; // Student, teacher, parent, or leader ID

  @Column({ type: 'varchar', length: 50 })
  respondentType: string; // student_9_12, teacher, parent, school_leader

  @ManyToOne(() => Question)
  question: Question;

  @Column({ type: 'uuid' })
  questionId: string;

  @Column({ type: 'varchar', length: 50 })
  responseValue: string; // Likert: "1"-"5", NPS: "0"-"10", text: actual text, yes/no

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  responseNumeric: number; // Numeric representation for analysis (1.0-5.0)

  @Column({ type: 'text', nullable: true })
  responseText: string; // For open-ended questions

  @ManyToOne(() => School)
  school: School;

  @Column({ type: 'uuid' })
  schoolId: string;

  @CreateDateColumn()
  submissionTimestamp: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ipAddress: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  deviceType: string; // web, mobile_ios, mobile_android

  @Column({ type: 'varchar', length: 100, nullable: true })
  deviceOs: string; // iOS 15.0, Android 12, Windows 10, etc.

  @Column({ type: 'boolean', default: true })
  isValid: boolean;

  @Column({ type: 'jsonb', nullable: true })
  validationFlags: Record<string, any>; // Data quality concerns

  @Column({ type: 'int', nullable: true })
  submissionTimeSeconds: number; // How long respondent took

  @Column({ type: 'varchar', length: 2, nullable: true })
  countryCode: string; // ISO country code (e.g., 'IN')

  @Column({ type: 'varchar', length: 50, nullable: true })
  timezone: string; // IST, EST, etc.

  @CreateDateColumn()
  createdAt: Date;
}
