# Disha - Adaptive School Diagnostic Engine

[![Backend CI](https://github.com/cpdoryl/Disha/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/cpdoryl/Disha/actions/workflows/backend-ci.yml)
[![Frontend CI](https://github.com/cpdoryl/Disha/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/cpdoryl/Disha/actions/workflows/frontend-ci.yml)
[![Mobile CI](https://github.com/cpdoryl/Disha/actions/workflows/mobile-ci.yml/badge.svg)](https://github.com/cpdoryl/Disha/actions/workflows/mobile-ci.yml)
[![Extraction CI](https://github.com/cpdoryl/Disha/actions/workflows/extraction-ci.yml/badge.svg)](https://github.com/cpdoryl/Disha/actions/workflows/extraction-ci.yml)
[![Security & Quality](https://github.com/cpdoryl/Disha/actions/workflows/security-quality.yml/badge.svg)](https://github.com/cpdoryl/Disha/actions/workflows/security-quality.yml)

Challenge-first school diagnostic platform delivering fast, actionable insights before asking for complete data.

## 📋 Project Overview

Disha starts by asking: **"What's worrying you right now?"** instead of a long survey. The owner picks from a menu of real challenges, gets a targeted assessment, and sees specific priorities within minutes — only then offering a deeper health check across all school dimensions.

### Key Features

- **Challenge-First Entry** — Start from what's already on the owner's mind
- **Fast Priority Gaps** — Get 1-3 ranked gaps in one sitting
- **Perception-vs-Data** — Show when owner's belief diverges from actual metrics
- **Competitor Benchmarking** — Evidence-based comparison with nearby schools
- **Multi-Source Data** — Paper records, live operations, digital footprint, stakeholder voice
- **Living Diagnosis** — Continuous re-scoring as data updates

### Quick Links

- 📚 [Product Design Document](./docs/Adaptive_School_Diagnostic_Engine.pdf)
- 🛠️ [Tech Stack Specification](./docs/Tech_Stack_Specification.md)
- 📐 [Architecture Diagram](./docs/architecture.md)
- 🗺️ [Development Roadmap](./docs/roadmap.md)

---

## 🏗️ Project Structure

```
Disha/
├── backend/                    # Node.js + NestJS API
│   ├── src/
│   │   ├── modules/           # 10 domain services
│   │   ├── guards/            # Auth & RBAC
│   │   ├── interceptors/      # Logging, timing
│   │   └── main.ts
│   ├── test/                  # Unit & integration tests
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   └── admin/                 # Next.js admin dashboard
│       ├── app/               # Next.js App Router
│       ├── components/        # React components
│       ├── lib/               # Utilities
│       ├── Dockerfile
│       └── package.json
│
├── mobile/                    # React Native (Android-first)
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── services/
│   │   └── stores/            # Redux Toolkit
│   ├── android/
│   ├── ios/
│   └── package.json
│
├── extraction/                # Python FastAPI (OCR, LLM)
│   ├── app/
│   │   ├── services/
│   │   ├── connectors/
│   │   ├── schemas/
│   │   └── main.py
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
│
├── terraform/                 # Infrastructure as Code
│   ├── main.tf
│   ├── rds.tf
│   ├── elasticache.tf
│   ├── s3.tf
│   └── ecs.tf
│
├── .github/workflows/         # CI/CD Pipelines
│   ├── backend-ci.yml
│   ├── frontend-ci.yml
│   ├── mobile-ci.yml
│   ├── extraction-ci.yml
│   ├── security-quality.yml
│   └── release.yml
│
└── docs/                      # Documentation
    ├── tech-stack.md
    ├── architecture.md
    ├── api-spec.md
    ├── database-schema.md
    └── deployment.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20 LTS
- **Python** 3.11
- **Docker** & Docker Compose
- **PostgreSQL** 15
- **Redis** 7

### Local Development Setup

#### 1. Clone Repository

```bash
git clone https://github.com/cpdoryl/Disha.git
cd Disha
```

#### 2. Start Infrastructure (Docker Compose)

```bash
docker-compose up -d postgres redis
```

#### 3. Backend Setup

```bash
cd backend
npm install
npm run migration:run        # Apply database migrations
npm run seed:db             # Seed test data
npm run start:dev
```

Backend runs on `http://localhost:3000`

#### 4. Frontend Setup

```bash
cd frontend/admin
npm install
npm run dev
```

Admin dashboard runs on `http://localhost:3001`

#### 5. Mobile Setup

```bash
cd mobile
npm install
npm start
```

Then press `a` for Android or `i` for iOS simulator

#### 6. Extraction Service Setup

```bash
cd extraction
python -m venv venv
source venv/bin/activate    # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Extraction service runs on `http://localhost:8000`

---

## 📊 API Documentation

### Key Endpoints

**Owner App**
- `POST /api/v1/challenges/select` — Select challenges
- `POST /api/v1/assessments` — Create adaptive assessment
- `POST /api/v1/responses/submit` — Submit assessment responses
- `GET /api/v1/gaps/priority` — Get priority gap report
- `GET /api/v1/reports/health` — Get full health check report

**Admin Dashboard**
- `GET /api/v1/fee-ledger` — Fee transaction history
- `GET /api/v1/staff` — Staff records
- `GET /api/v1/compliance` — Compliance documents
- `GET /api/v1/communications` — Communication logs

Full API spec: See `docs/api-spec.md`

---

## 🔄 CI/CD Pipeline

### Workflows Included

| Workflow | Trigger | Actions |
|----------|---------|---------|
| **backend-ci.yml** | Push to main/develop | Lint, type-check, test, build, deploy |
| **frontend-ci.yml** | Push to main/develop | Lint, test, build, push image |
| **mobile-ci.yml** | Push to main/develop | Test, build APK/IPA, beta distribution |
| **extraction-ci.yml** | Push to main/develop | Lint, test, security scan, build |
| **security-quality.yml** | All PRs & pushes | Dependency scan, CodeQL, SonarCloud, Docker scan |
| **release.yml** | Tag v* | Build all images, deploy to production |

### GitHub Secrets Required

```
GITHUB_TOKEN            # Auto-generated by GitHub
AWS_ACCESS_KEY_ID       # AWS IAM credentials
AWS_SECRET_ACCESS_KEY
SONARCLOUD_TOKEN        # SonarCloud analysis
SLACK_WEBHOOK           # Slack notifications (optional)
```

### Deployment Strategy

- **develop branch** → Staging environment (manual approval)
- **main branch + tag (v*)** → Production (manual approval)

---

## 📦 Deployment

### Using Terraform

```bash
cd terraform
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

Creates:
- PostgreSQL RDS (15, ap-south-1)
- Redis ElastiCache
- S3 buckets (encrypted)
- ECS cluster
- ALB & security groups

### Using Docker Compose (Local/Staging)

```bash
docker-compose up -d
```

See `docker-compose.yml` for full stack (postgres, redis, backend, frontend, extraction)

### Manual Deployment to AWS ECS

```bash
# Build images
docker build -t disha-api:latest ./backend
docker build -t disha-admin:latest ./frontend/admin
docker build -t disha-extraction:latest ./extraction

# Push to ECR
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com
docker tag disha-api:latest <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/disha-api:latest
docker push <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/disha-api:latest

# Update ECS service
aws ecs update-service --cluster disha-prod --service disha-api --force-new-deployment --region ap-south-1
```

---

## 🧪 Testing

### Backend

```bash
cd backend
npm run test:unit           # Unit tests
npm run test:integration    # Integration tests
npm run test:e2e           # End-to-end (API)
npm run test:coverage      # Coverage report
```

### Frontend

```bash
cd frontend/admin
npm run test:unit
npm run test:coverage
```

### Mobile

```bash
cd mobile
npm run test:unit
npm run test:detox        # E2E for React Native
```

### Extraction Service

```bash
cd extraction
pytest tests/ -v
pytest tests/ --cov=app   # Coverage
```

---

## 🔐 Security

- **Data Encryption** — TLS 1.3 in transit, AES-256 at rest (AWS KMS)
- **Authentication** — JWT with 15-min access token, 7-day refresh token
- **DPDP Act 2023** — Explicit consent capture, data deletion on request
- **RBAC** — Role-based access per endpoint (owner, teacher, parent, admin, counselor)
- **Input Validation** — Pydantic + class-validator on all API boundaries
- **Secret Management** — AWS Secrets Manager for credentials
- **Dependency Scanning** — npm audit, Safety (Python), Trivy (Docker images)
- **Code Analysis** — CodeQL + SonarCloud on every PR

### Sensitive Data Handling

- Student wellbeing responses: Restricted to counselor role only, no aggregation
- Phone numbers, emails: Encrypted at rest
- Payment data: Tokenized via Razorpay, never stored
- Access logs: Masked PII, sent to CloudWatch

---

## 📖 Documentation

- [Tech Stack Specification](./docs/Tech_Stack_Specification.md) — Detailed tech choices
- [Architecture Guide](./docs/architecture.md) — System design
- [Database Schema](./docs/database-schema.md) — Entity relationships
- [API Reference](./docs/api-spec.md) — Endpoint documentation
- [Deployment Guide](./docs/deployment.md) — Production runbook
- [DPDP Compliance](./docs/compliance.md) — Privacy & data handling

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create feature branch** — `git checkout -b feature/your-feature`
3. **Commit with conventional messages** — `git commit -m "feat: add new feature"`
4. **Push to branch** — `git push origin feature/your-feature`
5. **Open Pull Request** — against `develop` branch

### Commit Message Convention

```
feat: add new feature
fix: fix a bug
refactor: code refactoring
docs: documentation only
test: add/modify tests
ci: CI/CD changes
chore: maintenance, dependencies
```

### Code Style

- **Backend:** NestJS conventions, ESLint, Prettier
- **Frontend:** React/Next.js best practices, Tailwind CSS
- **Mobile:** React Native style guide
- **Python:** PEP 8, Black formatter

---

## 🐛 Reporting Issues

Found a bug? Open an issue with:

1. **Title** — Clear, concise summary
2. **Description** — What happened, expected behavior
3. **Steps to reproduce** — How to trigger the issue
4. **Environment** — OS, browser, Node/Python version
5. **Screenshots/logs** — Error messages, stack traces

---

## 📋 Roadmap

### Phase 1 (Weeks 1-10)
- ✅ Challenge menu & adaptive assessment
- ✅ Document extraction (OCR + LLM)
- ✅ Priority gap report
- ✅ Owner mobile app

### Phase 2 (Weeks 11-20)
- 🔄 Teacher/Parent apps
- 🔄 WhatsApp bot integration
- 🔄 Website crawler
- 🔄 Admin dashboard

### Phase 3 (Weeks 21-30)
- 🔲 Social media & YouTube connectors
- 🔲 Competitor benchmarking
- 🔲 Full 12-lens health report
- 🔲 Student assessments

### Phase 4 (Weeks 31-38)
- 🔲 Continuous re-diagnosis loop
- 🔲 Threshold-based alerts
- 🔲 Scale to 100+ schools
- 🔲 Production hardening

---

## 📞 Support

- **Documentation** → `docs/` folder
- **Issues** → GitHub Issues
- **Email** → support@disha.local
- **Slack** → #disha-support (internal team)

---

## 📄 License

This project is licensed under the MIT License — see `LICENSE` file.

---

## 🙏 Acknowledgments

Built with:
- [NestJS](https://nestjs.com/) — Backend framework
- [Next.js](https://nextjs.org/) — Web framework
- [React Native](https://reactnative.dev/) — Mobile framework
- [FastAPI](https://fastapi.tiangolo.com/) — Python API
- [PostgreSQL](https://www.postgresql.org/) — Database
- [Anthropic Claude](https://www.anthropic.com/) — AI/LLM
- [AWS](https://aws.amazon.com/) — Cloud infrastructure

---

**Last Updated:** 12 July 2026  
**Version:** 1.0.0  
**Status:** Development Phase 1
