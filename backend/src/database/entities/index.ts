// Core Entity Imports
import { Assessment, AssessmentStatus } from './assessment.entity';
import { Question, QuestionType, RespondentType } from './question.entity';
import { AssessmentResponse } from './AssessmentResponse.entity';
import { School, CityTier, BoardType } from './School.entity';
import { Student, StudentStatus, AgeGroup, Gender } from './student.entity';
import { Staff, StaffPosition, EmploymentStatus } from './Staff.entity';
import { Organization, OrganizationType } from './Organization.entity';
import { TeacherTraining, CompletionStatus } from './TeacherTraining.entity';

// Additional Entity Imports (Day 2)
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
import { Challenge, ChallengeCategory, PREDEFINED_CHALLENGES } from './challenge.entity';
import { GapPrediction, TrendDirection, ConfidenceTier } from './gap-prediction.entity';
import { FeeLedger, FeeType, FeeStatus, PaymentMethod } from './fee.entity';
import { ParentStudentLink, GuardianRelationship } from './parentstudentlink.entity';

// Core Entity Exports
export { Assessment, AssessmentStatus };
export { Question, QuestionType, RespondentType };
export { AssessmentResponse };
export { School, CityTier, BoardType };
export { Student, StudentStatus, AgeGroup, Gender };
export { Staff, StaffPosition, EmploymentStatus };
export { Organization, OrganizationType };
export { TeacherTraining, CompletionStatus };

// Additional Entity Exports (Day 2)
export { District };
export { User, UserType, RoleType };
export { StudentAttendance };
export { StudentAcademicAssessment, AcademicStatus };
export { CounsellorReferral, ReferralSeverity, ResolutionStatus };
export { BullyingIncident, IncidentType, IncidentSeverity };
export { ParentCommunication, CommunicationChannel, CommunicationStatus };
export { Complaint, ComplaintCategory, ComplaintSeverity };
export { ParentNpsSurvey };
export { OperationalData, DataType };
export { MonitoringScorecard, ScorecardMetric };
export { DataRetentionPolicy, DataClassification, RetentionAction };
export { AuditLog, ActionType, ResourceType };
export { RemediationIntervention, InterventionType, InterventionStatus };
export { Admission, AdmissionStatus, AdmissionSource };
export { Challenge, ChallengeCategory, PREDEFINED_CHALLENGES };
export { GapPrediction, TrendDirection, ConfidenceTier };
export { FeeLedger, FeeType, FeeStatus, PaymentMethod };
export { ParentStudentLink, GuardianRelationship };

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
  Challenge,
  GapPrediction,
  FeeLedger,
  ParentStudentLink,
];
