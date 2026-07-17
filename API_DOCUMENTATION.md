# Disha v2.0 - API Documentation

**Status:** COMPLETE | **Owner:** Backend Lead | **Last Updated:** 2026-07-17
**Base URL (dev):** `http://localhost:3000` · **Swagger UI:** `/docs` (live, generated from the same decorators this doc is written from)

---

## 📋 Table of Contents

1. [Conventions](#conventions)
2. [Authentication](#authentication)
3. [Error Format](#error-format)
4. [Roles](#roles)
5. [Endpoint Reference](#endpoint-reference)
   - [Auth](#auth--apiv2auth)
   - [Schools](#schools--apiv2schools)
   - [Students](#students--apiv2students)
   - [Staff](#staff--apiv2staff)
   - [Attendance](#attendance--apiv2attendance)
   - [Assessments](#assessments--apiv2assessments)
   - [Challenges](#challenges--challenges)
   - [Reports](#reports--apiv2reports)
   - [Wellbeing](#wellbeing--apiv2wellbeing)
   - [Data / Analytics](#data--analytics--apiv2data)
   - [Notifications](#notifications--apiv2notifications)
   - [Audit](#audit--apiv2audit)
   - [Health](#health--health)
6. [Not Yet Implemented](#not-yet-implemented)
7. [Rate Limiting](#rate-limiting)
8. [Pagination, Sorting, Filtering](#pagination-sorting-filtering)

---

## Conventions

- All business endpoints are prefixed `/api/v2/...`, except `/health` and
  `/challenges` (legacy, unprefixed).
- Request/response bodies are JSON. Set `Content-Type: application/json`.
- Authenticated endpoints require `Authorization: Bearer <accessToken>`.
- Path params are shown as `:name`; query params are listed per-endpoint.
- "Roles" lists the exact `@Roles(...)` values required — a caller must have
  a `userType` in that list or the request gets a 403.
- Endpoints marked **public** require no `Authorization` header at all
  (used for anonymous assessment respondents).

---

## Authentication

```
POST /api/v2/auth/login
Content-Type: application/json

{ "email": "admin@disha.local", "password": "password123" }
```

Response `200`:
```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi...",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "user": {
    "id": "b3f1...",
    "email": "admin@disha.local",
    "firstName": "Admin",
    "lastName": "User",
    "role": "school_admin",
    "schoolId": "a21c..."
  }
}
```

`role` is `User.userType` (`school_admin`, `teacher`, `parent`, `student`,
`ryl_admin`, `ryl_support`) — this is the value every `@Roles(...)` check on
every other endpoint compares against. The JWT payload embeds
`{ sub, schoolId, role, email, iat, exp }`.

```
POST /api/v2/auth/refresh
{ "refreshToken": "eyJhbGciOi..." }
→ { accessToken, refreshToken, tokenType, expiresIn }

POST /api/v2/auth/logout   (requires Authorization header)
→ { "message": "Logged out successfully" }
```

`accessToken` expiry is short (`expiresIn`, seconds — driven by
`jwt.expiresIn` config, typically 900s/15min); the frontend's axios
interceptor calls `/auth/refresh` automatically on a 401 and retries once.

---

## Error Format

Every error, from every endpoint, has this shape (see `AllExceptionsFilter`
in `ARCHITECTURE_GUIDE.md`):

```json
{
  "statusCode": 404,
  "timestamp": "2026-07-17T10:00:00.000Z",
  "path": "/api/v2/students/xyz",
  "method": "GET",
  "error": "NotFoundException",
  "message": "Student not found"
}
```

| Status | Meaning |
|---|---|
| 400 | Validation failure (DTO rejected the body) or a required query param missing |
| 401 | Missing/expired/invalid JWT |
| 403 | Valid JWT, but caller's role isn't in the endpoint's `@Roles(...)` list |
| 404 | Resource not found |
| 500 | Unhandled exception — treat as a bug, not an expected case |

---

## Roles

| Role (`userType`) | Who |
|---|---|
| `ryl_admin` | Disha platform admin — full access across all schools |
| `ryl_support` | Disha platform support staff |
| `school_admin` | A school's own administrator |
| `teacher` | Teaching staff |
| `parent` | Parent/guardian |
| `student` | Student |

Most write operations require `ryl_admin` or `school_admin`; most reads also
allow `teacher`; anything about a specific child additionally allows
`parent`. Check the per-endpoint role list below rather than assuming a
pattern — they aren't perfectly uniform.

---

## Endpoint Reference

### Auth — `/api/v2/auth`

| Method | Path | Roles | Body |
|---|---|---|---|
| POST | `/login` | public | `{ email, password }` |
| POST | `/refresh` | public | `{ refreshToken }` |
| POST | `/logout` | any authenticated | — |

---

### Schools — `/api/v2/schools`

| Method | Path | Roles | Notes |
|---|---|---|---|
| POST | `/` | `ryl_admin` | Create school |
| GET | `/:id` | `ryl_admin, school_admin, teacher` | |
| PATCH | `/:id` | `ryl_admin, school_admin` | Partial update |
| GET | `/:id/metrics` | `ryl_admin, school_admin, teacher` | Powers the dashboard overview stat cards |
| GET | `/organization/:orgId` | `ryl_admin, school_admin` | |
| GET | `/district/:districtId` | `ryl_admin, school_admin` | |
| PATCH | `/:id/deactivate` | `ryl_admin` | Sets `isActive = false` |

**Example:**
```
GET /api/v2/schools/a21c.../metrics
Authorization: Bearer <token>
```

---

### Students — `/api/v2/students`

| Method | Path | Roles | Notes |
|---|---|---|---|
| POST | `/` | `ryl_admin, school_admin` | Create student |
| GET | `/:id` | `ryl_admin, school_admin, teacher, parent, student` | |
| GET | `/school/:schoolId/classes` | `ryl_admin, school_admin, teacher` | **Derived** — groups active students by `gradeLevel`+`classSection`; no `Class` table exists |
| GET | `/school/:schoolId` | `ryl_admin, school_admin, teacher` | Active students only |
| PATCH | `/:id/status` | `ryl_admin, school_admin, teacher` | `{ status, reason? }` — withdraw/transfer/graduate |
| POST | `/:id/attendance` | `ryl_admin, school_admin, teacher` | Single-record attendance write (see also `/api/v2/attendance/bulk`) |
| GET | `/:id/attendance/report` | `ryl_admin, school_admin, teacher, parent` | Query: `startDate`, `endDate` |
| POST | `/:id/academic-assessment` | `ryl_admin, school_admin, teacher` | Term marks |
| GET | `/:id/academic-performance` | `ryl_admin, school_admin, teacher, parent` | Query: `term?` |
| POST | `/:id/counsellor-referral` | `ryl_admin, school_admin, teacher` | |
| GET | `/school/:schoolId/risk-profile` | `ryl_admin, school_admin, teacher` | At-risk student summary |

**Create student — request body** (`createStudentDto`, matches
`StudentService.createStudent`):
```json
{
  "schoolId": "a21c...",
  "enrollmentNumber": "EN-001",
  "firstName": "Aisha",
  "lastName": "Khan",
  "gender": "female",
  "dateOfBirth": "2012-04-18",
  "gradeLevel": 8,
  "classSection": "A",
  "ageGroup": "9_12",
  "guardianName": "Farida Khan",
  "guardianPhone": "9876543210",
  "guardianEmail": "farida@example.com"
}
```
Response `201`: the created `Student` row.

---

### Staff — `/api/v2/staff`

*(Added this cycle — previously an empty module stub.)*

| Method | Path | Roles | Notes |
|---|---|---|---|
| POST | `/` | `ryl_admin, school_admin` | Create staff member |
| GET | `/:id` | `ryl_admin, school_admin, teacher` | |
| GET | `/school/:schoolId` | `ryl_admin, school_admin, teacher` | All staff, ordered by first name |

**Create staff — request body:**
```json
{
  "schoolId": "a21c...",
  "employeeId": "EMP-014",
  "firstName": "Rohan",
  "lastName": "Verma",
  "position": "teacher",
  "subjectTaught": "Mathematics",
  "gradeLevel": 9,
  "startDate": "2024-06-01"
}
```
`position` is one of `principal | vice_principal | teacher | counsellor | admin_staff`.

---

### Attendance — `/api/v2/attendance`

*(Added this cycle — previously an empty module stub.)*

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/` | `ryl_admin, school_admin, teacher` | Query: `schoolId, gradeLevel, classSection, date` (all required) |
| POST | `/bulk` | `ryl_admin, school_admin, teacher` | Body: `{ schoolId, date, records: [{ studentId, status }] }` |

**Example:**
```
GET /api/v2/attendance?schoolId=a21c...&gradeLevel=10&classSection=A&date=2026-07-17
```
Response `200`:
```json
[
  { "id": "stu-1", "name": "Aisha Khan", "rollNumber": "EN-001", "status": "Present" },
  { "id": "stu-2", "name": "Rohan Mehta", "rollNumber": "EN-002", "status": "Absent" }
]
```
`status` in the bulk-mark request is the string `"Present"` or `"Absent"` —
mapped to `AttendanceStatus.PRESENT`/`.ABSENT` server-side (the finer-grained
`leave`/`half_day` values exist on the entity but aren't exposed through
this endpoint yet).

---

### Assessments — `/api/v2/assessments`

The diagnostic assessment cycle API — not a generic quiz builder. See
`ARCHITECTURE_GUIDE.md` § Key Flows for how this fits into the overall
challenge → assessment → gap-prediction pipeline.

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/health` | public | Trivial liveness check for this module specifically |
| POST | `/create` | `ryl_admin, school_admin` | `CreateAssessmentDto`: `{ schoolId, cycleName?, description?, startDate?, endDate? }` |
| GET | `/school/:schoolId` | `ryl_admin, school_admin, teacher` | All cycles for a school |
| GET | `/:id` | `ryl_admin, school_admin, teacher, student` | Includes response-count summary |
| GET | `/:assessmentId/questions` | `ryl_admin, school_admin, teacher, student` | Query: `respondentType` (required) — one of the `RespondentType` enum values |
| POST | `/:assessmentId/submit` | **public** | `SubmitResponseDto` — see below |
| GET | `/:assessmentId/my-response` | **public** | Query: `respondentId` (required) — "have I already submitted?" |
| GET | `/:assessmentId/data-quality-report` | `ryl_admin, school_admin, teacher` | |
| PATCH | `/:id/status` | `ryl_admin, school_admin` | Body: `{ status }` — one of `draft\|active\|closed\|archived` |

**Submit responses — request body:**
```json
{
  "assessmentId": "asm-1",
  "responses": [
    { "questionId": "q-1", "respondentId": "usr-1", "respondentType": "parent", "responseValue": "4" },
    { "questionId": "q-2", "respondentId": "usr-1", "respondentType": "parent", "responseValue": "yes" }
  ]
}
```
The URL's `:assessmentId` must equal the body's `assessmentId` or the
request is rejected with 400. A `(assessmentId, respondentId, questionId)`
tuple can only be submitted once — see `DATABASE_SCHEMA.md`.

---

### Challenges — `/challenges`

Unauthenticated — this is the public challenge-selection menu, seeded from
`PREDEFINED_CHALLENGES` (15 challenges across 5 categories).

| Method | Path | Notes |
|---|---|---|
| GET | `/` | All challenges |
| GET | `/by-category/:category` | `category` = `ChallengeCategory` value, e.g. `people` |
| GET | `/:id` | One challenge with its mapped questions |
| POST | `/selected` | Body: `{ challengeIds: string[] }` — multi-select lookup |

---

### Reports — `/api/v2/reports`

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/assessment/:assessmentId/summary` | `ryl_admin, school_admin, teacher` | |
| GET | `/school/:schoolId/performance` | `ryl_admin, school_admin, teacher` | Query: `startDate, endDate` (required) — this is what `reportingAPI.getSchoolMetrics()` on the frontend calls, with a 90-day default window |
| GET | `/student/:studentId/progress` | `ryl_admin, school_admin, teacher, parent` | |
| POST | `/export` | `ryl_admin, school_admin` | Body: `{ reportType, data }` → CSV |
| POST | `/schedule` | `ryl_admin, school_admin` | Body: `{ reportType, schoolId, frequency, recipients }` |

---

### Wellbeing — `/api/v2/wellbeing`

All routes require `ryl_admin, school_admin, teacher`.

| Method | Path | Notes |
|---|---|---|
| GET | `/assessment/:studentId` | Computed wellbeing snapshot |
| POST | `/counsellor-referral` | Create referral |
| PATCH | `/counsellor-referral/:id` | Update |
| POST | `/intervention` | Create remediation intervention |
| PATCH | `/intervention/:id/complete` | Body: `{ effectiveness, notes }` |
| POST | `/bullying-incident` | Record incident |
| PATCH | `/bullying-incident/:id/resolve` | Body: `{ resolutionDate, resolutionNotes }` |
| GET | `/dashboard/school/:schoolId` | Aggregate wellbeing dashboard |
| GET | `/intervention-effectiveness/school/:schoolId` | |

---

### Data / Analytics — `/api/v2/data`

All routes require `ryl_admin, school_admin, teacher`.

| Method | Path | Notes |
|---|---|---|
| POST | `/operational` | Record a raw operational-data point (`jsonb` payload) |
| GET | `/operational/school/:schoolId` | Query: `startDate, endDate` |
| POST | `/scorecard` | Body: `{ schoolId, month, metrics }` |
| GET | `/scorecard/school/:schoolId` | Query: `startMonth, endMonth` |
| GET | `/retention/school/:schoolId` | Query: `academicYear` |
| GET | `/teacher-retention/school/:schoolId` | Query: `academicYear` |
| GET | `/quality/assessment/:assessmentId` | Response-quality metrics for an assessment |
| GET | `/academic-performance/school/:schoolId` | |
| GET | `/attendance-trend/school/:schoolId` | Query: `months?` |

---

### Notifications — `/api/v2/notifications`

All routes require `ryl_admin, school_admin, teacher`.

| Method | Path | Body |
|---|---|---|
| POST | `/send` | Generic `{ ... }` — see `NotificationService.sendNotification` |
| POST | `/attendance-alert` | `{ schoolId, parentId, studentName, attendancePercentage }` |
| POST | `/academic-update` | `{ schoolId, parentId, studentName, subject, performance }` |
| POST | `/fee-reminder` | `{ schoolId, parentId, amount, dueDate }` |
| POST | `/assessment-invitation` | `{ schoolId, respondentId, assessmentName, responseDeadline }` |
| GET | `/preferences/:userId` | — |

All POST routes return `202 Accepted` (fire-and-forget dispatch).

---

### Audit — `/api/v2/audit`

All routes require `ryl_admin, school_admin`.

| Method | Path | Notes |
|---|---|---|
| POST | `/log` | Write an audit entry directly (most entries are written internally by services, not via this route) |
| GET | `/logs/school/:schoolId` | Query: `startDate, endDate, resourceType?` |
| GET | `/activity/user/:userId` | Query: `startDate, endDate` |
| GET | `/failed-actions/school/:schoolId` | Query: `startDate, endDate` |
| GET | `/suspicious-activity/school/:schoolId` | Query: `threshold?` (default 10) |

---

### Health — `/health`

Unauthenticated. For load balancers / container orchestration — not a
business endpoint.

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Overall status — `200` if `ok`, `503` if degraded |
| GET | `/health/live` | Liveness probe — is the process alive |
| GET | `/health/ready` | Readiness probe — DB + dependency checks |
| GET | `/health/startup` | Startup probe — migrations/seed verified |
| GET | `/health/metrics` | Memory, DB pool, request-rate metrics |
| GET | `/health/deep` | Exhaustive diagnostics — don't poll this frequently |

---

## Not Yet Implemented

These are referenced elsewhere (README, TECH_STACK.md) but have **no
route at all** today — calling them will 404, not error gracefully:

- Anything under `admissions`, `fee`, `compliance`, `infrastructure`,
  `communication` — all five modules are registered but empty (`@Module({})`).
  See `ARCHITECTURE_GUIDE.md` § Known Gaps for what data model, if any,
  already exists behind each.
- `GapPredictionModule` has a service (`GapPredictionService`) but **no
  controller** — gap predictions are computed and stored, not yet exposed
  over HTTP. If the frontend needs to show the priority-gap report, that
  controller needs to be added first.

---

## Rate Limiting

`common/guards/rate-limit.guard.ts` and `common/config/rate-limits.config.ts`
exist and implement a token-bucket limiter, but the guard is not currently
attached via `@UseGuards()` on any controller in this snapshot of the code —
treat rate limiting as built-but-not-enabled until it's wired in. Enable it
per-endpoint (start with `/api/v2/auth/login` and the public
`/api/v2/assessments/:id/submit`) before opening this API to the internet.

---

## Pagination, Sorting, Filtering

`common/dto/pagination.dto.ts` + `common/utils/pagination.util.ts` define a
standard `{ page, limit }` → `{ data, total, page, limit, totalPages }`
envelope, demonstrated in `services/school-paginated.service.example.ts`,
but **no live endpoint uses it yet** — every `getXBySchool` list endpoint
documented above returns the full unpaginated array. Do not assume `?page=`
or `?limit=` query params work on any endpoint until this is wired in.
