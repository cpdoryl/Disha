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
import { Question } from './question.entity';
import { AssessmentResponse } from './AssessmentResponse.entity';

export enum AssessmentStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  CLOSED = 'closed',
  ARCHIVED = 'archived',
}

@Entity('assessments')
@Index(['schoolId', 'status'])
@Index(['createdAt'])
export class Assessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => School, (school) => school.assessments, { eager: true })
  school: School;

  @Column({ type: 'uuid' })
  schoolId: string;

  @Column({ type: 'varchar', length: 50 })
  cycleName: string; // e.g., "Term1_2026", "Term2_2026"

  @Column({
    type: 'enum',
    enum: AssessmentStatus,
    default: AssessmentStatus.DRAFT,
  })
  status: AssessmentStatus;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @OneToMany(() => Question, (question) => question.assessment, {
    cascade: true,
  })
  questions: Question[];

  @OneToMany(() => AssessmentResponse, (response) => response.assessment)
  responses: AssessmentResponse[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
