import { http } from '@/lib/http';

export const reportingService = {
  getAssessmentSummary: (assessmentId: string) =>
    http.get(`/reports/assessment/${assessmentId}/summary`).then((r) => r.data),
  getSchoolPerformance: (schoolId: string) =>
    http.get(`/reports/school/${schoolId}/performance`).then((r) => r.data),
  getStudentProgress: (studentId: string) =>
    http.get(`/reports/student/${studentId}/progress`).then((r) => r.data),
  export: (data: Record<string, unknown>) => http.post('/reports/export', data).then((r) => r.data),
  schedule: (data: Record<string, unknown>) =>
    http.post('/reports/schedule', data).then((r) => r.data),
};
