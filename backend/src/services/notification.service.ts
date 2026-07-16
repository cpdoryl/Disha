import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType, NotificationChannel } from 'src/database/entities';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  private async persist(
    recipientUserId: string,
    schoolId: string,
    type: NotificationType,
    title: string,
    message: string,
    relatedStudentId?: string,
  ): Promise<{ success: boolean; channels: NotificationChannel[]; notification: Notification }> {
    const notification = this.notificationRepository.create({
      recipientUserId,
      schoolId,
      type,
      channel: NotificationChannel.IN_APP,
      title,
      message,
      relatedStudentId,
    });
    const saved = await this.notificationRepository.save(notification);
    return { success: true, channels: [NotificationChannel.IN_APP], notification: saved };
  }

  async sendNotification(notificationDto: {
    recipientUserId: string;
    schoolId: string;
    title: string;
    message: string;
  }): Promise<any> {
    return this.persist(
      notificationDto.recipientUserId,
      notificationDto.schoolId,
      NotificationType.GENERAL_UPDATE,
      notificationDto.title,
      notificationDto.message,
    );
  }

  async sendAttendanceAlert(
    schoolId: string,
    parentId: string,
    studentName: string,
    attendancePercentage: number,
  ): Promise<any> {
    return this.persist(
      parentId,
      schoolId,
      NotificationType.ATTENDANCE_ALERT,
      `Attendance alert for ${studentName}`,
      `${studentName}'s attendance is at ${attendancePercentage}%.`,
    );
  }

  async sendAcademicUpdateNotification(
    schoolId: string,
    parentId: string,
    studentName: string,
    subject: string,
    performance: string,
  ): Promise<any> {
    return this.persist(
      parentId,
      schoolId,
      NotificationType.ACADEMIC_PERFORMANCE,
      `Academic update for ${studentName}`,
      `${studentName}'s performance in ${subject}: ${performance}.`,
    );
  }

  async sendFeeReminder(schoolId: string, parentId: string, amount: number, dueDate: Date): Promise<any> {
    return this.persist(
      parentId,
      schoolId,
      NotificationType.FEE_REMINDER,
      'Fee payment reminder',
      `A payment of ${amount} is due on ${dueDate.toDateString()}.`,
    );
  }

  async sendAssessmentInvitation(
    schoolId: string,
    respondentId: string,
    assessmentName: string,
    responseDeadline: Date,
  ): Promise<any> {
    return this.persist(
      respondentId,
      schoolId,
      NotificationType.ASSESSMENT_INVITATION,
      `You're invited: ${assessmentName}`,
      `Please respond to "${assessmentName}" by ${responseDeadline.toDateString()}.`,
    );
  }

  async getNotificationPreferences(userId: string): Promise<any> {
    return { preferredChannels: [], notificationTypes: [] };
  }

  async getMyNotifications(recipientUserId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { recipientUserId },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: string, recipientUserId: string): Promise<Notification | null> {
    await this.notificationRepository.update({ id, recipientUserId }, { isRead: true, readAt: new Date() });
    return this.notificationRepository.findOne({ where: { id } });
  }
}
