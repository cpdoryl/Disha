import { http } from '@/lib/http';

export const dataService = {
  submitOperational: (data: Record<string, unknown>) =>
    http.post('/data/operational', data).then((r) => r.data),
  getOperationalBySchool: (schoolId: string) =>
    http.get(`/data/operational/school/${schoolId}`).then((r) => r.data),
  submitScorecard: (data: Record<string, unknown>) =>
    http.post('/data/scorecard', data).then((r) => r.data),
  getScorecardBySchool: (schoolId: string) =>
    http.get(`/data/scorecard/school/${schoolId}`).then((r) => r.data),
  getRetentionBySchool: (schoolId: string) =>
    http.get(`/data/retention/school/${schoolId}`).then((r) => r.data),
  getTeacherRetentionBySchool: (schoolId: string) =>
    http.get(`/data/teacher-retention/school/${schoolId}`).then((r) => r.data),
  getQualityByAssessment: (assessmentId: string) =>
    http.get(`/data/quality/assessment/${assessmentId}`).then((r) => r.data),
  getAcademicPerformanceBySchool: (schoolId: string) =>
    http.get(`/data/academic-performance/school/${schoolId}`).then((r) => r.data),
  getAttendanceTrendBySchool: (schoolId: string) =>
    http.get(`/data/attendance-trend/school/${schoolId}`).then((r) => r.data),
};
