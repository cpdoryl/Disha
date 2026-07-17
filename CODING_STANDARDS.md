# Disha v2.0 - Coding Standards

**Status:** COMPLETE | **Owner:** Tech Lead | **Last Updated:** 2026-07-17

This document describes the conventions **already in use** across the
codebase (verified against `backend/src` and `frontend/`), plus the handful
of places we've deliberately tightened going forward. Where existing code
violates a rule below, that's tracked debt (cross-referenced to
`ARCHITECTURE_GUIDE.md` § Known Gaps) — don't copy it into new code.

---

## 📋 Table of Contents

1. [Formatting & Linting](#formatting--linting)
2. [TypeScript Conventions](#typescript-conventions)
3. [NestJS Backend Patterns](#nestjs-backend-patterns)
4. [React / Next.js Frontend Patterns](#react--nextjs-frontend-patterns)
5. [Naming Conventions](#naming-conventions)
6. [Error Handling](#error-handling)
7. [Security Guidelines](#security-guidelines)
8. [Git Commit Convention](#git-commit-convention)
9. [Testing Requirements](#testing-requirements)

---

## Formatting & Linting

**Backend** (`backend/.eslintrc.js`, `backend/.prettierrc`):
```json
{ "singleQuote": true, "trailingComma": "all", "semi": true, "printWidth": 120 }
```
- ESLint extends `@typescript-eslint/recommended` + `plugin:prettier/recommended`.
- `no-explicit-any` is **off** at the lint level — `any` will not fail CI, but
  prefer a real type or DTO wherever the shape is knowable (see
  [TypeScript Conventions](#typescript-conventions)).
- Run before committing: `npm run lint` (backend), `next lint` via
  `npm run lint` (frontend).

**Frontend**: no `.eslintrc`/`.prettierrc` file exists yet — it relies on
`eslint-config-next`'s defaults via `next lint`. Match the backend's
single-quote/semicolon/trailing-comma style by convention until a shared
config is added (tracked as a TODO — add `frontend/.eslintrc.json` extending
`next/core-web-vitals` with the same Prettier options as the backend).

---

## TypeScript Conventions

- `strict: true` is enabled in both `backend/tsconfig.json` and
  `frontend/tsconfig.json`, including `noUnusedLocals`, `noUnusedParameters`,
  and `noImplicitReturns`. **A build with an unused variable or an implicit
  `any` parameter will fail** — this isn't optional; it has broken `npm run
  build` in this codebase before (see `ARCHITECTURE_GUIDE.md` § Known Gaps).
- Prefer an explicit interface/type over `any` for anything that crosses a
  module boundary (DTOs, API response shapes, zustand store state). `any` is
  acceptable for a NestJS controller `@Body()` **only** as a stopgap — new
  endpoints should define a `class-validator` DTO (see next section), not
  add another `any`.
- Enums live next to the entity/DTO that defines them (e.g.
  `StudentStatus` in `Student.entity.ts`), imported from
  `database/entities` (the barrel file), not from the individual entity
  file — this keeps a single import path stable even if the underlying file
  moves.

---

## NestJS Backend Patterns

### Module structure
Every feature module under `backend/src/modules/<name>/` follows:
```
<name>.module.ts       — TypeOrmModule.forFeature([...entities]), controllers, providers, exports
<name>.controller.ts   — HTTP layer only: guards, @Roles, param parsing, calls the service
<name>.service.ts      — business logic, injects Repository<Entity> directly (no repository-abstraction layer)
dto/                    — class-validator request/response DTOs (where present)
```
Shared services that more than one module's controller needs live in
`backend/src/services/` instead of inside a single module (e.g.
`student.service.ts`, `school.service.ts`, `reporting.service.ts`).

### Controllers
- Route prefix via `@Controller('api/v2/<resource>')` — **all new resources
  use the `api/v2/` prefix**; `/health` and `/challenges` are the only
  legacy exceptions, don't add a third.
- Guard every non-public route with
  `@UseGuards(JwtAuthGuard, RolesGuard)` at the controller level, then
  `@Roles('ryl_admin', 'school_admin', ...)` per handler — copy the role
  list from the nearest existing sibling endpoint rather than inventing a
  new set; if a genuinely new role combination is needed, check
  `common/constants/permissions.ts`'s `ROLE_PERMISSIONS` map for what that
  role is meant to be allowed to do.
- Public endpoints (e.g. `POST /api/v2/assessments/:id/submit`, used by
  anonymous respondents filling out a survey) must **not** carry the guard
  decorators — mark this explicitly with a comment, since its absence is
  easy to mistake for an oversight.
- Route ordering: a literal path segment (`school/:schoolId`) can be
  declared either before or after a single-segment `:id` route in the same
  controller — Nest matches by path shape, not declaration order, so this
  is not a footgun here, but keep semantically related routes grouped for
  readability regardless.
- Every handler gets `@ApiOperation({ summary: '...' })` — this is what
  populates `/docs` (Swagger UI) and doubles as an endpoint's one-line
  description in `API_DOCUMENTATION.md`.

### Services
- Inject `@InjectRepository(Entity) private xRepository: Repository<Entity>`
  directly — do not add a bespoke repository wrapper class.
- Prefer `repository.find({ where, order })` for simple lookups; drop to
  `repository.createQueryBuilder()` only when you need a join Query Builder
  can't express declaratively, and put it in
  `database/queries/optimized-queries.ts` if it's reused.
- Throw NestJS's built-in exceptions (`NotFoundException`,
  `BadRequestException`, `UnauthorizedException`, `ForbiddenException`) —
  never `throw new Error(...)` in a service; the global
  `AllExceptionsFilter` treats plain `Error`s as an opaque 500, losing the
  status code you meant to return.

### DTOs & validation
- Request bodies for **new** endpoints get a `class-validator` DTO class
  (see `LoginDto`, `CreateAssessmentDto` for the pattern:
  `@IsUUID()`, `@IsOptional()`, `@IsString()`, etc.). The global
  `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform:
  true })` strips/rejects anything not declared on the DTO — an endpoint
  typed `@Body() dto: any` gets none of that protection.
- Response shape isn't currently enforced by a serialization
  interceptor — controllers return entities or plain objects directly.
  Don't leak `passwordHash` or similar sensitive columns in a response;
  the `User` entity in particular requires manually omitting `passwordHash`
  before returning a user object (see `auth.service.ts login()` for the
  pattern of building a narrow `user: {...}` object rather than returning
  the raw entity).

---

## React / Next.js Frontend Patterns

- Every page under `app/dashboard/` is a Client Component (`'use client'`
  at the top) — there are no Server Components in this app yet. If you add
  one, keep data-fetching consistent (still through `lib/api/services.ts`)
  rather than introducing a second, server-side fetch path.
- **Page-level data fetching** follows this exact shape — match it:
  ```tsx
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.schoolId) fetchData()
  }, [user?.schoolId])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await xxxAPI.method(user!.schoolId)
      setData(Array.isArray(result) ? result : result.data || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load X')
      setData([])
    } finally {
      setLoading(false)
    }
  }
  ```
  Every list page renders a loading spinner, an error banner with a Retry
  button wired to `fetchData`, and an empty state — don't skip any of the
  three.
- **All API calls go through `lib/api/services.ts`** — grouped by resource
  (`studentAPI`, `staffAPI`, `assessmentAPI`, ...). Never call `axios` or
  `apiClient` directly from a page component; add a method to the
  appropriate `xxxAPI` object instead, even if it's a one-off.
- **Forms** use `react-hook-form` + a `zod` schema defined at the top of the
  file, resolved via `zodResolver`. Field-level errors render as
  `<p className="text-red-500 text-sm mt-1">{errors.field.message}</p>`
  immediately under the input.
- **Auth/session state** lives only in `useAuthStore()` (zustand). Never
  read the JWT cookie directly from a component — `lib/api/client.ts`'s
  interceptor already attaches it to every request.
- Match real backend field names in new pages/forms — don't invent
  a field the entity doesn't have (this drifted badly before this cycle's
  rework; see `ARCHITECTURE_GUIDE.md` § Known Gaps for the cleanup).

---

## Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Entity files | `PascalCase.entity.ts` | `Student.entity.ts`, `School.entity.ts` |
| Entity class | `PascalCase`, singular | `class Student` |
| DB table name | `snake_case`, plural, in `@Entity('...')` | `students`, `assessment_responses` |
| Module/service/controller files | `kebab-case.type.ts` | `assessment.controller.ts`, `gap-prediction.service.ts` |
| NestJS classes | `PascalCase` + role suffix | `AssessmentController`, `StudentService`, `RolesGuard` |
| React components/pages | `PascalCase.tsx` for components; `page.tsx`/`layout.tsx` for App Router files | `StatCard.tsx` |
| `xxxAPI` service objects | `camelCase` + `API` suffix | `studentAPI`, `attendanceAPI` |
| Zustand hooks | `useXStore` | `useAuthStore` |
| Route prefixes | `/api/v2/<plural-resource>` | `/api/v2/students`, `/api/v2/staff` |
| Enum members | `SCREAMING_SNAKE_CASE` (TS enum), lowercase string value | `StudentStatus.ACTIVE = 'active'` |
| Env vars | `SCREAMING_SNAKE_CASE` | `NEXT_PUBLIC_API_URL`, `DATABASE_HOST` |

---

## Error Handling

**Backend:** throw a NestJS `HttpException` subclass; `AllExceptionsFilter`
converts it into:
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
Anything that reaches the filter as a plain `Error` (not an `HttpException`)
becomes a 500 with `error: "InternalServerError"` — this is what a bug looks
like in logs, so throwing the right typed exception is how you keep 4xx
noise out of error-rate alerting.

**Frontend:** every `xxxAPI` call site catches, reads
`err.response?.data?.message` (the `message` field above), and renders it in
the page's error banner. Don't `console.error` and swallow — the user needs
to see *something* actionable, even if it's just the backend's message
verbatim.

---

## Security Guidelines

Already enforced — keep it that way when adding new code:

- **Passwords:** bcrypt via `AuthService.hashPassword()` (10 salt rounds).
  Never compare or store a plaintext password.
- **JWT:** short-lived access token + longer-lived refresh token
  (`jwt.expiresIn` / `jwt.refreshExpiresIn` in config). The JWT payload's
  `role` field must be `User.userType` (school_admin/teacher/etc.), **not**
  `User.roleType` (admin/user/viewer) — these are two different enums and
  mixing them up silently breaks every `@Roles()`-guarded endpoint (this
  exact bug existed in `auth.service.ts` and was fixed this cycle).
- **RBAC:** guard new endpoints with `@Roles(...)` matching the least
  privilege that makes sense — check `ROLE_PERMISSIONS` in
  `common/constants/permissions.ts` for what each role is meant to do
  before granting a role access to a new endpoint.
- **Validation:** rely on the global `ValidationPipe` — don't hand-roll
  input sanitization in a controller.
- **SQL injection:** TypeORM parameterizes everything through the
  repository API and `QueryBuilder` — never string-concatenate user input
  into a raw query.
- **Secrets:** never commit `.env`, `.env.local`, or `.env.*.local` — only
  `.env.example` (with placeholder values) is tracked. Double-check `git
  status`/`git diff` before committing anything that touches config.
- **PII:** guardian/parent contact fields (`guardianEmail`, `guardianPhone`)
  and wellbeing data (`counsellor_referrals`, `bullying_incidents`) are
  sensitive — don't add new endpoints that expose them to a role broader
  than what already touches similar data (compare against
  `ROLE_PERMISSIONS.parent` / `.teacher` before deciding).

---

## Git Commit Convention

(Matches `README.md` § Contributing — repeated here since this is now the
canonical coding-standards doc.)

```
feat: add new feature
fix: fix a bug
refactor: code refactoring
docs: documentation only
test: add/modify tests
ci: CI/CD changes
chore: maintenance, dependencies
```

Keep the summary line imperative and under ~72 chars; use the body to
explain *why*, not a restatement of the diff.

---

## Testing Requirements

- **Backend:** Jest, configured in `backend/package.json`'s `"jest"` block
  (`rootDir: src`, `roots: [src, ../test]`, `testRegex: '.*\.spec\.ts$'`) —
  so a spec file is picked up whether it lives under `backend/test/` (all
  three current specs are integration tests here) or colocated next to its
  source file under `backend/src/**` (no colocated specs exist yet, but the
  config supports adding them). Target **70% coverage** on new service
  logic (per `TECH_STACK.md`'s testing framework plan); there is no
  enforced coverage gate in CI yet.
  **Known gap:** the three existing integration specs
  (`test/*.integration.spec.ts`) currently fail to even compile under
  `ts-jest` — `import * as request from 'supertest'` triggers a
  namespace-import TS error under this project's `esModuleInterop`
  settings. This is unrelated to database availability; fix the import
  style (`import request from 'supertest'`) or the `ts-jest` tsconfig
  before relying on these specs in CI.
- **Frontend:** no test runner is configured yet (`TESTING_STRATEGY.md`,
  still pending, will define the Jest + React Testing Library setup).
  Until then, the strict TypeScript build (`npm run build`) is the primary
  automated check — treat a clean `tsc --noEmit` and `next build` as the
  minimum bar for any frontend PR.
- **Before opening a PR:** run `npm run build` in both `backend/` and
  `frontend/` — a change that doesn't compile shouldn't reach review. This
  sounds obvious; it wasn't true of this codebase before this cycle (see
  `ARCHITECTURE_GUIDE.md` § Known Gaps) — treat it as non-negotiable now.
