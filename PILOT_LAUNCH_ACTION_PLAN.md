# Disha v2.0 - Pilot Launch Action Plan

**Status:** Ready for Execution | **Updated:** 2026-07-18  
**Next Phase:** Immediate Execution (Weeks 8-9)  
**Pilot Launch Target:** End of Week 9

---

## 🎯 Executive Summary

All 4 critical launch blockers have been resolved ✅:
- Rate limiting on auth endpoints (verified live)
- Cross-school tenant isolation (verified live)
- Security CI workflows (all 6 jobs fixed)
- Pilot scope narrowed to school_admin/teacher only

**You are ready to begin pilot launch planning immediately.** This document synthesizes the go/no-go gates and breaks them into executable phases.

---

## 📊 Current Status: All Green Lights

### ✅ Resolved Blockers

| Blocker | Status | Evidence | Owner |
|---------|--------|----------|-------|
| **Rate Limiting** | FIXED | Verified live - 429 responses on limit exceeded | Backend (auth-service) |
| **Tenant Isolation** | FIXED | SchoolScopeGuard on 24 routes, 79/79 tests pass | Backend (security) |
| **CI/CD Security** | FIXED | All 6 jobs in security-quality.yml verified & working | DevOps/CI |
| **Pilot Role Scope** | RESOLVED | Narrowed to school_admin/teacher (no student/parent yet) | Product |

### 🟡 Lower Priority (Don't Block Launch)

- Off-box backup upload (optional but recommended)
- Unauthenticated endpoint rate limiting (POST /assessments/:id/submit)
- Resource-owner lookup for :id-based endpoints
- SonarCloud integration (no config exists yet)

---

## 📋 PHASE 1: Pre-Launch Verification (Days 1-3)

### 1.1 Build & Deployment Verification

**Checklist items to verify:**

```bash
# ✅ Verify production builds succeed
cd backend && npm run build
cd ../frontend && npm run build

# ✅ Test database migrations on fresh database
npm run migration:run

# ✅ Verify SSL certificate and HSTS headers
# (Check nginx.conf - FIXED in this pass)
grep "ssl_certificate" nginx.conf
grep "add_header Strict-Transport-Security" nginx.conf
```

**Success criteria:**
- Both backend and frontend builds complete without errors
- Migration script runs against a fresh database
- SSL certificate is valid and won't expire during pilot (Days 1-21)
- `DB_SYNCHRONIZE` is explicitly set to `false` in deployed environment

**Owner:** DevOps  
**Effort:** 2-3 hours  
**Timeline:** Before deployment (Day -1)

---

### 1.2 Testing & QA Verification

**Must pass before deployment:**

```bash
# ✅ Run full integration suite
npx jest --coverage

# ✅ Load test real authenticated endpoints
bash scripts/load-test-business.sh

# ✅ Manual verification of core workflows
# Login as school_admin → add student → mark attendance
# Login as teacher → create assessment → mark attendance
```

**Success criteria:**
- 76/76 integration tests pass against production database
- Load test baseline established (~400 req/s realistic ceiling)
- Both role workflows complete without errors

**Owner:** QA  
**Effort:** 3-4 hours  
**Timeline:** Before deployment (Day -1)

---

### 1.3 Monitoring & Health Check Verification

**Deploy-time verification:**

```bash
# ✅ Verify health endpoint after deployment
curl https://disha.yourdomain.com/health
# Should return: {"status":"ok","timestamp":"..."}

# ✅ Verify Prometheus metrics endpoint
curl https://disha.yourdomain.com/metrics | head -20
# Should return Prometheus-format metrics

# ✅ Verify Grafana dashboards are up
# Access: https://disha.yourdomain.com:3000 (internal network only)
```

**Success criteria:**
- `/health` returns `"ok"` status
- Prometheus scrape target shows UP
- Grafana dashboards accessible from internal network
- Memory health check passes (bug fixed in this pass)

**Owner:** DevOps/Monitoring  
**Effort:** 1-2 hours  
**Timeline:** Immediately after deployment

---

### 1.4 Backup & Disaster Recovery Verification

**Before Day 1 of pilot:**

```bash
# ✅ Confirm backup cron is installed and has run once
sudo crontab -l | grep backup
# Check for recent backup file in /backups or cloud storage

# ✅ Test restore procedure
# Follow BACKUP_RECOVERY.md § Testing Backup Restoration
# Use your real deployed instance's backup (not just local test)
```

**Success criteria:**
- Backup job has run and created at least one backup file
- Restore procedure succeeds with real backup
- RPO (Recovery Point Objective): 24 hours
- RTO (Recovery Time Objective): 30-60 minutes

**Owner:** DevOps/Database  
**Effort:** 2-3 hours  
**Timeline:** Before pilot Day 1

---

## 📚 PHASE 2: Team Training (Days 4-7)

### 2.1 Internal Support Staff Training (Day 4)

**Timeline:** 1 day (4-5 hours)

**Module 3: Platform Admin Overview (20 min)**
- Demonstrate what `ryl_admin` can currently do
- Show API-only school creation (`POST /api/v2/schools`)
- Set expectations: placeholder dashboards today, real features coming

**Module 1: School Admin Deep Dive (90 min)**
- Navigate login flow
- Add student workflow
- Add staff workflow
- Mark attendance
- Read Reports page (identify real vs. fallback data)

**Module 2: Teacher Deep Dive (60 min)**
- Navigate sidebar differences
- View classes (read-only)
- Create assessment cycle (diagnostic, not gradebook)
- Mark attendance

**Resources:**
- `ADMIN_GUIDE.md` (School Admin section)
- `USER_GUIDES.md` (Teacher section)
- Local seeded database with 4 test schools

**Owner:** Training Coordinator  
**Participants:** 3-5 internal support staff  
**Assessment:** Each trainer completes all workflows unassisted

---

### 2.2 Pilot User Training (Days 5-7, per school)

**Timeline:** 1 day per school cluster (4-5 hours per session)

**For each pilot school:**

**Session 1 - School Admins (60 min)**
- Live login with their real credentials (not demo seeds)
- Student roster walkthrough
- Add a student (form validation, required fields)
- Add a staff member
- Bulk mark attendance for a class
- Reports page navigation

**Session 2 - Teachers (45 min)**
- Login and sidebar navigation
- View their assigned classes
- Create a diagnostic assessment cycle
- Mark attendance

**Materials needed:**
- Screenshots from production (with pilot school names/logos)
- Quick-start card (one-page reference)
- Support contact info for after training

**Resources:**
- `ADMIN_GUIDE.md` (tailored with pilot school data)
- `USER_GUIDES.md` (tailored with pilot school data)
- Seeded pilot database with their real schools and students

**Owner:** Training Coordinator  
**Participants:** 50-100 total pilot users (school_admin + teacher roles)  
**Assessment:** Each trainee successfully adds a student, marks attendance, views reports

---

## 🚀 PHASE 3: Production Deployment (Day 8)

### 3.1 Pre-Deployment Checklist (T-1 Day)

**Final verification before going live:**

- [ ] All Pre-Launch Verification items complete (§1.1-1.4)
- [ ] Team training complete for all support staff
- [ ] Pilot user training complete for first cohort
- [ ] Demo/seed credentials (admin1@school.edu/admin123) rotated or disabled
- [ ] Real pilot school data loaded
- [ ] On-call support schedule confirmed
- [ ] Monitoring dashboards pre-configured with pilot-specific alerts
- [ ] Communication channels live (Slack/Discord support channel)

**Owner:** Project Manager + Tech Lead

---

### 3.2 Deployment Steps

**Follow DEPLOYMENT_GUIDE.md exactly:**

```
1. Merge all pending PRs to main
2. Tag release (v2.0.0-pilot.1)
3. Build Docker images
4. Push to registry
5. Deploy to DigitalOcean (docker-compose up -d)
6. Run database migrations
7. Verify health endpoints
8. Update DNS records
9. Enable SSL certificate
10. Configure Nginx upstream servers
11. Verify monitoring scrape targets
```

**Rollback Plan:**
- Keep previous known-good image tagged and available
- If deployment fails: revert to previous image within 15 minutes
- If data corruption: restore from backup per BACKUP_RECOVERY.md

**Owner:** DevOps  
**Effort:** 2-3 hours  
**Timeline:** Early morning (off-peak) recommended

---

### 3.3 Launch Day Operations (Day 9)

**08:00 - Team Standby**
- All support staff online
- Monitoring dashboards live
- On-call rotation active

**09:00 - Send Welcome Emails**
- Real login credentials (NOT demo seeds)
- Quick-start guide pointer
- Support channel contact info
- Tone: warm, welcome the first real users

**09:00-17:00 - Continuous Monitoring**
- Check `/health` endpoint every 15 minutes
- Monitor error logs in real-time
- Watch Prometheus for baseline metrics
- Respond to support questions in dedicated channel
- Note: This is first real traffic the system will see

**Throughout Day - Support Channel Activity**
- Expected: login questions, basic "how do I?" queries
- Unexpected: 500 errors, database errors, authentication failures (escalate immediately)

**Milestone Updates:**
- 10:00 AM: "First users logging in"
- 12:00 PM: "Midday usage report"
- 17:00 PM: "First day complete - no P0 incidents"

---

## 📈 PHASE 4: Pilot Monitoring (Days 10-21)

### 4.1 Daily Operations (Days 3-21)

**Daily standups (10 min):**
- Any overnight errors in logs?
- `/health` status trend
- User activity baseline
- Known issues emerging?

**Three times per week:**
- Prometheus dashboard review
- Backup completion verification
- Support ticket categorization

**Weekly (Friday):**
- Full metrics review
- Pilot user satisfaction pulse check
- Compare actual issues vs. known issues doc (SUPPORT_PROCEDURES.md)
- Update tracking as needed

---

### 4.2 Success Criteria During Pilot

**Technical** (must maintain):
- `/health` returns `"ok"` for >99% of pilot period
- No P0 incidents per SUPPORT_PROCEDURES.md severity definitions
- API response time <200ms (p95)

**Functional** (must achieve):
- 100% of trained school_admin/teacher users successfully complete onboarding tasks unassisted
- Attendance marking works for full class sizes
- Reports page data loads within 5 seconds

**Adoption** (monitor):
- % of trained users logging in within first 3 days
- % completing at least one full workflow per role
- NPS/satisfaction rating >4.0/5.0 (informal survey)

---

## 📞 Support & Escalation

**During Pilot (Days 1-21):**

**Tier 1 (Immediate):**
- Support channel responder answers questions within 15 minutes
- "How do I add a student?" → point to USER_GUIDES.md or do a screenshot walkthrough

**Tier 2 (1-2 hours):**
- Tech lead investigates bugs
- "I'm getting a 500 error" → check logs, identify root cause

**Tier 3 (4 hours):**
- Architect/DevOps involved
- "Reports won't load and /health shows degraded" → full system review

**P0 Escalation (CEO/CTO):**
- Data loss or corruption
- Complete system outage >30 minutes
- Security incident

See SUPPORT_PROCEDURES.md for full procedure details.

---

## ✅ Done Criteria: Ready for Next Phase

After Week 9 pilot closes, you're ready to scale if:

1. **Technical:** No P0 incidents, >99% health uptime
2. **Functional:** All trained users completed unassisted workflows
3. **Data:** Backup/restore tested successfully with real data
4. **Feedback:** Support tickets analyzed, patterns documented
5. **Blockers:** Decide: are the lower-priority items worth fixing before next phase?

---

## 📊 Effort Summary

| Phase | Task | Hours | Owner | Timeline |
|-------|------|-------|-------|----------|
| **1: Pre-Launch** | Build & deploy verification | 2-3h | DevOps | Day -1 |
| | Testing & QA | 3-4h | QA | Day -1 |
| | Monitoring setup | 1-2h | DevOps | Day -1 |
| | Backup verification | 2-3h | DevOps | Day -1 |
| **2: Training** | Support staff (Module 1-3) | 4-5h | Trainer | Day 4 |
| | Pilot users (per school) | 4-5h × 3-5 schools | Trainer | Days 5-7 |
| **3: Deployment** | Pre-deployment checklist | 2h | PM | Day -1 |
| | Deployment execution | 2-3h | DevOps | Day 8 |
| | Launch day monitoring | 8h | On-call team | Day 9 |
| **4: Pilot Ops** | Daily standups | 0.5h × 21 days | Support | Days 10-30 |
| | Weekly reviews | 2h × 3 weeks | Tech lead | Weekly |
| **TOTAL** | | **~50-60 hours** | Cross-functional | 3 weeks |

---

## 🎬 Start Here: Immediate Actions

**Today (Friday):**
- [ ] Review this plan with project stakeholder
- [ ] Confirm pilot schools selected (3-5 schools, 50-100 users)
- [ ] Verify DigitalOcean droplet provisioned and ready
- [ ] Confirm on-call rotation for Week 9

**Next week (Monday):**
- [ ] Start pre-deployment verification checklist (§1.1-1.4)
- [ ] Schedule support staff training (§2.1)
- [ ] Collect pilot school rosters and admin emails

**Mid-week:**
- [ ] Complete pre-deployment verification
- [ ] Run support staff training
- [ ] Load pilot data into staging environment

**Late week (Day -1):**
- [ ] Final go/no-go decision
- [ ] Deployment execution
- [ ] Health endpoint verification

**Week 9 (Pilot launch):**
- [ ] Send welcome emails at 09:00
- [ ] Monitor throughout the day
- [ ] Celebrate: first real users on your system! 🎉

---

## 📖 Reference Documents

- **LAUNCH_CHECKLIST.md** — Go/no-go gate (all items cleared ✅)
- **DEPLOYMENT_GUIDE.md** — Step-by-step production deployment
- **TRAINING_PLAN.md** — Trainer preparation and module scripts
- **ADMIN_GUIDE.md** — School admin onboarding walkthrough
- **USER_GUIDES.md** — Teacher guide and common tasks
- **OPERATIONS_RUNBOOK.md** — Day-to-day pilot operations
- **MONITORING_SETUP.md** — Prometheus/Grafana configuration
- **SUPPORT_PROCEDURES.md** — Escalation and incident response

---

**Next step:** Review this plan with your pilot stakeholder, confirm school list and deployment target, and begin § PHASE 1 verification.
