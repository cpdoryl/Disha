export type StudentStatus = 'active' | 'withdrawn' | 'transferred' | 'graduated';
export type Gender = 'male' | 'female' | 'other';
export type AgeGroup = '6_8' | '9_12' | '13_18';

export interface Student {
  id: string;
  schoolId: string;
  enrollmentNumber: string;
  firstName: string;
  lastName: string | null;
  gender?: Gender | null;
  dateOfBirth?: string | null;
  gradeLevel: number | null;
  classSection: string | null;
  ageGroup?: AgeGroup | null;
  enrollmentDate?: string | null;
  status: StudentStatus;
  withdrawalDate?: string | null;
  withdrawalReasonCode?: string | null;
  withdrawalReasonDetail?: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  guardianEmail?: string | null;
  userId?: string | null;
}

export interface CreateStudentInput {
  schoolId: string;
  enrollmentNumber: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth: string;
  gradeLevel: number;
  classSection?: string;
  ageGroup: AgeGroup;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
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

export interface AttendanceReport {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  attendancePercentage: number;
}

export interface AcademicAssessment {
  id: string;
  subject: string;
  topic: string;
  scoreObtained: number;
  scoreMax: number;
  percentage: number;
  status: 'exceeds' | 'meets' | 'approaching' | 'below';
  term: string;
  assessmentDate: string;
}
