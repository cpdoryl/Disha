import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Assessment } from './assessment.entity';
import { Challenge } from './challenge.entity';

export enum ResponseType {
  FIVE_POINT_SCALE = '5_point_scale',
  YES_NO = 'yes_no',
  OPEN_TEXT = 'open_text',
  NUMERIC_RANGE = 'numeric_range',
  MULTI_SELECT = 'multi_select',
}

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  assessmentId: string;

  @Column({ type: 'text' })
  questionText: string;

  @Column({ type: 'enum', enum: ResponseType })
  responseType: ResponseType;

  @Column({ type: 'integer' })
  orderInAssessment: number;

  @Column({ type: 'uuid', nullable: true })
  challengeId: string;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => Assessment, (assessment) => assessment.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assessmentId' })
  assessment: Assessment;

  @ManyToMany(() => Challenge, (challenge) => challenge.questions)
  challenges: Challenge[];
}
