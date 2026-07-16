import { http } from '@/lib/http';
import type { Assessment } from '@/types/assessment';

export const assessmentService = {
  healthCheck: () => http.get('/assessments/health').then((r) => r.data),
  create: (data: Record<string, unknown>) =>
    http.post('/assessments/create', data).then((r) => r.data),
  getById: (id: string) => http.get(`/assessments/${id}`).then((r) => r.data),
  getMyPending: () => http.get<Assessment[]>('/assessments/me/pending').then((r) => r.data),
  getQuestions: (assessmentId: string) =>
    http.get(`/assessments/${assessmentId}/questions`).then((r) => r.data),
  submit: (assessmentId: string, data: Record<string, unknown>) =>
    http.post(`/assessments/${assessmentId}/submit`, data).then((r) => r.data),
  getMyResponse: (assessmentId: string) =>
    http.get(`/assessments/${assessmentId}/my-response`).then((r) => r.data),
  getDataQualityReport: (assessmentId: string) =>
    http.get(`/assessments/${assessmentId}/data-quality-report`).then((r) => r.data),
  updateStatus: (id: string, status: string) =>
    http.patch(`/assessments/${id}/status`, { status }).then((r) => r.data),
};
