import { http } from '@/lib/http';

export const studentService = {
  create: (data: Record<string, unknown>) => http.post('/students', data).then((r) => r.data),
  getById: (id: string) => http.get(`/students/${id}`).then((r) => r.data),
  listBySchool: (schoolId: string) => http.get(`/students/school/${schoolId}`).then((r) => r.data),
  updateStatus: (id: string, status: string) =>
    http.patch(`/students/${id}/status`, { status }).then((r) => r.data),
  recordAttendance: (id: string, data: Record<string, unknown>) =>
    http.post(`/students/${id}/attendance`, data).then((r) => r.data),
  getAttendanceReport: (id: string) =>
    http.get(`/students/${id}/attendance/report`).then((r) => r.data),
  submitAcademicAssessment: (id: string, data: Record<string, unknown>) =>
    http.post(`/students/${id}/academic-assessment`, data).then((r) => r.data),
  getAcademicPerformance: (id: string) =>
    http.get(`/students/${id}/academic-performance`).then((r) => r.data),
  createCounsellorReferral: (id: string, data: Record<string, unknown>) =>
    http.post(`/students/${id}/counsellor-referral`, data).then((r) => r.data),
  getRiskProfileBySchool: (schoolId: string) =>
    http.get(`/students/school/${schoolId}/risk-profile`).then((r) => r.data),
};
