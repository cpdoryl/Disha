import { http } from '@/lib/http';
import type { StaffRetentionSummary } from '@/types/org';

export const staffService = {
  listBySchool: (schoolId: string) => http.get(`/staff/school/${schoolId}`).then((r) => r.data),
  getRetentionSummary: (schoolId: string) =>
    http.get<StaffRetentionSummary>(`/staff/school/${schoolId}/retention`).then((r) => r.data),
};
