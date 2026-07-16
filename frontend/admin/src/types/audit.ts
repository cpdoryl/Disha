export interface SuspiciousActivityEntry {
  userId: string;
  actionCount: number;
  timeSpanMinutes: number;
  actions: AuditLogEntry[];
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  schoolId: string | null;
  actionType: string;
  resourceType: string;
  resourceId: string | null;
  description: string | null;
  success: boolean;
  errorMessage: string | null;
  actionTimestamp: string;
}
