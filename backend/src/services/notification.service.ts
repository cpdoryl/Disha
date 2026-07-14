import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParentCommunication, CommunicationChannel, CommunicationStatus } from 'src/database/entities';

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

/**
 * Phase 1 has no SMS/email/WhatsApp gateway wired up (no provider config in
 * src/config/configuration.ts), so this service can't actually dispatch
 * messages yet. What it does do for real: log every notification intent as
 * a ParentCommunication record so it's queryable/auditable, and derive
 * preferences from that history instead of a preferences table that
 * doesn't exist.
 */
@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(ParentCommunication)
    private communicationRepository: Repository<ParentCommunication>,
  ) {}

  private toCommunicationChannel(channel: NotificationChannel): CommunicationChannel {
    switch (channel) {
      case NotificationChannel.SMS:
        return CommunicationChannel.SMS;
      case NotificationChannel.WHATSAPP:
        return CommunicationChannel.WHATSAPP;
      case NotificationChannel.EMAIL:
        return CommunicationChannel.EMAIL;
      default:
        return CommunicationChannel.IN_PERSON;
    }
  }

  private async logCommunication(entry: {
    schoolId: string;
    parentId?: string;
    studentId?: string;
    channel: CommunicationChannel;
    topic: string;
    description: string;
  }): Promise<{ success: boolean; channels: CommunicationChannel[]; communicationId: string }> {
    const record = this.communicationRepository.create({
      schoolId: entry.schoolId,
      parentId: entry.parentId,
      studentId: entry.studentId,
      queryDate: new Date(),
      queryChannel: entry.channel,
      queryTopic: entry.topic,
      queryDescription: entry.description,
      status: CommunicationStatus.PENDING,
    });
    const saved = await this.communicationRepository.save(record);

    return { success: true, channels: [entry.channel], communicationId: saved.id };
  }

  async sendNotification(notificationDto: {
    schoolId: string;
    parentId?: string;
    studentId?: string;
    type: NotificationType;
    channel: NotificationChannel;
    message: string;
  }): Promise<{ success: boolean; channels: CommunicationChannel[]; communicationId: string }> {
    return this.logCommunication({
      schoolId: notificationDto.schoolId,
      parentId: notificationDto.parentId,
      studentId: notificationDto.studentId,
      channel: this.toCommunicationChannel(notificationDto.channel),
      topic: notificationDto.type,
      description: notificationDto.message,
    });
  }

  async sendAttendanceAlert(
    schoolId: string,
    parentId: string,
    studentName: string,
    attendancePercentage: number,
    studentId?: string,
  ): Promise<{ success: boolean; channels: CommunicationChannel[]; communicationId: string }> {
    return this.logCommunication({
      schoolId,
      parentId,
      studentId,
      channel: CommunicationChannel.SMS,
      topic: NotificationType.ATTENDANCE_ALERT,
      description: `${studentName}'s attendance is at ${attendancePercentage}%.`,
    });
  }

  async sendAcademicUpdateNotification(
    schoolId: string,
    parentId: string,
    studentName: string,
    subject: string,
    performance: string,
    studentId?: string,
  ): Promise<{ success: boolean; channels: CommunicationChannel[]; communicationId: string }> {
    return this.logCommunication({
      schoolId,
      parentId,
      studentId,
      channel: CommunicationChannel.EMAIL,
      topic: NotificationType.ACADEMIC_PERFORMANCE,
      description: `${studentName}'s ${subject} performance: ${performance}.`,
    });
  }

  async sendFeeReminder(
    schoolId: string,
    parentId: string,
    amount: number,
    dueDate: Date,
  ): Promise<{ success: boolean; channels: CommunicationChannel[]; communicationId: string }> {
    return this.logCommunication({
      schoolId,
      parentId,
      channel: CommunicationChannel.SMS,
      topic: NotificationType.FEE_REMINDER,
      description: `Fee payment of ${amount} is due on ${dueDate.toDateString()}.`,
    });
  }

  async sendAssessmentInvitation(
    schoolId: string,
    respondentId: string,
    assessmentName: string,
    responseDeadline: Date,
  ): Promise<{ success: boolean; channels: CommunicationChannel[]; communicationId: string }> {
    return this.logCommunication({
      schoolId,
      parentId: respondentId,
      channel: CommunicationChannel.WHATSAPP,
      topic: NotificationType.ASSESSMENT_INVITATION,
      description: `You're invited to complete "${assessmentName}" by ${responseDeadline.toDateString()}.`,
    });
  }

  /**
   * No preferences table exists yet, so this derives a best-effort
   * preference from the parent's own communication history: the most
   * frequently used channel and the set of topics they've engaged with.
   */
  async getNotificationPreferences(
    userId: string,
  ): Promise<{ preferredChannels: CommunicationChannel[]; notificationTypes: string[] }> {
    const history = await this.communicationRepository.find({ where: { parentId: userId } });

    const channelCounts: Record<string, number> = {};
    const topics = new Set<string>();
    history.forEach((entry) => {
      channelCounts[entry.queryChannel] = (channelCounts[entry.queryChannel] || 0) + 1;
      topics.add(entry.queryTopic);
    });

    const preferredChannels = Object.entries(channelCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([channel]) => channel as CommunicationChannel);

    return { preferredChannels, notificationTypes: Array.from(topics) };
  }
}
