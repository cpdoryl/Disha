export type NotificationType =
  | 'attendance_alert'
  | 'academic_performance'
  | 'fee_reminder'
  | 'incident_notification'
  | 'assessment_invitation'
  | 'general_update';

export type NotificationChannel = 'sms' | 'email' | 'whatsapp' | 'in_app';

export interface Notification {
  id: string;
  recipientUserId: string;
  schoolId: string | null;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  relatedStudentId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}
