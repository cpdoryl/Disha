export type StudentStatus = 'active' | 'withdrawn' | 'transferred' | 'graduated';

export interface Student {
  id: string;
  schoolId: string;
  enrollmentNumber: string;
  firstName: string;
  lastName: string | null;
  gradeLevel: number | null;
  classSection: string | null;
  status: StudentStatus;
  guardianName: string | null;
  guardianPhone: string | null;
}

export interface SchoolMetrics {
  studentCount: number;
  staffCount: number;
  activeAssessments: number;
  pendingAssessments: number;
}

export interface StudentRiskProfile {
  highRiskStudents: number;
  atRiskStudents: number;
  lowAttendanceStudents: number;
  academiclyStruggling: number;
}
