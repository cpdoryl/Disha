# Disha v2.0 - Architecture Guide

**Status:** COMPLETE | **Owner:** Tech Lead | **Last Updated:** 2026-07-17
**Companion docs:** [TECH_STACK.md](./TECH_STACK.md) · [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) · [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

---

## 📋 Table of Contents

1. [What Disha Is](#what-disha-is)
2. [System Architecture](#system-architecture)
3. [Repository Layout](#repository-layout)
4. [Backend Module Map](#backend-module-map)
5. [Frontend Architecture](#frontend-architecture)
6. [Request Lifecycle](#request-lifecycle)
7. [Key Flows](#key-flows)
8. [Design Patterns in Use](#design-patterns-in-use)
9. [Known Gaps & Inconsistencies](#known-gaps--inconsistencies)
10. [Module Dependency Graph](#module-dependency-graph)

---

## What Disha Is

Disha is a **challenge-first school diagnostic platform**. Instead of a long survey,
a school owner picks the problems already worrying them from a menu of predefined
challenges (`Challenge` entity — enrollment decline, teacher attrition, fee
collection stress, etc.), the platform generates a targeted `Assessment` cycle
with `Question`s scoped to specific respondent types (student, teacher, parent,
school leader), collects `AssessmentResponse`s, and combines self-reported
severity with data-confirmed severity into a `GapPrediction` — a ranked list of
the school's real priority gaps.

Around that diagnostic core sits a conventional school-operations layer
(students, staff, attendance, admissions, compliance, wellbeing/counselling,
audit logging) that both feeds data into the diagnostic scoring and is useful
in its own right as a lightweight school admin system — which is what the
`frontend/` admin dashboard currently exposes.

---

## System Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│  Browser — Next.js 14 App Router (frontend/)                       │
│  ┌────────────┐  ┌────────────────┐  ┌───────────────────────┐    │
│  │ Pages       │  │ lib/store       │  │ lib/api               │    │
│  │ (dashboard/ │→ │ authStore.ts    │→ │ client.ts (axios)      │    │
│  │  *)         │  │ (zustand)       │  │ services.ts            │    │
│  └────────────┘  └────────────────┘  └───────────┬───────────┘    │
└──────────────────────────────────────────────────┼─────────────────┘
                                                     │ HTTPS + Bearer JWT
                                                     ▼
┌───────────────────────────────────────────────────────────────────┐
│  NestJS API — backend/src (single process, port 3000)              │
│                                                                     │
│  main.ts                                                           │
│   ├─ helmet()                     — security headers                │
│   ├─ compression()                — gzip                            │
│   ├─ CORS (CORS_ORIGIN env)                                        │
│   ├─ ValidationPipe (whitelist + transform)                        │
│   ├─ AllExceptionsFilter          — uniform error JSON              │
│   ├─ LoggingInterceptor                                            │
│   ├─ MetricsMiddleware (applied to '*')                            │
│   └─ Swagger UI at /docs                                           │
│                                                                     │
│   AppModule imports 19 feature modules (see Backend Module Map)    │
│   Each module: Controller → Service → TypeORM Repository           │
│   Cross-cutting: JwtAuthGuard + RolesGuard on nearly every route    │
└──────────────────────────────────────────┬─────────────────────────┘
                                            │ TypeORM
                                            ▼
                                   ┌─────────────────┐
                                   │ PostgreSQL 15/16 │
                                   │ (see DATABASE_   │
                                   │  SCHEMA.md)       │
                                   └─────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│  extraction/ — Python/FastAPI service (OCR + LLM document intake)  │
│  Status: SCAFFOLDING ONLY — Dockerfile + requirements.txt exist,   │
│  no app/ code yet. Not wired into docker-compose or the backend.   │
└───────────────────────────────────────────────────────────────────┘
```

There is no separate cache layer, message queue, or mobile app in the
codebase today, despite being referenced in `README.md`'s aspirational
project-structure diagram (`mobile/`, `terraform/`, `docs/` do not exist on
disk). Redis appears in `docker-compose.yml` and `.env.example` but nothing
in `backend/src` currently imports a Redis client.

---

## Repository Layout

```
Disha/
├── backend/                       NestJS 10 API (TypeScript)
│   ├── src/
│   │   ├── main.ts                 Bootstrap, global pipes/filters/guards
│   │   ├── app.module.ts           Root module — imports all 19 feature modules
│   │   ├── config/                 ConfigModule factory (env → typed config)
│   │   ├── common/
│   │   │   ├── guards/              JwtAuthGuard, RolesGuard, PermissionsGuard, RateLimitGuard
│   │   │   ├── decorators/          @Roles(), @RequirePermissions()
│   │   │   ├── constants/           permissions.ts (Permission enum + role→permission map)
│   │   │   ├── filters/             AllExceptionsFilter
│   │   │   ├── interceptors/        LoggingInterceptor
│   │   │   ├── middleware/          MetricsMiddleware
│   │   │   ├── dto/                 PaginationDto
│   │   │   └── utils/               pagination.util.ts
│   │   ├── database/
│   │   │   ├── entities/            26 TypeORM entities (see DATABASE_SCHEMA.md)
│   │   │   ├── migrations/          3 migration files (Initial, Additional, PerfIndexes)
│   │   │   ├── seeds/                seed.ts
│   │   │   └── queries/              optimized-queries.ts (raw query helpers)
│   │   ├── services/                 Shared services used by >1 controller
│   │   │                             (student, school, reporting, notification,
│   │   │                              audit, wellbeing, data)
│   │   └── modules/                  19 feature modules — see table below
│   └── test/                         Jest unit + integration specs
│
├── frontend/                      Next.js 14 App Router admin dashboard
│   ├── app/
│   │   ├── page.tsx                 Login page
│   │   └── dashboard/
│   │       ├── layout.tsx            Auth-gated shell (Sidebar + Navbar)
│   │       ├── page.tsx              Overview / stat cards
│   │       ├── students/             Real API integration
│   │       ├── staff/                Real API integration
│   │       ├── attendance/           Real API integration
│   │       ├── classes/              Real API integration (read-only, derived)
│   │       ├── assessments/          Real API integration
│   │       ├── reports/              Real API integration (with mock fallback)
│   │       └── communications/       Mock data only — no backend model yet
│   ├── components/
│   │   ├── auth/LoginForm.tsx
│   │   ├── layout/{Sidebar,Navbar}.tsx
│   │   └── dashboard/StatCard.tsx
│   └── lib/
│       ├── api/client.ts             Axios instance, JWT interceptor, refresh-on-401
│       ├── api/services.ts           One typed object per resource (studentAPI, etc.)
│       └── store/authStore.ts        Zustand store, persisted, drives route guarding
│
├── extraction/                    Python FastAPI OCR/LLM service — scaffolding only
├── monitoring/                    Prometheus/Grafana config for docker-compose
├── scripts/                       Ops scripts (see DEPLOYMENT_GUIDE.md)
├── docker-compose.yml             postgres + redis + backend + frontend (dev)
├── docker-compose.staging.yml     Staging stack
└── nginx.conf / nginx-staging.conf
```

---

## Backend Module Map

All 19 modules are registered in `app.module.ts`. "Real" means it has a
Controller + Service wired to a TypeORM repository; "Stub" means the module
file exists but contributes nothing yet.

| Module | Controller prefix | Status | Notes |
|---|---|---|---|
| `auth` | `/api/v2/auth` | Real | Login/refresh/logout, JWT issuance |
| `school` | `/api/v2/schools` | Real | CRUD, metrics, org/district lookups |
| `student` | `/api/v2/students` | Real | CRUD, attendance, academic assessment, risk profile, derived classes |
| `staff` | `/api/v2/staff` | Real | Added this cycle — create/list by school |
| `attendance` | `/api/v2/attendance` | Real | Added this cycle — class roster + bulk mark |
| `assessment` | `/api/v2/assessments` | Real | Diagnostic assessment cycles, questions, response submission |
| `challenge` | `/challenges` | Real | Predefined challenge menu (seeded) |
| `gap-prediction` | — | Service only | No controller; consumed internally for scoring |
| `reporting` | `/api/v2/reports` | Real | Assessment summary, school performance, student progress, export/schedule |
| `wellbeing` | `/api/v2/wellbeing` | Real | Counsellor referrals, interventions, bullying incidents |
| `data` | `/api/v2/data` | Real | Operational data, scorecards, retention/attendance trend analytics |
| `notification` | `/api/v2/notifications` | Real | Send/attendance-alert/academic-update/fee-reminder templates |
| `audit` | `/api/v2/audit` | Real | Audit log write + query by school/user, suspicious-activity detection |
| `health` | `/health` | Real | Liveness/readiness/startup/metrics/deep checks |
| `admissions` | — | **Stub** | `@Module({})` — entity exists (`Admission`), no controller/service |
| `fee` | — | **Stub** | No `Fee` entity exists at all |
| `compliance` | — | **Stub** | No controller/service |
| `communication` | — | **Stub** | `ParentCommunication` entity exists but is unused |
| `infrastructure` | — | **Stub** | No controller/service |

Modules marked **Stub** contain only `@Module({}) export class XModule {}` —
registered in `AppModule` so the app boots, but they add nothing to the
route table. This mirrors the `frontend/app/dashboard/communications` page,
which was built against a schema that has no backend behind it (see
[Known Gaps](#known-gaps--inconsistencies)).

---

## Frontend Architecture

- **Framework:** Next.js 14 App Router, all pages are Client Components (`'use client'`).
- **Routing:** `app/page.tsx` is the login screen; everything under
  `app/dashboard/` is wrapped by `app/dashboard/layout.tsx`, which redirects to
  `/` if `useAuthStore().isAuthenticated` is false.
- **State:** `zustand` with the `persist` middleware for the `user` /
  `isAuthenticated` flags (`lib/store/authStore.ts`). Access/refresh JWTs are
  **not** in the zustand store — they live in cookies (`js-cookie`) so the
  axios interceptor in `lib/api/client.ts` can read them without a React render.
- **Data fetching:** No React Query yet (listed as "planned" in TECH_STACK.md).
  Each page does its own `useEffect` → `setLoading(true)` → `await xxxAPI.method()`
  → `setState` → `setLoading(false)` with a try/catch that surfaces
  `err.response?.data?.message` in an inline error banner with a Retry button.
- **Forms:** `react-hook-form` + `zod` schema validation on every create/edit form.
- **Styling:** Tailwind CSS utility classes inline; no component library beyond
  Radix UI primitives (installed, not yet used in dashboard pages).
- **Charts:** Recharts, used in `dashboard/page.tsx` and `dashboard/reports/page.tsx`.

---

## Request Lifecycle

```
1. User submits LoginForm
2. useAuthStore.login(email, password)
     → POST /api/v2/auth/login (no auth header required)
     → backend: AuthService.validateUser() → bcrypt.compare()
     → AuthService.generateTokens() signs JWT { sub, schoolId, role: userType, email }
     → response: { accessToken, refreshToken, user: { id, email, firstName, lastName, role, schoolId } }
3. Frontend stores accessToken/refreshToken in cookies, user object in zustand
4. Every subsequent apiClient request:
     → request interceptor reads accessToken cookie, sets Authorization: Bearer <jwt>
     → backend JwtStrategy.validate() decodes payload → req.user = { userId, schoolId, role, email }
     → JwtAuthGuard confirms signature/expiry
     → RolesGuard reads @Roles(...) metadata on the handler, checks it against req.user.role
     → Controller → Service → TypeORM Repository → PostgreSQL
5. On 401 (expired access token):
     → response interceptor calls POST /api/v2/auth/refresh once
     → on success, retries the original request with the new token
     → on failure, clears cookies and hard-redirects to '/'
```

---

## Key Flows

### Diagnostic assessment flow (the platform's core purpose)
```
School selects Challenge(s) from the predefined menu (ChallengeController)
    ↓
Assessment cycle created: POST /api/v2/assessments/create { schoolId, cycleName, ... }
    ↓
Questions pulled per respondent type: GET /api/v2/assessments/:id/questions?respondentType=parent
    ↓
Respondents submit: POST /api/v2/assessments/:id/submit (public — no JWT required)
    ↓
AssessmentService validates against Question definitions, writes AssessmentResponse rows
    ↓
GapPredictionModule scoring (self-reported + data-confirmed severity → GapPrediction rows,
    ranked by priorityRank per school/academicYear)
```

### School-admin CRUD flow (what the dashboard currently drives)
```
Dashboard page mounts → reads user.schoolId from authStore
    ↓
GET /api/v2/{students|staff}/school/:schoolId  (or /api/v2/attendance?schoolId=...)
    ↓
RolesGuard checks caller's role is one of the endpoint's @Roles(...)
    ↓
Service queries TypeORM repository, filtered by schoolId
    ↓
Page renders table; create-forms POST back through the same service layer
```

---

## Design Patterns in Use

- **Layered architecture per module:** Controller (HTTP + `@Roles` + Swagger
  decorators) → Service (business logic, injected `Repository<Entity>`) →
  TypeORM Repository (data access). No separate repository-abstraction layer —
  services call `Repository<T>` directly.
- **Guard chain for authorization:** `@UseGuards(JwtAuthGuard, RolesGuard)` at
  the controller level, `@Roles('ryl_admin', 'school_admin', ...)` per route.
  A third `PermissionsGuard` + `Permission` enum (`common/constants/permissions.ts`)
  exists for finer-grained checks but is not yet applied on any route — only
  role-based checks are active today.
- **DTO validation at the edge:** `class-validator` DTOs (e.g. `LoginDto`,
  `CreateAssessmentDto`) combined with the global `ValidationPipe({ whitelist:
  true, transform: true })`. Several controllers still type the body as `any`
  (e.g. `createStudentDto: any` in `StudentController`) — inconsistent with
  the DTO pattern used elsewhere; see [Known Gaps](#known-gaps--inconsistencies).
- **Uniform error envelope:** `AllExceptionsFilter` catches everything and
  returns `{ statusCode, timestamp, path, method, error, message }`.
- **Derived-not-stored data:** "Classes" have no table — `StudentService.
  getClassesBySchool()` groups active students by `gradeLevel` + `classSection`
  on read. This is a deliberate simplification rather than an oversight.

---

## Known Gaps & Inconsistencies

Documenting these explicitly so they aren't rediscovered the hard way:

1. **`admissions`, `fee`, `compliance`, `infrastructure` modules are empty
   stubs.** `Admission` entity exists with no controller. There is no `Fee`
   entity at all, despite fee-related mentions in README/TECH_STACK.
2. **`communication` module is an empty stub**; the `ParentCommunication`
   entity (parent query/response log) exists but nothing reads or writes it.
   The frontend Communications page is pure mock data with a different
   shape (announcements/inbox/compose) than what `ParentCommunication`
   actually models — reconciling these needs a product decision, not just
   a wiring fix.
3. **No `Class` entity.** "Classes" in the dashboard are derived read-only
   from `Student.gradeLevel` + `Student.classSection`. There's no way to
   create a class, assign a class teacher, or list subjects — features the
   frontend previously implied existed before this rework.
4. **Mixed DTO discipline.** Some controllers (`assessment`, `auth`) use
   typed `class-validator` DTOs; others (`student`, `school`, `staff`)
   accept `Body() dto: any`. `CODING_STANDARDS.md` sets the expectation
   going forward; existing `any`-typed bodies are tracked debt, not a
   template to copy.
5. **`PermissionsGuard` / `Permission` enum are unused.** Built but never
   attached via `@RequirePermissions()` on any route — only `@Roles()` is
   enforced today.
6. **Redis is provisioned but unused.** No caching, session store, or queue
   currently touches it despite appearing in `docker-compose.yml`.
7. **`extraction/` (OCR + LLM intake) has no application code.** Treat it as
   not-yet-started, not partially built.
8. **Entity filenames are case-sensitive-fragile.** Most entity files are
   `PascalCase.entity.ts` (`School.entity.ts`, `Staff.entity.ts`) but a
   handful were `lowercase.entity.ts` while being imported with a
   capitalized path — this built fine on case-insensitive filesystems
   (Windows/macOS) and failed the build entirely on Linux. Fixed by
   renaming `student.entity.ts` → `Student.entity.ts`,
   `assessment.entity.ts` → `Assessment.entity.ts`, `challenge.entity.ts`
   → `Challenge.entity.ts` to match the dominant convention. New entity
   files should follow `PascalCase.entity.ts`.

---

## Module Dependency Graph

```
AppModule
 ├─ ConfigModule (global)
 ├─ TypeOrmModule.forRootAsync (global connection)
 ├─ HealthModule            — no deps on other feature modules
 ├─ AuthModule              — depends on: User entity
 ├─ SchoolModule            — depends on: School, District, Organization
 ├─ StudentModule           — depends on: Student, StudentAttendance,
 │                            StudentAcademicAssessment, CounsellorReferral
 ├─ StaffModule             — depends on: Staff
 ├─ AttendanceModule        — depends on: Student, StudentAttendance
 ├─ ChallengeModule         — depends on: Challenge
 ├─ AssessmentModule        — depends on: Assessment, Question, AssessmentResponse
 ├─ GapPredictionModule     — depends on: GapPrediction, AssessmentResponse, Challenge
 ├─ ReportingModule         — depends on: Assessment, Student, School (via services/reporting.service.ts)
 ├─ DataModule              — depends on: OperationalData, MonitoringScorecard
 ├─ NotificationModule      — depends on: User (delivery targets)
 ├─ AuditModule             — depends on: AuditLog
 ├─ WellbeingModule         — depends on: CounsellorReferral, RemediationIntervention, BullyingIncident
 ├─ AdmissionsModule        — stub (Admission entity exists, unused)
 ├─ FeeModule                — stub (no entity)
 ├─ ComplianceModule         — stub
 ├─ CommunicationModule      — stub (ParentCommunication entity exists, unused)
 └─ InfrastructureModule     — stub
```

No feature module imports another feature module directly — cross-module
data access happens through shared services in `backend/src/services/`
(`student.service.ts`, `school.service.ts`, `reporting.service.ts`, etc.),
which is why several of those live outside `modules/` at the top level of `src/`.
