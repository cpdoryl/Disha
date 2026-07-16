export type AssessmentStatus = 'draft' | 'active' | 'closed' | 'archived';

export interface Assessment {
  id: string;
  schoolId: string;
  cycleName: string;
  description: string | null;
  status: AssessmentStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
}
