import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { School } from './School.entity';
import { Student } from './student.entity';

export enum InterventionType {
  ACADEMIC_SUPPORT = 'academic_support',
  ATTENDANCE_IMPROVEMENT = 'attendance_improvement',
  BEHAVIOR_MODIFICATION = 'behavior_modification',
  PARENTAL_ENGAGEMENT = 'parental_engagement',
  COUNSELLING = 'counselling',
  FINANCIAL_ASSISTANCE = 'financial_assistance',
  PEER_MENTORING = 'peer_mentoring',
  EXTRA_CURRICULAR = 'extra_curricular',
}

export enum InterventionStatus {
  PLANNED = 'planned',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
  ESCALATED = 'escalated',
}

@Entity('remediation_interventions')
@Index(['schoolId', 'interventionStartDate'])
@Index(['studentId', 'status'])
export class RemediationIntervention {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => School)
  school: School;

  @Column({ type: 'uuid' })
  schoolId: string;

  @ManyToOne(() => Student)
  student: Student;

  @Column({ type: 'uuid' })
  studentId: string;

  @Column({ type: 'enum', enum: InterventionType })
  interventionType: InterventionType;

  @Column({ type: 'date' })
  interventionStartDate: Date;

  @Column({ type: 'date', nullable: true })
  plannedEndDate: Date;

  @Column({ type: 'date', nullable: true })
  actualEndDate: Date;

  @Column({ type: 'enum', enum: InterventionStatus })
  status: InterventionStatus;

  @Column({ type: 'text' })
  interventionDetails: string; // What intervention is being provided

  @Column({ type: 'varchar', length: 100, nullable: true })
  assignedTo: string; // Name/ID of staff member

  @Column({ type: 'text', nullable: true })
  progressNotes: string;

  @Column({ type: 'int', nullable: true })
  effectivenessRating: number; // 1-5 scale post-completion

  @Column({ type: 'boolean', default: false })
  escalatedToParent: boolean;

  @Column({ type: 'text', nullable: true })
  parentCommunicationNotes: string;

  @CreateDateColumn()
  createdAt: Date;
}
