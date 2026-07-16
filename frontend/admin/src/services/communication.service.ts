import { http } from '@/lib/http';
import type { CommunicationEntry, CommunicationMetrics } from '@/types/org';

export const communicationService = {
  getBySchool: (schoolId: string) =>
    http.get<CommunicationEntry[]>(`/communication/school/${schoolId}`).then((r) => r.data),
  getResponseMetrics: (schoolId: string) =>
    http.get<CommunicationMetrics>(`/communication/school/${schoolId}/metrics`).then((r) => r.data),
};
