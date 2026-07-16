import { http } from '@/lib/http';
import type { SchoolMetrics } from '@/types/student';
import type { CreateSchoolInput, School } from '@/types/school';

export const schoolService = {
  getAll: () => http.get<School[]>('/schools').then((r) => r.data),
  create: (data: CreateSchoolInput) => http.post<School>('/schools', data).then((r) => r.data),
  getById: (id: string) => http.get<School>(`/schools/${id}`).then((r) => r.data),
  update: (id: string, data: Partial<CreateSchoolInput>) =>
    http.patch<School>(`/schools/${id}`, data).then((r) => r.data),
  getMetrics: (id: string) => http.get<SchoolMetrics>(`/schools/${id}/metrics`).then((r) => r.data),
  listByOrganization: (orgId: string) =>
    http.get(`/schools/organization/${orgId}`).then((r) => r.data),
  listByDistrict: (districtId: string) =>
    http.get(`/schools/district/${districtId}`).then((r) => r.data),
  deactivate: (id: string) => http.patch(`/schools/${id}/deactivate`).then((r) => r.data),
};
