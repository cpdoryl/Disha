import { http } from '@/lib/http';

export const notificationService = {
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
