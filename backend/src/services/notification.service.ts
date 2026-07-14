import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParentCommunication } from 'src/database/entities';

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

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(ParentCommunication)
    private communicationRepository: Repository<ParentCommunication>,
  ) {}

  async sendNotification(notificationDto: any): Promise<any> {
    return { success: true, channels: [] };
  }

  async sendAttendanceAlert(
    schoolId: string,
    parentId: string,
    studentName: string,
    attendancePercentage: number,
  ): Promise<any> {
    return { success: true, channels: [] };
  }

  async sendAcademicUpdateNotification(
    schoolId: string,
    parentId: string,
    studentName: string,
    subject: string,
    performance: string,
  ): Promise<any> {
    return { success: true, channels: [] };
  }

  async sendFeeReminder(
    schoolId: string,
    parentId: string,
    amount: number,
    dueDate: Date,
  ): Promise<any> {
    return { success: true, channels: [] };
  }

  async sendAssessmentInvitation(
    schoolId: string,
    respondentId: string,
    assessmentName: string,
    responseDeadline: Date,
  ): Promise<any> {
    return { success: true, channels: [] };
  }

  async getNotificationPreferences(userId: string): Promise<any> {
    return { preferredChannels: [], notificationTypes: [] };
  }
}
