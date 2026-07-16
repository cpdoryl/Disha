import { http } from '@/lib/http';

export const infrastructureService = {
  getBySchool: (schoolId: string) => http.get(`/infrastructure/school/${schoolId}`).then((r) => r.data),
  getLatestForSchool: (schoolId: string) =>
    http.get(`/infrastructure/school/${schoolId}/latest`).then((r) => r.data),
};
