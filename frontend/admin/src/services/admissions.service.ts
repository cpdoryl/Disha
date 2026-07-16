import { http } from '@/lib/http';
import type { AdmissionFunnel } from '@/types/org';

export const admissionsService = {
  listBySchool: (schoolId: string) => http.get(`/admissions/school/${schoolId}`).then((r) => r.data),
  getFunnelSummary: (schoolId: string) =>
    http.get<AdmissionFunnel>(`/admissions/school/${schoolId}/funnel`).then((r) => r.data),
};
