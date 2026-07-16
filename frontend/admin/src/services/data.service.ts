import { http } from '@/lib/http';

function toQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const dataService = {
  submitOperational: (data: Record<string, unknown>) =>
    http.post('/data/operational', data).then((r) => r.data),

  getOperationalBySchool: (schoolId: string, startDate: string, endDate: string) =>
    http
      .get(`/data/operational/school/${schoolId}${toQuery({ startDate, endDate })}`)
      .then((r) => r.data),

  submitScorecard: (data: Record<string, unknown>) =>
    http.post('/data/scorecard', data).then((r) => r.data),

  getScorecardBySchool: (schoolId: string, startMonth: string, endMonth: string) =>
    http
      .get(`/data/scorecard/school/${schoolId}${toQuery({ startMonth, endMonth })}`)
      .then((r) => r.data),

  getRetentionBySchool: (schoolId: string, academicYear: string) =>
    http
      .get(`/data/retention/school/${schoolId}${toQuery({ academicYear })}`)
      .then((r) => r.data),

  getTeacherRetentionBySchool: (schoolId: string, academicYear: string) =>
    http
      .get(`/data/teacher-retention/school/${schoolId}${toQuery({ academicYear })}`)
      .then((r) => r.data),

  getQualityByAssessment: (assessmentId: string) =>
    http.get(`/data/quality/assessment/${assessmentId}`).then((r) => r.data),

  getAcademicPerformanceBySchool: (schoolId: string) =>
    http.get(`/data/academic-performance/school/${schoolId}`).then((r) => r.data),

  getAttendanceTrendBySchool: (schoolId: string, months?: number) =>
    http
      .get(`/data/attendance-trend/school/${schoolId}${toQuery({ months })}`)
      .then((r) => r.data),
};
