import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, CreateDateColumn } from 'typeorm';
import { User } from './User.entity';

export enum NotificationType {
  ATTENDANCE_ALERT = 'attendance_alert',
  ACADEMIC_PERFORMANCE = 'academic_performance',
  FEE_REMINDER = 'fee_reminder',
  INCIDENT_NOTIFICATION = 'incident_notification',
  ASSESSMENT_INVITATION = 'assessment_invitation',
  GENERAL_UPDATE = 'general_update',
}

export enum NotificationChannel {
  SMS = 'sms',
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
  IN_APP = 'in_app',
}

@Entity('notifications')
@Index(['recipientUserId', 'createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'recipientUserId' })
  recipient: User;

  @Column({ type: 'uuid' })
  recipientUserId: string;

  @Column({ type: 'uuid', nullable: true })
  schoolId: string;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ type: 'enum', enum: NotificationChannel, default: NotificationChannel.IN_APP })
  channel: NotificationChannel;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'uuid', nullable: true })
  relatedStudentId: string;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
