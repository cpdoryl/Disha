import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index } from 'typeorm';
import { Staff } from './Staff.entity';

export enum CompletionStatus {
  COMPLETED = 'completed',
  INCOMPLETE = 'incomplete',
  CANCELLED = 'cancelled',
}

@Entity('teacher_training')
@Index(['staffId', 'trainingDate'])
@Index(['topic'])
export class TeacherTraining {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Staff, (staff) => staff.trainingSessions, {
    onDelete: 'CASCADE',
  })
  staff: Staff;

  @Column({ type: 'uuid' })
  staffId: string;

  @Column({ type: 'date' })
  trainingDate: Date;

  @Column({ type: 'varchar', length: 200 })
  topic: string;

  @Column({ type: 'int' })
  hours: number;

  @Column({ type: 'varchar', length: 100, default: 'workshop' })
  deliveryMethod: string; // workshop, online, coaching, etc.

  @Column({
    type: 'enum',
    enum: CompletionStatus,
    default: CompletionStatus.COMPLETED,
  })
  completionStatus: CompletionStatus;

  @Column({ type: 'int', nullable: true })
  effectivenessRating: number; // 1-5 self-rating

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  certificateUrl: string;

  @CreateDateColumn()
  createdAt: Date;
}
