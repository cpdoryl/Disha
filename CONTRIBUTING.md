# Contributing to Disha

Thank you for your interest in contributing to Disha! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Commit Guidelines](#commit-guidelines)
5. [Pull Request Process](#pull-request-process)
6. [Code Style & Standards](#code-style--standards)
7. [Testing](#testing)
8. [Documentation](#documentation)

---

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please:

- Be respectful and professional
- Welcome diverse perspectives
- Focus on the idea, not the person
- Report inappropriate behavior to maintainers

---

## Getting Started

### Prerequisites

- **Node.js** 20 LTS
- **Python** 3.11
- **Docker** & Docker Compose
- **Git** 2.30+
- **GitHub account** with SSH keys configured

### Setup Development Environment

1. **Fork the repository**

```bash
# Navigate to https://github.com/cpdoryl/Disha
# Click "Fork" button
```

2. **Clone your fork**

```bash
git clone https://github.com/YOUR_USERNAME/Disha.git
cd Disha
git remote add upstream https://github.com/cpdoryl/Disha.git
```

3. **Create development branch**

```bash
git checkout -b feature/your-feature-name
```

4. **Install dependencies**

```bash
# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend/admin && npm install && cd ../..

# Mobile
cd mobile && npm install && cd ..

# Extraction
cd extraction && pip install -r requirements.txt && cd ..
```

5. **Start local services**

```bash
docker-compose up -d
```

6. **Run database migrations**

```bash
cd backend
npm run migration:run
npm run seed:db
cd ..
```

---

## Development Workflow

### 1. Keep Your Fork Updated

```bash
# Fetch latest changes from upstream
git fetch upstream

# Rebase your branch on upstream/develop
git rebase upstream/develop

# Force push to your fork (only on your branches)
git push origin feature/your-feature-name -f
```

### 2. Create Feature Branch

```bash
# Always branch from develop, not main
git checkout develop
git pull upstream develop
git checkout -b feature/DESCRIPTION
```

Branch naming conventions:

- `feature/description` — New feature
- `fix/description` — Bug fix
- `refactor/description` — Code refactoring
- `docs/description` — Documentation
- `test/description` — Test improvements
- `chore/description` — Maintenance tasks

### 3. Develop & Test

```bash
# Make changes to relevant files

# Run linter
npm run lint        # in backend, frontend, or mobile
black .             # in extraction

# Run tests
npm run test:unit
pytest tests/

# Check types
npm run type-check
```

### 4. Commit Changes

Follow conventional commit format:

```bash
git commit -m "type(scope): subject

Detailed description explaining:
- Why this change was needed
- What problem it solves
- Any side effects or breaking changes
"
```

**Types:**
- `feat:` — New feature
- `fix:` — Bug fix
- `refactor:` — Code refactoring
- `docs:` — Documentation
- `test:` — Test changes
- `ci:` — CI/CD changes
- `chore:` — Dependencies, config

**Examples:**
```bash
git commit -m "feat(assessment): add adaptive challenge selection

- Implement challenge menu with 15 categories
- Add assessment routing based on selected challenges
- Add unit tests for challenge selection logic

Closes #123"

git commit -m "fix(api): resolve N+1 query in fee ledger endpoint

- Replace loop-based queries with single JOIN
- Add database index on fee_transactions.school_id
- Performance improvement: 85% faster for 1000+ records

Related to #456"
```

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

---

## Commit Guidelines

### Conventional Commit Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type
- `feat` — A new feature
- `fix` — A bug fix
- `refactor` — Refactoring code
- `perf` — Performance improvement
- `docs` — Documentation
- `test` — Adding/updating tests
- `ci` — CI/CD pipeline changes
- `chore` — Maintenance, dependencies

### Scope (Optional)
- `backend` — Backend API changes
- `frontend` — Admin dashboard changes
- `mobile` — React Native app changes
- `extraction` — Python extraction service changes
- `db` — Database schema/migrations
- `api` — API contract/specification
- `auth` — Authentication/authorization
- `test` — Testing infrastructure

### Subject
- Use imperative, present tense: "add" not "added" or "adds"
- Don't capitalize first letter
- No period at the end
- Limit to 50 characters

### Body
- Explain what and why, not how
- Wrap at 72 characters
- Separate from subject with blank line
- Use bullet points for multiple reasons

### Footer
- Reference related issues: `Closes #123`, `Fixes #456`
- Note any breaking changes: `BREAKING CHANGE: description`
- Mention reviewers: `Reviewed-by: @username`

### Example Full Commit

```
feat(assessment): implement adaptive challenge selection

The assessment now adapts based on selected challenges instead of
asking all questions to every school. This reduces completion time
from 30 minutes to 5-10 minutes.

- Extract challenge menu from DB
- Map challenges to question subsets via mapping table
- Implement filtering in AssessmentService.assembleQuestionnaire()
- Add comprehensive unit tests

Performance: Assessment load time reduced 70% for schools with <5 challenges

Closes #89
Reviewed-by: @codereview
```

---

## Pull Request Process

### Before Submitting PR

1. **Ensure tests pass**

```bash
npm run test:unit
npm run lint
npm run type-check
```

2. **Update documentation**

- Update README if feature changes user-facing behavior
- Update API docs if endpoints changed
- Add/update inline code comments for complex logic

3. **Rebase on latest develop**

```bash
git fetch upstream
git rebase upstream/develop
git push origin feature/your-feature-name -f
```

### Submitting PR

1. **Create Pull Request** via GitHub UI
2. **Use PR template** (auto-populated)
3. **Fill in all sections:**

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issue
Closes #123

## Testing Done
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Screenshots of UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
- [ ] No unrelated changes included
```

### PR Review Process

1. **Automated Checks**
   - GitHub Actions workflows run (lint, test, build)
   - Code coverage maintained (>80%)
   - No merge conflicts
   - Branch is up to date with `develop`

2. **Code Review**
   - Minimum 1 approval required
   - Address all review comments
   - Request changes review after updates

3. **Merge**
   - Only maintainers can merge
   - Squash and merge for feature branches
   - Rebase and merge for refactoring

---

## Code Style & Standards

### Backend (Node.js + TypeScript)

```bash
cd backend

# Format code
npm run format

# Lint
npm run lint

# Type check
npm run type-check
```

**Standards:**
- Use TypeScript strictly (no `any`)
- Prefer immutability with `const`
- Use PascalCase for classes, camelCase for functions
- Max line length: 100 characters
- Use ESLint + Prettier (auto-configured)

**Example:**
```typescript
// Good
export class FeeService {
  async calculateOutstanding(studentId: string): Promise<number> {
    const transactions = await this.feeRepo.findByStudent(studentId);
    return transactions
      .filter(t => t.status === 'overdue')
      .reduce((sum, t) => sum + t.amountDue, 0);
  }
}

// Bad
export class FeeService {
  async calculateOutstanding(studentId: any): Promise<any> {
    let total = 0;
    const trans: any = await this.feeRepo.findByStudent(studentId);
    for (let i = 0; i < trans.length; i++) {
      if (trans[i].status === 'overdue') total += trans[i].amountDue;
    }
    return total;
  }
}
```

### Frontend (React + TypeScript)

```bash
cd frontend/admin

# Format
npm run format

# Lint
npm run lint

# Type check
npm run type-check
```

**Standards:**
- Use functional components with hooks
- Prop destructuring preferred
- Tailwind CSS for styling
- Component file size < 300 lines (split if larger)
- Descriptive file names (PascalCase for components)

### Mobile (React Native)

```bash
cd mobile

# Format
npm run format

# Lint
npm run lint
```

**Standards:**
- Match Android/iOS conventions
- Consistent with backend TypeScript style
- Screen-specific components in separate folders

### Python (FastAPI)

```bash
cd extraction

# Format
black .

# Lint
flake8 . --max-line-length=100

# Type check
mypy . --ignore-missing-imports
```

**Standards:**
- PEP 8 compliant
- Type hints required (Python 3.11 features OK)
- Docstrings for all public functions
- Max line length: 100 characters

---

## Testing

### Backend Tests

```bash
cd backend

# Unit tests only
npm run test:unit

# Integration tests (requires postgres + redis)
npm run test:integration

# All tests with coverage
npm run test:coverage

# Watch mode (re-run on file changes)
npm run test:watch
```

### Frontend Tests

```bash
cd frontend/admin

# Unit tests
npm run test:unit

# E2E tests (Playwright)
npm run test:e2e

# Coverage
npm run test:coverage
```

### Mobile Tests

```bash
cd mobile

# Unit tests
npm run test:unit

# E2E tests (Detox)
npm run test:detox
```

### Extraction Tests

```bash
cd extraction

# All tests
pytest tests/ -v

# With coverage
pytest tests/ --cov=app --cov-report=html

# Specific test file
pytest tests/test_extraction.py
```

### Test Requirements

- **Coverage target:** >80% for new code
- **Unit tests:** All business logic functions
- **Integration tests:** API endpoints, database queries
- **E2E tests:** Critical user flows
- **Tests must pass** before PR can be merged

---

## Documentation

### Code Comments

```typescript
// Bad: Comments state the obvious
const count = 0; // Initialize count to 0

// Good: Comments explain WHY
// Start at 0 because we count new admissions (not transfers)
const newAdmissionCount = 0;
```

### Docstrings

```python
# Good
def calculate_fee_balance(student_id: str) -> float:
    """
    Calculate outstanding fee balance for a student.
    
    Args:
        student_id: UUID of the student
        
    Returns:
        Outstanding balance in INR. 0 if no overdue fees.
        
    Raises:
        StudentNotFound: If student doesn't exist
    """
    pass

# Bad
def calculate_fee_balance(student_id):
    # Calculate fee
    pass
```

### README Updates

Update main `README.md` if:
- Adding new features
- Changing setup instructions
- Adding new environment variables
- Modifying API endpoints

### API Documentation

Keep `docs/api-spec.md` updated:
- New endpoints added
- Parameter changes
- Response format changes
- Authentication requirements

---

## Getting Help

### Questions?

- **GitHub Discussions** — For general questions
- **GitHub Issues** — For bugs and feature requests
- **Slack** — #disha-dev channel (for team members)
- **Email** — support@disha.local

### Still Stuck?

1. Search existing issues/discussions
2. Check documentation in `docs/` folder
3. Look at similar code in the codebase
4. Ask in GitHub Discussions (public help benefits everyone)

---

## Recognition

Contributors are recognized:

- In `CONTRIBUTORS.md` file
- In monthly release notes
- On project website

Thank you for contributing to Disha! 🙏

---

**Last Updated:** 12 July 2026  
**Version:** 1.0
