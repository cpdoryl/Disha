import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index, CreateDateColumn } from 'typeorm';
import { School } from './School.entity';
import { User } from './User.entity';

@Entity('parent_nps_surveys')
@Index(['schoolId', 'surveyDate'])
@Index(['npsScore'])
export class ParentNpsSurvey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => School)
  school: School;

  @Column({ type: 'uuid' })
  schoolId: string;

  @ManyToOne(() => User, { nullable: true })
  parent: User;

  @Column({ type: 'uuid', nullable: true })
  parentId: string;

  @Column({ type: 'date' })
  surveyDate: Date;

  @Column({ type: 'int' })
  npsScore: number; // 0-10

  @Column({ type: 'int', nullable: true })
  easeOfContactScore: number; // 1-5

  @Column({ type: 'int', nullable: true })
  responsivenessScore: number; // 1-5

  @Column({ type: 'int', nullable: true })
  overallSatisfactionScore: number; // 1-5

  @Column({ type: 'int', nullable: true })
  academicQualityScore: number; // 1-5

  @Column({ type: 'int', nullable: true })
  infrastructureScore: number; // 1-5

  @Column({ type: 'text', nullable: true })
  feedbackText: string;

  @Column({ type: 'text', nullable: true })
  improvementSuggestions: string;

  @CreateDateColumn()
  createdAt: Date;
}
