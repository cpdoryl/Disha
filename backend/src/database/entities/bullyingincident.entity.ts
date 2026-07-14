import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { School } from './School.entity';

export enum IncidentType {
  IN_PERSON = 'in_person',
  CYBERBULLYING = 'cyberbullying',
  EXCLUSION = 'exclusion',
  OTHER = 'other',
}

export enum IncidentSeverity {
  MINOR = 'minor',
  MODERATE = 'moderate',
  SEVERE = 'severe',
}

export enum ResolutionStatus {
  RESOLVED = 'resolved',
  PENDING = 'pending',
}

@Entity('bullying_incidents')
@Index(['schoolId', 'incidentDate'])
@Index(['severity'])
export class BullyingIncident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => School)
  school: School;

  @Column({ type: 'uuid' })
  schoolId: string;

  @Column({ type: 'date' })
  incidentDate: Date;

  @Column({ type: 'enum', enum: IncidentType })
  incidentType: IncidentType;

  @Column({ type: 'enum', enum: IncidentSeverity })
  severity: IncidentSeverity;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reportedBy: string;

  @Column({ type: 'int' })
  studentsInvolved: number;

  @Column({ type: 'text' })
  actionTaken: string;

  @Column({ type: 'date', nullable: true })
  resolutionDate: Date;

  @Column({ type: 'enum', enum: ResolutionStatus, nullable: true })
  resolutionStatus: ResolutionStatus;

  @Column({ type: 'jsonb', nullable: true })
  studentIds: string[]; // Array of student IDs involved

  @Column({ type: 'text', nullable: true })
  principalNotes: string;

  @Column({ type: 'boolean', default: false })
  parentNotified: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
