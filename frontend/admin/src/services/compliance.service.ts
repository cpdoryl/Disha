import { http } from '@/lib/http';
import type { ComplaintSummary } from '@/types/org';

export const complianceService = {
  getComplaintsBySchool: (schoolId: string) =>
    http.get(`/compliance/complaints/school/${schoolId}`).then((r) => r.data),
  getComplaintSummary: (schoolId: string) =>
    http.get<ComplaintSummary>(`/compliance/complaints/school/${schoolId}/summary`).then((r) => r.data),
  getDataRetentionPolicies: () => http.get('/compliance/data-retention-policies').then((r) => r.data),
};
