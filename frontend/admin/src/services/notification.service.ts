import { http } from '@/lib/http';
import type { Notification } from '@/types/notification';

export const notificationService = {
  getMyNotifications: () => http.get<Notification[]>('/notifications/me').then((r) => r.data),
  markAsRead: (id: string) =>
    http.patch<Notification>(`/notifications/${id}/read`).then((r) => r.data),
  send: (data: Record<string, unknown>) => http.post('/notifications/send', data).then((r) => r.data),
  sendAttendanceAlert: (data: Record<string, unknown>) =>
    http.post('/notifications/attendance-alert', data).then((r) => r.data),
  sendAcademicUpdate: (data: Record<string, unknown>) =>
    http.post('/notifications/academic-update', data).then((r) => r.data),
  sendFeeReminder: (data: Record<string, unknown>) =>
    http.post('/notifications/fee-reminder', data).then((r) => r.data),
  sendAssessmentInvitation: (data: Record<string, unknown>) =>
    http.post('/notifications/assessment-invitation', data).then((r) => r.data),
  getPreferences: (userId: string) =>
    http.get(`/notifications/preferences/${userId}`).then((r) => r.data),
};
