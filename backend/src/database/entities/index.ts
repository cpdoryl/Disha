// Core Entities
import { Assessment, AssessmentStatus } from './Assessment.entity';
import { Question, QuestionType, RespondentType } from './question.entity';
import { AssessmentResponse } from './AssessmentResponse.entity';
import { School, CityTier, BoardType } from './School.entity';
import { Student, StudentStatus, AgeGroup } from './Student.entity';
import { Staff, StaffPosition, EmploymentStatus } from './Staff.entity';
import { Organization, OrganizationType } from './Organization.entity';
import { TeacherTraining, CompletionStatus } from './TeacherTraining.entity';
import { Challenge, ChallengeCategory, PREDEFINED_CHALLENGES } from './challenge.entity';
import { GapPrediction, TrendDirection, ConfidenceTier } from './gap-prediction.entity';
import { HealthReport, ReportType } from './health-report.entity';

// Additional Entities (Day 2)
import { District } from './District.entity';
import { User, UserType, RoleType } from './User.entity';
import { StudentAttendance } from './studentattendance.entity';
import { StudentAcademicAssessment, AcademicStatus } from './studentacademicassessment.entity';
import { CounsellorReferral, ReferralSeverity, ResolutionStatus } from './counsellorreferral.entity';
import { BullyingIncident, IncidentType, IncidentSeverity } from './bullyingincident.entity';
import { ParentCommunication, CommunicationChannel, CommunicationStatus } from './parentcommunication.entity';
import { Complaint, ComplaintCategory, ComplaintSeverity } from './complaint.entity';
import { ParentNpsSurvey } from './parentnpssurvey.entity';
import { OperationalData, DataType } from './operationaldata.entity';
import { MonitoringScorecard, ScorecardMetric } from './monitoringscorecard.entity';
import { DataRetentionPolicy, DataClassification, RetentionAction } from './dataretentionpolicy.entity';
import { AuditLog, ActionType, ResourceType } from './auditlog.entity';
import { RemediationIntervention, InterventionType, InterventionStatus } from './remediationintervention.entity';
import { Admission, AdmissionStatus, AdmissionSource } from './admission.entity';

export {
  Assessment,
  AssessmentStatus,
  Question,
  QuestionType,
  RespondentType,
  AssessmentResponse,
  School,
  CityTier,
  BoardType,
  Student,
  StudentStatus,
  AgeGroup,
  Staff,
  StaffPosition,
  EmploymentStatus,
  Organization,
  OrganizationType,
  TeacherTraining,
  CompletionStatus,
  Challenge,
  ChallengeCategory,
  PREDEFINED_CHALLENGES,
  GapPrediction,
  TrendDirection,
  ConfidenceTier,
  HealthReport,
  ReportType,
  District,
  User,
  UserType,
  RoleType,
  StudentAttendance,
  StudentAcademicAssessment,
  AcademicStatus,
  CounsellorReferral,
  ReferralSeverity,
  ResolutionStatus,
  BullyingIncident,
  IncidentType,
  IncidentSeverity,
  ParentCommunication,
  CommunicationChannel,
  CommunicationStatus,
  Complaint,
  ComplaintCategory,
  ComplaintSeverity,
  ParentNpsSurvey,
  OperationalData,
  DataType,
  MonitoringScorecard,
  ScorecardMetric,
  DataRetentionPolicy,
  DataClassification,
  RetentionAction,
  AuditLog,
  ActionType,
  ResourceType,
  RemediationIntervention,
  InterventionType,
  InterventionStatus,
  Admission,
  AdmissionStatus,
  AdmissionSource,
};

// Array of all entities for TypeORM configuration
export const DISHA_ENTITIES = [
  Organization,
  School,
  District,
  Assessment,
  Question,
  AssessmentResponse,
  Challenge,
  GapPrediction,
  HealthReport,
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
