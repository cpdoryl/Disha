import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { School } from './School.entity';
import { User } from './User.entity';
import { Student } from './Student.entity';

export enum CommunicationChannel {
  WHATSAPP = 'whatsapp',
  EMAIL = 'email',
  PHONE = 'phone',
  IN_PERSON = 'in_person',
  SMS = 'sms',
}

export enum CommunicationStatus {
  RESOLVED = 'resolved',
  PENDING = 'pending',
  ESCALATED = 'escalated',
}

@Entity('parent_communications')
@Index(['schoolId', 'queryDate'])
@Index(['parentId', 'studentId'])
export class ParentCommunication {
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

  @ManyToOne(() => Student, { nullable: true })
  student: Student;

  @Column({ type: 'uuid', nullable: true })
  studentId: string;

  @Column({ type: 'timestamp' })
  queryDate: Date;

  @Column({ type: 'enum', enum: CommunicationChannel })
  queryChannel: CommunicationChannel;

  @Column({ type: 'varchar', length: 200 })
  queryTopic: string;

  @Column({ type: 'text' })
  queryDescription: string;

  @Column({ type: 'timestamp', nullable: true })
  responseProvidedDate: Date;

  @Column({ type: 'text', nullable: true })
  responseContent: string;

  @Column({ type: 'int', nullable: true })
  responseTimeHours: number; // Calculated from queryDate to responseProvidedDate

  @Column({ type: 'enum', enum: CommunicationStatus, nullable: true })
  status: CommunicationStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  handledByStaff: string;

  @CreateDateColumn()
  createdAt: Date;
}
