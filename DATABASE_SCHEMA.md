# Disha v2.0 - Database Schema

**Status:** COMPLETE | **Owner:** DBA / Backend Lead | **Last Updated:** 2026-07-17
**Engine:** PostgreSQL 15/16 · **ORM:** TypeORM 0.3 · **Entity source:** `backend/src/database/entities/`

---

## 📋 Table of Contents

1. [Conventions](#conventions)
2. [Entity-Relationship Overview](#entity-relationship-overview)
3. [Core Tables](#core-tables)
4. [Diagnostic Engine Tables](#diagnostic-engine-tables)
5. [Extended / Compliance Tables](#extended--compliance-tables)
6. [Indexes](#indexes)
7. [Migrations](#migrations)
8. [Query Optimization Notes](#query-optimization-notes)
9. [Backup Strategy](#backup-strategy)

---

## Conventions

- Every table has a `uuid` primary key (`@PrimaryGeneratedColumn('uuid')`), named `id`.
- Foreign keys are stored twice: as the TypeORM `@ManyToOne` relation (for
  query builder joins) **and** as an explicit `xxxId: uuid` column (for direct
  filtering without a join) — e.g. `Student.school` and `Student.schoolId`
  both exist and point at the same value.
- `createdAt` / `updatedAt` are `@CreateDateColumn()` / `@UpdateDateColumn()`
  timestamps, present on nearly every table; a few append-only log tables
  (audit, response, attendance) only have `createdAt`.
- Enum columns are stored as Postgres `enum` types, one per TypeScript enum
  declared alongside the entity class.
- `synchronize` is driven by `database.synchronize` in `backend/src/config`
  (env-controlled) — **must be `false` outside local dev**; schema changes in
  staging/production go through the files in `database/migrations/` only.

---

## Entity-Relationship Overview

```
Organization ─┬─< School >─┬─< Student >─┬─< StudentAttendance
              │            │             ├─< StudentAcademicAssessment
              │            │             ├─< CounsellorReferral
              │            │             ├─< RemediationIntervention
              │            │             └─< AssessmentResponse (respondentId, untyped FK)
              │            │
              │            ├─< Staff >─< TeacherTraining
              │            ├─< Assessment >─< Question >─< AssessmentResponse
              │            ├─< GapPrediction >─ Challenge >─< Question (M:N via challenge_question_mapping)
              │            ├─< Admission
              │            ├─< AuditLog (schoolId only, no FK relation)
              │            ├─< BullyingIncident
              │            ├─< Complaint
              │            ├─< MonitoringScorecard
              │            ├─< OperationalData
              │            ├─< ParentCommunication >─ User (parent), Student
              │            └─< ParentNpsSurvey >─ User
              │
District ─────┘ (School.district / School.state are plain strings, not an FK
                  to District — District exists as a separate reference table)

User (auth/identity — school_admin, teacher, parent, student, ryl_admin, ryl_support)
  — referenced by ParentCommunication.parentId, Complaint.userId, ParentNpsSurvey.parentId
  — NOT referenced by Staff or Student (those are operational records, not login identities)

DataRetentionPolicy — standalone, keyed by DataClassification, not FK'd to anything
```

**Note on `User` vs `Staff`/`Student`:** these are deliberately separate.
`User` rows are login identities (email + password hash + role) used for
authentication. `Staff` and `Student` rows are operational HR/SIS records.
A teacher who can log in has **both** a `User` row (for auth) and a `Staff`
row (for their employment record) — there is no FK linking them today; they
are correlated by `schoolId` + matching name/email at the application layer,
which is a gap worth closing if per-staff login auditing is needed.

---

## Core Tables

### `organizations`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | varchar(255) | |
| type | enum `OrganizationType` | |
| country | varchar(2) | default `'IN'` |
| state, city | varchar(100), nullable | |
| contactEmail, contactPhone, website, registrationNumber | varchar, nullable | |
| createdAt, updatedAt | timestamp | |

Relations: `OneToMany → School`

### `districts`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | varchar(100) | |
| state | varchar(100) | indexed |
| schoolCount | int | default 0 |
| region, code | varchar, nullable | |
| createdAt | timestamp | |

Standalone reference table — `School.district` / `School.state` are free-text,
not a foreign key into this table.

### `schools`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| organizationId | uuid, nullable | FK → organizations (eager-loaded) |
| name | varchar(255) | |
| district | varchar(100) | indexed with `state` |
| state, city | varchar(100), nullable | |
| cityTier | enum `tier_1\|tier_2\|tier_3`, nullable | |
| boardType | enum `cbse\|icse\|ib\|state\|other`, nullable | |
| studentCount, staffCount | int, nullable | |
| udiseCode | varchar(20), nullable | indexed |
| latitude, longitude | decimal(10,8)/(11,8), nullable | |
| principalName, principalPhone, principalEmail | varchar, nullable | |
| address, pinCode | varchar, nullable | |
| isActive | boolean | default true, indexed |
| onboardedDate, lastAssessmentDate | date, nullable | |
| createdAt, updatedAt | timestamp | |

Relations: `ManyToOne → Organization`, `OneToMany → Assessment, Student, Staff, GapPrediction`

### `users`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| email | varchar(255) | **unique**, indexed |
| phone | varchar(20), nullable | |
| passwordHash | varchar(255) | bcrypt, 10 rounds |
| firstName | varchar(100) | |
| lastName | varchar(100), nullable | |
| userType | enum `school_admin\|teacher\|parent\|student\|ryl_admin\|ryl_support` | drives RBAC (`@Roles()`) |
| schoolId | uuid, nullable | indexed with userType; null for `ryl_admin`/`ryl_support` |
| roleType | enum `admin\|user\|viewer` | default `user` — a separate, coarser permission tier, **not** used by `RolesGuard` (see ARCHITECTURE_GUIDE known gaps) |
| isActive | boolean | default true |
| lastLoginAt | timestamp, nullable | |
| createdAt, updatedAt | timestamp | |

### `students`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| schoolId | uuid | FK → schools, indexed with `status` |
| enrollmentNumber | varchar(50) | indexed (not unique at the DB level) |
| firstName | varchar(100) | |
| lastName | varchar(100), nullable | |
| gender | enum `male\|female\|other`, nullable | |
| dateOfBirth | date, nullable | |
| gradeLevel | int, nullable | 1–12; indexed |
| classSection | varchar(10), nullable | e.g. `"A"` |
| ageGroup | enum `6_8\|9_12\|13_18`, nullable | derived from DOB or set manually; indexed |
| enrollmentDate | date | |
| status | enum `active\|withdrawn\|transferred\|graduated` | default `active`, indexed with schoolId |
| withdrawalDate, withdrawalReasonCode, withdrawalReasonDetail | nullable | |
| guardianName, guardianPhone, guardianEmail | varchar, nullable | students have **no email of their own** in this schema |
| createdAt, updatedAt | timestamp | |

There is **no `Class` table** — "class 10-A" is `gradeLevel=10, classSection='A'`
on the student row, not a first-class entity. See `StudentService.getClassesBySchool()`.

### `staff`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| schoolId | uuid | FK → schools, cascade delete, indexed with `employmentStatus` |
| employeeId | varchar(50) | indexed |
| firstName | varchar(100) | |
| lastName | varchar(100), nullable | |
| gender | enum, nullable | |
| subjectTaught | varchar(100), nullable | |
| gradeLevel | int, nullable | for teachers assigned to a specific grade |
| position | enum `principal\|vice_principal\|teacher\|counsellor\|admin_staff` | indexed |
| startDate | date | |
| salaryBand | varchar(50), nullable | |
| employmentStatus | enum `active\|leave\|resigned\|retired` | default `active` |
| exitDate, exitReasonDetail | nullable | |
| weeklyTeachingHours | int | default 40 |
| qualification, phone | varchar, nullable | |
| lastTrainingDate | date, nullable | |

Relations: `OneToMany → TeacherTraining`

### `teacher_training`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| staffId | uuid | FK → staff, indexed with `trainingDate` |
| trainingDate | date | |
| topic | varchar(200) | indexed |
| durationHours | int | |
| trainingType | varchar(100) | default `'workshop'` |
| completionStatus | enum `CompletionStatus` | |
| assessmentScore | int, nullable | |
| feedback, certificateUrl | nullable | |
| createdAt | timestamp | |

---

## Diagnostic Engine Tables

### `challenges`
Predefined, seeded menu (`PREDEFINED_CHALLENGES` in `Challenge.entity.ts`, 15
challenges across 5 categories). `code` is unique (e.g. `enrollment_decline`,
`teacher_attrition`, `fee_collection`).

| Column | Type |
|---|---|
| id | uuid PK |
| code | varchar(50), unique |
| displayName | varchar(255) |
| category | enum `ChallengeCategory` (growth_enrollment, people, academic_wellbeing, reputation_marketing, operations_finance) |
| description | text |
| iconName | varchar(50), nullable |
| createdAt | timestamp |

Relations: `ManyToMany → Question` via join table `challenge_question_mapping`.

### `assessments`
A diagnostic assessment **cycle** (e.g. `"Term1_2026"`) for a school — not a
single quiz.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| schoolId | uuid | eager-loaded relation, indexed with `status` |
| cycleName | varchar(50) | |
| status | enum `draft\|active\|closed\|archived` | default `draft` |
| description | text, nullable | |
| startDate, endDate | date, nullable | |
| createdAt, updatedAt | timestamp | indexed on createdAt |

Relations: `OneToMany → Question, AssessmentResponse`

### `questions`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| assessmentId | uuid | cascade delete, indexed with respondentType |
| questionCode | varchar(50) | e.g. `Q1_RETENTION_912` |
| questionText | text | |
| questionType | enum `likert_5\|likert_5_reverse\|multiple_choice\|yes_no\|open_text\|rating_nps` | |
| respondentType | enum `student_6_8\|student_9_12\|student_13_18\|teacher\|parent\|school_leader` | indexed |
| challengeDomain | varchar(100), nullable | e.g. `student_retention` — indexed |
| orderInForm | int | |
| isMandatory | boolean | default true |
| skipLogic | jsonb, nullable | conditional display logic |
| options | jsonb, nullable | multiple-choice options |
| correctAnswer | varchar(50), nullable | |
| createdAt | timestamp | |

Relations: `ManyToOne → Assessment`, `OneToMany → AssessmentResponse`, `ManyToMany → Challenge`

### `assessment_responses`
One row per (assessment, respondent, question) — append-only, submitted
publicly (no auth) via `POST /api/v2/assessments/:id/submit`.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| assessmentId | uuid | |
| respondentId | uuid | student/teacher/parent/leader ID — **untyped**, no FK constraint |
| respondentType | varchar(50) | |
| questionId | uuid | FK → questions |
| responseValue | varchar(50) | raw value: `"1"–"5"`, `"0"–"10"`, text, yes/no |
| responseNumeric | decimal(5,2), nullable | normalized 1.0–5.0 for scoring |
| responseText | text, nullable | open-ended answers |
| schoolId | uuid | |
| submissionTimestamp | timestamp (createdAt) | indexed |
| ipAddress, deviceType, deviceOs, countryCode, timezone | nullable | |
| isValid | boolean | default true |
| validationFlags | jsonb, nullable | data-quality concerns |
| submissionTimeSeconds | int, nullable | |
| createdAt | timestamp | |

**Unique constraint:** `(assessmentId, respondentId, questionId)` — a
respondent can only answer a given question once per assessment cycle.

### `gap_predictions`
The output of the diagnostic scoring engine — one row per (school, academic
year, challenge), ranked.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| schoolId | uuid | |
| academicYear | varchar(50) | |
| challengeId | uuid | FK → challenges |
| selfReportedSeverity | decimal(3,2), nullable | from perception questions |
| dataConfirmedSeverity | decimal(3,2), nullable | from operational data |
| trendDirection | enum `worsening\|stable\|improving\|unknown` | default `unknown` |
| confidenceTier | enum `A\|B\|C` | default `C` |
| combinedScore | decimal(4,3) | composite ranking score |
| priorityRank | integer | |
| urgencyFactor | decimal(3,2), nullable | |
| dataSources | jsonb, nullable | which sources fed this score |
| createdAt, updatedAt | timestamp | indexed with `academicYear, priorityRank` |

---

## Extended / Compliance Tables

These support operations, wellbeing, and compliance reporting. Summarized
rather than fully expanded — see the entity file for exact columns.

| Table | Purpose | Key FKs | Notable enums |
|---|---|---|---|
| `student_attendance` | Daily attendance per student | studentId, schoolId | `AttendanceStatus` (present/absent/leave/half_day) |
| `student_academic_assessments` | Per-subject term marks | studentId, schoolId | `AcademicStatus` |
| `counsellor_referrals` | Student → counsellor referrals | studentId, schoolId | `ReferralSeverity`, `ResolutionStatus` |
| `remediation_interventions` | Follow-up interventions for at-risk students | studentId, schoolId | `InterventionType`, `InterventionStatus` |
| `bullying_incidents` | Logged incidents | schoolId | `IncidentType`, `IncidentSeverity`, `ResolutionStatus` |
| `admissions` | Admission funnel tracking | schoolId | `AdmissionStatus`, `AdmissionSource` — **no controller wired yet** |
| `complaints` | Parent/stakeholder complaints | schoolId, userId | `ComplaintCategory`, `ComplaintSeverity`, `ResolutionStatus` |
| `parent_communications` | Parent query/response log | schoolId, parentId (User), studentId | `CommunicationChannel`, `CommunicationStatus` — **entity unused, no module wired** |
| `parent_nps_surveys` | NPS survey responses | schoolId, parentId (User) | — |
| `operational_data` | Generic operational metrics feed (jsonb payload) | schoolId | `DataType` |
| `monitoring_scorecards` | Monthly scorecard metrics | schoolId | `ScorecardMetric` |
| `audit_logs` | Every mutating action, append-only | schoolId, userId (nullable) | `ActionType`, `ResourceType` |
| `data_retention_policies` | DPDP/GDPR retention rules | — (standalone) | `DataClassification`, `RetentionAction` |
| `health_reports` | Generated full health-check reports (jsonb sections) | schoolId | `ReportType` |

---

## Indexes

Every table lists its indexes as `@Index([...])` decorators on the entity
class. The recurring pattern is a compound index on `(schoolId, <hot filter
column>)` since almost every query is scoped to one school:

- `students`: `(schoolId, status)`, `(enrollmentNumber)`, `(gradeLevel)`, `(ageGroup)`
- `staff`: `(schoolId, employmentStatus)`, `(employeeId)`, `(position)`
- `assessments`: `(schoolId, status)`, `(createdAt)`
- `assessment_responses`: unique `(assessmentId, respondentId, questionId)`,
  `(schoolId, respondentType)`, `(respondentId)`, `(submissionTimestamp)`
- `gap_predictions`: `(schoolId, academicYear, priorityRank)`
- `student_attendance`: `(studentId, attendanceDate)`, `(schoolId, monthYear)`
- `audit_logs`: `(schoolId, actionTimestamp)`, `(userId, actionTimestamp)`, `(resourceType, actionTimestamp)`
- `users`: unique `(email)`, `(schoolId, userType)`

`backend/src/database/migrations/1724056802000-AddPerformanceIndexes.ts`
adds further composite indexes beyond the entity-level ones above — check
that file directly before assuming an index does or doesn't exist in a given
environment.

---

## Migrations

Three migration files exist in `backend/src/database/migrations/`:

1. `1724056800000-InitialSchema.ts` — base schema
2. `1724056801000-AdditionalTables.ts` — compliance/wellbeing tables
3. `1724056802000-AddPerformanceIndexes.ts` — index tuning

Run with `npm run migration:run` (see backend `package.json`). In local dev,
`TypeOrmModule.forRootAsync` reads `database.synchronize` from config — when
true, TypeORM auto-syncs the schema from entities and migrations are not
strictly required; **production must set this to `false`** and rely on
migrations only, per `DEPLOYMENT_GUIDE.md`.

New entities added after the initial three migrations (e.g. any future
`Class` entity, or activating `communication`/`admissions`/`fee` modules)
need a new migration file — do not rely on `synchronize` outside local dev.

---

## Query Optimization Notes

`backend/src/database/queries/optimized-queries.ts` holds hand-written query
helpers for the highest-traffic reads (student lists, assessment summaries)
that use `QueryBuilder` directly instead of the default repository `find()`
to control exactly which joins/columns are fetched. Prefer extending that
file over adding new N+1-prone `relations: [...]` lookups in services.

General rules applied so far:
- `School.organization` is `eager: true` — every school fetch joins its
  organization. Be aware of this when adding new queries against `schools`.
- Everything else is lazy — explicit `relations: [...]` needed to populate.
- List endpoints (`getStudentsBySchool`, `getStaffBySchool`, etc.) are not
  paginated at all — `common/dto/pagination.dto.ts` and
  `common/utils/pagination.util.ts` exist and are demonstrated in
  `services/school-paginated.service.example.ts`, but no real controller
  uses them yet. Apply them before a school's roster grows past a few
  hundred rows.

---

## Backup Strategy

Covered in detail in `DEPLOYMENT_GUIDE.md` § Step 7: Setup Database Backups —
not duplicated here to avoid drift between the two documents.
