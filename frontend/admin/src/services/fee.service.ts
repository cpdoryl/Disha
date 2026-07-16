import { http } from '@/lib/http';
import type { FeeCollectionSummary } from '@/types/org';

export const feeService = {
  getFeeLedgerBySchool: (schoolId: string) => http.get(`/fees/school/${schoolId}`).then((r) => r.data),
  getFeeLedgerByStudent: (studentId: string) => http.get(`/fees/student/${studentId}`).then((r) => r.data),
  getCollectionSummary: (schoolId: string) =>
    http.get<FeeCollectionSummary>(`/fees/school/${schoolId}/summary`).then((r) => r.data),
};
