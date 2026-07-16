import { http } from '@/lib/http';
import type { SchoolMetrics } from '@/types/student';

export const schoolService = {
  create: (data: Record<string, unknown>) => http.post('/schools', data).then((r) => r.data),
  getById: (id: string) => http.get(`/schools/${id}`).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) =>
    http.patch(`/schools/${id}`, data).then((r) => r.data),
  getMetrics: (id: string) => http.get<SchoolMetrics>(`/schools/${id}/metrics`).then((r) => r.data),
  listByOrganization: (orgId: string) =>
    http.get(`/schools/organization/${orgId}`).then((r) => r.data),
  listByDistrict: (districtId: string) =>
    http.get(`/schools/district/${districtId}`).then((r) => r.data),
  deactivate: (id: string) => http.patch(`/schools/${id}/deactivate`).then((r) => r.data),
};
