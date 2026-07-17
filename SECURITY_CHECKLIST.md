# Disha v2.0 - Security Checklist

**Status:** COMPLETE | **Owner:** Security Lead | **Last Updated:** 2026-07-17
**Companion docs:** [CODING_STANDARDS.md](./CODING_STANDARDS.md) § Security Guidelines · [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) · [ARCHITECTURE_GUIDE.md](./ARCHITECTURE_GUIDE.md)

This is a checklist against what's actually implemented and verified —
each item says what's true today, not what's aspirational. Several items
below are fixes made during this documentation pass, cross-referenced to
where the fix and its verification live.

---

## 📋 Table of Contents

1. [Authentication & Session Security](#authentication--session-security)
2. [Authorization (RBAC)](#authorization-rbac)
3. [Input Validation](#input-validation)
4. [Data Encryption](#data-encryption)
5. [OWASP Top 10 Walkthrough](#owasp-top-10-walkthrough)
6. [Rate Limiting](#rate-limiting)
7. [Secrets Management](#secrets-management)
8. [Dependency & Container Scanning](#dependency--container-scanning)
9. [DPDP / Privacy Compliance](#dpdp--privacy-compliance)
10. [Pre-Production Security Checklist](#pre-production-security-checklist)

---

## Authentication & Session Security

- ✅ Passwords hashed with bcrypt, 10 salt rounds (`AuthService.hashPassword`)
- ✅ JWT access token (default 15min, `JWT_EXPIRES_IN`) + longer refresh
  token (`JWT_REFRESH_EXPIRES_IN`) — short-lived access tokens limit the
  blast radius of a leaked one
- ✅ **Fixed this pass:** login response's `expiresIn` field was silently
  wrong (`parseInt("15m")` → `15`, not 900) — a client trusting that field
  to schedule its own refresh would have refreshed almost immediately.
  Fixed to decode the actual signed token's `exp`/`iat`. See
  `TESTING_STRATEGY.md` bug #12.
- ⚠️ **No MFA.** `TECH_STACK.md`'s pending stack lists TOTP as planned;
  not implemented anywhere in the codebase today.
- ⚠️ **No account lockout after repeated failed logins.** `STRICT_RATE_LIMIT`
  (5 requests/15min, IP-based) is *defined* in
  `common/config/rate-limits.config.ts` for exactly this purpose but — see
  § Rate Limiting below — never actually applied to any route.

---

## Authorization (RBAC)

- ✅ Every non-public route requires `JwtAuthGuard` + `RolesGuard`, with
  `@Roles(...)` declaring the allowed `userType` values
- 🔴 **Fixed this pass — was a real authorization bypass in production
  code, not just a test gap.** `RolesGuard` read `@Roles()` metadata from
  `context.getHandler()` only, never `context.getClass()`. Four
  controllers (`AuditController`, `WellbeingController`, `DataController`,
  `NotificationController`) declare `@Roles(...)` once at the **class**
  level as a shortcut — for every route in those four controllers, the
  guard found no required roles and let **any authenticated user through
  regardless of role**. A `student` or `parent` token could hit audit
  logs, wellbeing dashboards (student mental-health/counselling data —
  see `DATABASE_SCHEMA.md`'s `counsellor_referrals`/`bullying_incidents`
  tables), and operational data endpoints meant to be
  `ryl_admin`/`school_admin`/`teacher`-only. Fixed via
  `reflector.getAllAndOverride`, verified by the RBAC integration suite
  (`TEST_CASES.md` § Covered: RBAC Matrix) going from silently-passing
  (wrongly) to correctly enforcing role checks. **If this code has ever
  run against real user data, audit access logs for the affected
  endpoints from any role other than the intended ones.**
- ⚠️ **Cross-school (tenant) isolation is never checked at the guard
  level** — `RolesGuard` verifies *role*, not that the caller's
  `schoolId` matches the resource being accessed. A `school_admin` or
  `teacher` token for School A is not currently prevented from querying
  School B's data by path parameter alone, at the framework level;
  whether individual services filter correctly by the caller's own
  `schoolId` (vs. trusting a client-supplied `schoolId` in the request)
  needs an endpoint-by-endpoint audit. Flagged as an untested edge case
  in `TEST_CASES.md` § Gaps: Edge Cases Worth Adding — treat this as the
  single highest-priority gap to close before handling data from
  multiple real schools in production.
- ⚠️ `PermissionsGuard` + the fine-grained `Permission` enum
  (`common/constants/permissions.ts`) are fully built but never attached
  via `@RequirePermissions()` anywhere — only the coarser role check is
  actually enforced. Not a vulnerability by itself, but means the
  more granular access model that `ROLE_PERMISSIONS` describes isn't
  real yet.

---

## Input Validation

- ✅ Global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true,
  transform: true })` — strips/rejects any field not declared on a DTO
- 🔴 **Several controllers accept `@Body() dto: any`** (`student`, `school`,
  `staff`) — bypassing the `ValidationPipe`'s protection entirely for
  those endpoints, since there's no DTO class to validate against. This
  is the root cause behind bug #8 in `TESTING_STRATEGY.md` (malformed
  input reaching Postgres raw and crashing as an unhandled 500). Tracked
  as debt in `CODING_STANDARDS.md`; migrate these to real DTOs rather
  than adding more `any`-typed bodies.
- ✅ **Fixed this pass, as a stopgap** for the above: `AllExceptionsFilter`
  now maps common Postgres error codes (`22P02` invalid input,
  `23502`/`23503` constraint violations, `23505` unique violation) to
  clean 4xx responses instead of leaking a raw driver error as a 500.
  This is a safety net, not a substitute for real DTOs — it only catches
  errors that reach Postgres, not e.g. a silently-defaulted missing field.
- ✅ TypeORM's repository API and `QueryBuilder` parameterize all queries
  — no raw string-concatenated SQL found anywhere in `backend/src`.

---

## Data Encryption

- ✅ HTTPS/TLS termination at Nginx (Let's Encrypt, per
  `DEPLOYMENT_GUIDE.md` § Step 5) — `ssl_protocols TLSv1.2 TLSv1.3`,
  modern cipher suite, HSTS header (`nginx.conf`, fixed this pass — see
  `INFRASTRUCTURE_SETUP.md`)
- ✅ Security headers via `helmet()` (default config, `main.ts`) — CSP,
  `X-Content-Type-Options`, `X-Frame-Options`, etc., confirmed present on
  real responses during this pass's testing (`curl -i` output showed the
  full header set)
- ⚠️ **No column-level encryption at rest** for sensitive fields
  (`guardianPhone`, `guardianEmail` on `students`; wellbeing/counselling
  data). README's security section claims "Phone numbers, emails:
  Encrypted at rest" — not found anywhere in the actual entity/migration
  code. Whatever encryption exists is at the disk/volume level (a
  managed Postgres provider's default), not application-level column
  encryption. Correct this claim wherever it's repeated, or implement it.
- ✅ `passwordHash` never returned in API responses — `AuthService.login()`
  explicitly builds a narrow `user: {...}` object rather than returning
  the raw `User` entity (verified by reading the code, not just the DTO
  type).

---

## OWASP Top 10 Walkthrough

| Risk | Status | Notes |
|---|---|---|
| Injection | ✅ Mitigated | TypeORM parameterization throughout |
| Broken Authentication | ⚠️ Partial | JWT solid; no MFA, no lockout (rate limit built but unused — see below) |
| Broken Access Control | 🔴 Was broken, now fixed | See § Authorization above — the class-level `@Roles()` bypass was a real instance of this OWASP category, not hypothetical |
| Cryptographic Failures | ⚠️ Partial | TLS + bcrypt solid; column-level encryption claim in README doesn't match reality |
| Security Misconfiguration | 🔴 Multiple found, fixed | `database.synchronize` hardcoded `true` regardless of environment (see below); several infra config files had copy-paste artifacts (`INFRASTRUCTURE_SETUP.md`) |
| Vulnerable Components | ⚠️ Not verified this pass | `npm audit` not run as part of this session — see § Dependency Scanning |
| Identification & Auth Failures | ⚠️ Partial | Same as Broken Authentication row |
| Software & Data Integrity | ⚠️ Not assessed | CI/CD pipelines fixed to actually run (`TESTING_STRATEGY.md`), but no artifact signing or SBOM generation exists |
| Logging & Monitoring Failures | 🔴 Was broken, now fixed | `/metrics` never existed until this pass (`MONITORING_SETUP.md`); health checks gave false signals (same doc) |
| SSRF | ✅ N/A | No server-side request forgery surface identified — app doesn't fetch arbitrary user-supplied URLs |

**`database.synchronize` hardcoded to `true`**, found and fixed this pass
(`TESTING_STRATEGY.md` bug #13): regardless of environment or the
`DB_SYNCHRONIZE` env var `.env.example` already documented, TypeORM was
silently auto-altering the live database schema from the current entity
definitions on every single app boot — in every environment, including a
hypothetical production deploy. This is a security-relevant misconfiguration
independent of the schema-drift bug it happened to mask: an
auto-schema-sync feature running unconditionally in production is a real
risk (unexpected schema changes on deploy, potential data loss on a
column type change, no review gate). Fixed to require `DB_SYNCHRONIZE=true`
explicitly, defaulting to `false`.

---

## Rate Limiting

**Built, not enabled.** `common/guards/rate-limit.guard.ts` implements a
working token-bucket limiter, and `common/config/rate-limits.config.ts`
defines sensible tiers (`STRICT_RATE_LIMIT`: 5 req/15min for auth
endpoints; `MODERATE_RATE_LIMIT`: 100 req/15min general; `RELAXED_RATE_LIMIT`:
1000 req/hour for trusted/internal use) — but `RateLimitGuard` is not
attached via `@UseGuards()` on any controller in the current codebase.
Verified by searching for every usage: none found outside the guard's own
definition file.

**Before this goes live:** attach `STRICT_RATE_LIMIT` to
`POST /api/v2/auth/login` at minimum — right now nothing prevents a
credential-stuffing attempt at any rate the attacker's infrastructure can
sustain. The public, unauthenticated
`POST /api/v2/assessments/:id/submit` endpoint (see `API_DOCUMENTATION.md`)
is the next highest priority — it's designed to be publicly reachable by
survey respondents, which also makes it the easiest endpoint to abuse for
junk data or a denial-of-service attempt without any rate limiting.

---

## Secrets Management

- ✅ `.env`, `.env.local`, `.env.*.local`, `.env.production` are all
  gitignored (verified: `git check-ignore` confirms `backend/.env.local`
  is correctly excluded) — only `.env.example` files (placeholder values)
  are tracked
- ✅ `JWT_SECRET` generation documented (`DEPLOYMENT_GUIDE.md` § 3.3, uses
  a cryptographically random string, not a guessable default)
- ⚠️ Default `JWT_SECRET` in `configuration.ts`
  (`'dev-secret-key-change-in-production'`) is a real fallback if the env
  var is ever unset — safe for local dev, but there's no startup check
  that refuses to boot with this default in a non-development
  `NODE_ENV`. Consider adding one.
- ⚠️ No secrets manager (AWS Secrets Manager, Vault) integration exists —
  `DEPLOYMENT_GUIDE.md`'s `.env.production` file is the only mechanism
  described. Acceptable for the pilot's single-server scale; revisit
  before multi-instance/multi-region deployment.
- ✅ Verified every tracked `.env*` file in the repo (`git ls-files`):
  `.env.example`, `.env.staging`, `backend/.env.example`,
  `backend/.env.test`, `frontend/.env.example` — all contain only
  placeholder or explicitly-test-only values (e.g. `.env.staging`'s own
  header says "copy this to `.env.staging.local`", which *is* gitignored,
  and its committed values are literally named `staging_password_change_me`
  / `admin_change_me`). No real secret found committed anywhere in the
  repo's tracked files.

---

## Dependency & Container Scanning

- `.github/workflows/security-quality.yml` exists (per `README.md`'s
  badges) — **not verified working in this pass**, the way
  `backend-ci.yml`/`frontend-ci.yml`/`deploy.yml` were found broken and
  fixed (see `TESTING_STRATEGY.md`/`INFRASTRUCTURE_SETUP.md`). Given the
  hit rate found in every other CI/infra file touched this session,
  **do not assume this one works without checking it the same way** —
  it's flagged here specifically so it isn't skipped.
- `deploy.yml`'s `security-scan` job (Trivy container scan + `npm audit
  --production`) is real and was reviewed while fixing that file's other
  bugs (`INFRASTRUCTURE_SETUP.md`) — its own logic looked correct, unlike
  the steps around it.
- Renovate is configured (`renovate.json` at repo root) for automated
  dependency update PRs — not verified to have an active bot connection
  in this pass.

---

## DPDP / Privacy Compliance

`README.md` claims "Student wellbeing responses: Restricted to counselor
role only, no aggregation" and "DPDP Act 2023 — Explicit consent capture,
data deletion on request." Checked against the actual code:

- ⚠️ **Wellbeing data is not restricted to a counsellor role** —
  `WellbeingController` requires `ryl_admin, school_admin, teacher` (see
  `API_DOCUMENTATION.md`), and there is no separate `counsellor` value in
  the `UserType` enum at all (`User.entity.ts`) — a teacher can access
  the same wellbeing endpoints a counsellor would. `Staff.position` does
  have a `counsellor` enum value, but that's an HR record, not a login
  role tied to RBAC. This README claim does not match the implemented
  access model — correct the claim or implement the restriction.
- ⚠️ **No explicit consent-capture flow found** anywhere in the entities
  or controllers searched this pass.
- ⚠️ **No data-deletion-on-request endpoint** exists (no `DELETE` routes
  for `Student`/`User` found in `API_DOCUMENTATION.md`'s full endpoint
  inventory — only status changes via `PATCH .../status`, which sets
  `withdrawn`/`transferred`/`graduated`, not deletion).
- ✅ `DataRetentionPolicy` entity exists (`DATABASE_SCHEMA.md`) with
  `dataClassification`/`retentionPeriod`/`retentionAction` fields — a
  real, if unused-by-any-controller, foundation for retention policy
  enforcement once the `compliance` module (currently an empty stub —
  `ARCHITECTURE_GUIDE.md`) is built out.

**Recommendation:** treat every DPDP/privacy claim in `README.md` and
`TECH_STACK.md` as unverified until checked against real code the way
this pass checked the wellbeing-access claim — several didn't hold up.

---

## Pre-Production Security Checklist

Concrete, ordered by what this pass found to be actually missing:

- [ ] Attach `RateLimitGuard` to `POST /api/v2/auth/login` and the public
      `POST /api/v2/assessments/:id/submit` (see § Rate Limiting)
- [ ] Verify `.github/workflows/security-quality.yml` actually runs and
      passes — don't assume it, check it (see § Dependency Scanning)
- [ ] Audit cross-school tenant isolation endpoint-by-endpoint (see
      § Authorization) — the single highest-priority gap for multi-school
      production use
- [ ] Correct or implement the DPDP/wellbeing-access claims in `README.md`
      to match reality (see § DPDP / Privacy Compliance)
- [ ] Migrate `any`-typed controller bodies (`student`, `school`, `staff`)
      to real `class-validator` DTOs (see § Input Validation,
      `CODING_STANDARDS.md`)
- [ ] Add a startup check that refuses to boot with the default
      `JWT_SECRET` outside `NODE_ENV=development` (see § Secrets Management)
- [ ] Confirm `DB_SYNCHRONIZE` is unset (defaults `false`) in every
      non-local environment — verify this explicitly in deployment
      scripts/CI, don't rely on the code default alone given how long the
      previous hardcoded-`true` bug went unnoticed
- [ ] Enable the off-box backup upload step before treating backups as a
      real disaster-recovery mechanism (see `BACKUP_RECOVERY.md`)
