import { http } from '@/lib/http';
import type { OrgOverview } from '@/types/org';

export const userService = {
  getOrgOverview: () => http.get<OrgOverview>('/users/stats/overview').then((r) => r.data),
  listBySchool: (schoolId: string) => http.get(`/users/school/${schoolId}`).then((r) => r.data),
  listAll: () => http.get('/users').then((r) => r.data),
};
