export type UserTypeBreakdown = Record<
  'school_admin' | 'teacher' | 'parent' | 'student' | 'ryl_admin' | 'ryl_support',
  number
>;

export interface OrgOverview {
  totalSchools: number;
  totalUsers: number;
  activeUsers: number;
  usersByType: UserTypeBreakdown;
}

export interface StaffRetentionSummary {
  totalStaff: number;
  activeStaff: number;
  resignedStaff: number;
  retiredStaff: number;
  onLeaveStaff: number;
  retentionRate: number;
}

export interface AdmissionFunnel {
  inquiry: number;
  application: number;
  applied: number;
  interviewed: number;
  offered: number;
  admitted: number;
  rejected: number;
  waitlisted: number;
  declined: number;
}

export interface CommunicationMetrics {
  totalQueries: number;
  resolvedQueries: number;
  pendingQueries: number;
  escalatedQueries: number;
  averageResponseTimeHours: number | null;
}

export interface ComplaintSummary {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  highSeverity: number;
  averageSatisfactionRating: number | null;
}

export interface FeeCollectionSummary {
  totalDue: number;
  totalCollected: number;
  outstandingAmount: number;
  collectionRate: number;
  overdueCount: number;
}

export interface CommunicationEntry {
  id: string;
  schoolId: string;
  parentId: string | null;
  studentId: string | null;
  queryDate: string;
  queryChannel: string;
  queryTopic: string;
  queryDescription: string;
  responseProvidedDate: string | null;
  responseContent: string | null;
  status: 'resolved' | 'pending' | 'escalated';
}
