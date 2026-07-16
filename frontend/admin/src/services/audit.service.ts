import { http } from '@/lib/http';
import type { AuditLogEntry, SuspiciousActivityEntry } from '@/types/audit';

function toQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const auditService = {
  getAuditTrail: (schoolId: string, startDate: string, endDate: string, resourceType?: string) =>
    http
      .get(`/audit/logs/school/${schoolId}${toQuery({ startDate, endDate, resourceType })}`)
      .then((r) => r.data),

  getUserActivityReport: (userId: string, startDate: string, endDate: string) =>
    http
      .get(`/audit/activity/user/${userId}${toQuery({ startDate, endDate })}`)
      .then((r) => r.data),

  getFailedActions: (schoolId: string, startDate: string, endDate: string) =>
    http
      .get<AuditLogEntry[]>(`/audit/failed-actions/school/${schoolId}${toQuery({ startDate, endDate })}`)
      .then((r) => r.data),

  getSuspiciousActivity: (schoolId: string, threshold?: number) =>
    http
      .get<SuspiciousActivityEntry[]>(
        `/audit/suspicious-activity/school/${schoolId}${toQuery({ threshold })}`,
      )
      .then((r) => r.data),
};
