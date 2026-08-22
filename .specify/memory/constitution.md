<!--
================================================================================
SYNC IMPACT REPORT
================================================================================
Version change: 0.0.0 → 1.0.0 (initial constitution)

Modified principles: N/A (initial version)

Added sections:
- Core Principles (5 principles)
- Technical Standards
- Development Workflow
- Governance

Removed sections: N/A (initial version)

Templates requiring updates:
- ✅ .specify/templates/plan-template.md (no updates required - generic structure)
- ✅ .specify/templates/spec-template.md (no updates required - generic structure)
- ✅ .specify/templates/tasks-template.md (no updates required - generic structure)
- ✅ .specify/templates/checklist-template.md (no updates required - generic structure)

Follow-up TODOs: None

================================================================================
-->

# ImmoFacile Constitution

## Core Principles

### I. User-First French Localization

All user-facing content, interfaces, and documentation MUST be in French. This includes:
- UI labels, messages, and notifications
- Email templates and PDF receipts ("Quittance de loyer")
- Date formats (DD/MM/YYYY), currency (€ with comma decimal: 1.234,56 €)
- CSV exports using semicolon delimiter for French Excel compatibility
- Error messages and validation feedback

**Rationale**: The platform serves French landlords; native language support reduces
friction and increases adoption. Legal documents require French compliance.

### II. Security-First Development

Every feature MUST implement security measures before functionality is considered
complete:
- Input validation on both client and server side
- Parameterized queries for all database operations (prevent SQL injection)
- Sanitization against XSS attacks
- Rate limiting (100 requests/min/user) on all API endpoints
- Never log or expose sensitive data (passwords, tokens, personal info)
- HTTPS/TLS for all connections

**Rationale**: Users trust the platform with financial and personal data. Security
breaches destroy trust and violate GDPR obligations.

### III. Code Reuse Over Duplication

Before creating new functions, components, or utilities:
1. MUST search existing codebase for similar functionality
2. MUST extend or refactor existing code when functionality overlaps
3. MUST consolidate duplicate patterns into shared utilities
4. MUST reuse existing Redux slices rather than creating parallel state

Key reusable locations:
- API services: `client/src/services/api.js`
- Redux slices: `client/src/store/slices/`
- Shared components: `client/src/components/`

**Rationale**: Duplication increases maintenance burden, introduces inconsistencies,
and makes bugs harder to fix across the codebase.

### IV. Modular and Maintainable Code

Code MUST be organized for maintainability:
- Functions limited to <50 lines, single responsibility
- Files limited to 200-300 lines maximum
- Clear separation: components, services, utilities, constants
- Meaningful variable names (`paymentStatus` not `ps`)
- JSDoc comments for complex functions and API endpoints
- Mobile-first responsive design with breakpoints (375px, 768px, 1025px+)

**Rationale**: Small landlords need a reliable tool they can depend on for years.
Maintainable code enables continuous improvement without accumulating tech debt.

### V. Simplicity and YAGNI

Implement only what is explicitly required:
- No speculative features or "future-proofing" abstractions
- No premature optimization
- Three similar lines of code is better than a premature abstraction
- Delete unused code completely (no commented-out code, no `_vars`)
- Start simple; complexity MUST be justified in writing when added

**Rationale**: Over-engineering slows development and obscures intent. The right
amount of complexity is the minimum needed for the current task.

## Technical Standards

### Technology Stack

- **Frontend**: React 18+ with Vite, Redux Toolkit, TailwindCSS, Heroicons
- **Backend**: Node.js 18+ LTS, Express.js 4.x, SQLite 3.x (PostgreSQL migration path)
- **API**: RESTful with `/api/` prefix, JSON format
- **Testing**: Jest (unit), React Testing Library (components), target >80% coverage
- **Code Style**: Airbnb JavaScript Style Guide, ES6+ features, functional components only

### Performance Targets

- Page load: <2 seconds on 4G connection
- API response: <500ms (p95)
- Database queries: <100ms for complex queries
- File upload: max 10MB with progress indicator
- Export generation: <5 seconds for 1 year of data

### Accessibility

- WCAG 2.1 AA compliance required
- Semantic HTML elements
- Keyboard navigation for all interactive elements
- Color contrast ratio ≥4.5:1
- Touch targets minimum 44x44px

## Development Workflow

### Before Starting Any Task

1. Read task description and acceptance criteria thoroughly
2. Check dependencies and prerequisite tasks
3. Review existing code for reusable patterns
4. Plan implementation approach

### During Development

1. Write tests alongside implementation
2. Commit frequently with conventional commit messages
3. Test manually in browser as you build
4. Keep code modular and follow principle III (code reuse)

### After Completing a Task

1. Run all tests to ensure nothing broke
2. Test feature manually in all scenarios
3. Update documentation if needed
4. Commit and push changes

### Commit Message Format

Use conventional commits: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`

## Governance

### Compliance

- All pull requests MUST verify compliance with these principles
- Complexity additions MUST be justified in PR description
- Security considerations MUST be documented for features handling user data
- Constitution violations require explicit approval with documented rationale

### Amendment Procedure

1. Propose amendment with rationale
2. Document impact on existing code and templates
3. Update version using semantic versioning:
   - MAJOR: Backward incompatible changes to principles
   - MINOR: New principle/section added
   - PATCH: Clarifications and wording fixes
4. Propagate changes to dependent templates

### Review Expectations

- Quarterly review of constitution relevance
- Post-mortem updates when principles prove insufficient
- Template synchronization after any amendment

**Version**: 1.0.0 | **Ratified**: 2025-12-01 | **Last Amended**: 2025-12-01
