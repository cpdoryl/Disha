// Core Entities
export { Assessment, AssessmentStatus } from './Assessment.entity';
export { Question, QuestionType, RespondentType } from './question.entity';
export {
  AssessmentResponse,
} from './AssessmentResponse.entity';
export { School, CityTier, BoardType } from './School.entity';
export { Student, StudentStatus, AgeGroup } from './Student.entity';
export { Staff, StaffPosition, EmploymentStatus } from './Staff.entity';
export { Organization, OrganizationType } from './Organization.entity';
export {
  TeacherTraining,
  CompletionStatus,
} from './TeacherTraining.entity';

// Additional Entities (Day 2)
export { District } from './District.entity';
export { User, UserType, RoleType } from './User.entity';
export { StudentAttendance } from './studentattendance.entity';
export { StudentAcademicAssessment, AcademicStatus } from './studentacademicassessment.entity';
export { CounsellorReferral, ReferralSeverity, ResolutionStatus } from './counsellorreferral.entity';
export { BullyingIncident, IncidentType, IncidentSeverity } from './bullyingincident.entity';
export { ParentCommunication, CommunicationChannel, CommunicationStatus } from './parentcommunication.entity';
export { Complaint, ComplaintCategory, ComplaintSeverity } from './complaint.entity';
export { ParentNpsSurvey } from './parentnpssurvey.entity';
export { OperationalData, DataType } from './operationaldata.entity';
export { MonitoringScorecard, ScorecardMetric } from './monitoringscorecard.entity';
export { DataRetentionPolicy, DataClassification, RetentionAction } from './dataretentionpolicy.entity';
export { AuditLog, ActionType, ResourceType } from './auditlog.entity';
export { RemediationIntervention, InterventionType, InterventionStatus } from './remediationintervention.entity';
export { Admission, AdmissionStatus, AdmissionSource } from './admission.entity';

// Array of all entities for TypeORM configuration
export const DISHA_ENTITIES = [
  Organization,
  School,
  District,
  Assessment,
  Question,
  AssessmentResponse,
  Student,
  Staff,
  TeacherTraining,
  User,
  StudentAttendance,
  StudentAcademicAssessment,
  CounsellorReferral,
  BullyingIncident,
  ParentCommunication,
  Complaint,
  ParentNpsSurvey,
  OperationalData,
  MonitoringScorecard,
  DataRetentionPolicy,
  AuditLog,
  RemediationIntervention,
  Admission,
];
