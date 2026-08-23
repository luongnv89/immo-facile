<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# AI Coding Agent Instructions - ImmoFacile Platform

**Version:** 1.0  
**Date:** October 9, 2025  
**Project:** ImmoFacile Enhanced Platform

---

## Overview

This document provides clear, actionable instructions for AI Coding Agents working on the ImmoFacile rental property management platform. Follow these guidelines to ensure code quality, consistency, and alignment with project requirements.

---

## 1. Code Improvement & Reusability

- **Always review existing code first** before creating new functions or components
- **Refactor and extend** existing implementations rather than duplicating logic
- **Identify reusable patterns** across the codebase and extract them into shared utilities
- **Check for similar functionality** in existing files (e.g., `client/src/services/api.js`, Redux slices) before writing new code
- **Consolidate duplicate code** into shared components, hooks, or utility functions
- **Prefer composition over duplication** when building React components
- **Reuse existing Redux slices** and extend them rather than creating parallel state management
- **Leverage existing API patterns** defined in `api.js` for consistency

---

## 2. Technology Stack & Architecture

### Frontend (React 19)
- **Use functional components** with React Hooks exclusively (no class components)
- **Follow Redux Toolkit patterns** for state management with slices and async thunks
- **Use URL-routed hash tabs** for navigation (e.g. `#tenants`) — there is no router library installed
- **Implement Vite** build configurations for optimal performance
- **Apply TailwindCSS v4** utility classes for styling (avoid inline styles)
- **Use Heroicons/lucide-react** for consistent iconography
- **Integrate Recharts** for data visualizations
- **Implement React Big Calendar** for calendar views
- **Use React Dropzone** for file uploads

### Backend (Node.js ≥22.12 LTS)
- **Use Express 5.x** with proper middleware structure
- **Implement RESTful API** design under `/api` (routes are unversioned today)
- **Use async/await** for asynchronous operations (avoid callbacks)
- **Implement proper error handling** with try-catch blocks and error middleware
- **Use SQLite 3.x** for MVP with migration path to PostgreSQL in mind
- **Apply JWT authentication** with bcrypt for password hashing (implemented — see server/src/middleware/auth.js)
- **Implement rate limiting** (100 requests/min/user) on all endpoints
- **Use Multer** for file upload handling
- **Integrate node-cron** for scheduled tasks
- **Use Nodemailer** for email functionality

### Database
- **Design normalized schemas** with proper foreign key relationships
- **Use parameterized queries** to prevent SQL injection
- **Create indexes** on frequently queried fields (dates, status, foreign keys)
- **Include timestamps** (created_at, updated_at) on all tables
- **Use enums** for status fields to ensure data integrity
- **Plan for PostgreSQL migration** (avoid SQLite-specific features)

---

## 3. Coding Practices & Style

### JavaScript/Node.js
- **Follow Airbnb JavaScript Style Guide** or equivalent modern conventions
- **Use ES6+ features**: destructuring, arrow functions, template literals, async/await
- **Use meaningful variable names**: `paymentStatus` not `ps`, `tenantList` not `tl`
- **Keep functions small** (<50 lines) and single-purpose
- **Use const by default**, let when reassignment needed, avoid var
- **Implement proper error messages** that are user-friendly and actionable
- **Add JSDoc comments** for complex functions and API endpoints
- **Use camelCase** for variables and functions, PascalCase for components/classes

### React/Frontend
- **Follow React best practices**: hooks rules, component composition, prop drilling avoidance
- **Use custom hooks** to extract reusable logic
- **Implement proper prop validation** with PropTypes or TypeScript
- **Keep components focused** (single responsibility principle)
- **Use semantic HTML** elements for accessibility
- **Implement loading states** for all async operations
- **Add error boundaries** to catch and handle component errors
- **Optimize re-renders** with React.memo, useMemo, useCallback when appropriate
- **Follow mobile-first design** with responsive breakpoints (375px, 768px, 1025px+)

### File Organization
- **Group related files** by feature/domain, not by type
- **Use index.js** for clean exports from directories
- **Keep file length reasonable** (200-300 lines max, as per user rules)
- **Separate concerns**: components, services, utilities, constants
- **Use consistent naming**: `UserList.jsx`, `userSlice.js`, `userService.js`

---

## 4. Security Best Practices

### Authentication & Authorization
- **Implement JWT tokens** with 24-hour expiry and refresh mechanism
- **Hash passwords** with bcrypt (min 10 salt rounds)
- **Validate password strength**: min 8 chars, uppercase, number, special char
- **Implement role-based access control (RBAC)** for multi-user features
- **Never expose sensitive data** in API responses (password hashes, tokens)
- **Use secure HTTP-only cookies** for token storage when applicable

### Input Validation & Sanitization
- **Validate all user inputs** on both client and server side
- **Sanitize inputs** to prevent XSS attacks
- **Use parameterized queries** to prevent SQL injection
- **Validate file uploads**: type, size (max 10MB), content
- **Implement rate limiting** on all API endpoints
- **Add CSRF protection** for state-changing operations

### Data Protection
- **Encrypt sensitive data at rest** (AES-256)
- **Use HTTPS/TLS 1.3** for all connections
- **Implement security headers**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- **Follow GDPR compliance** for EU users (data export, deletion, consent)
- **Implement file upload security**: virus scanning (ClamAV), type validation
- **Never log sensitive information** (passwords, tokens, personal data)

### API Security
- **Implement authentication** on all protected endpoints
- **Validate authorization** (user can only access their own data)
- **Return appropriate HTTP status codes**: 401 (Unauthorized), 403 (Forbidden), 404 (Not Found)
- **Avoid exposing internal errors** to clients (use generic error messages)
- **Implement request size limits** to prevent DoS attacks
- **Add API versioning** for backward compatibility

---

## 5. Testing Requirements

### Unit Testing
- **Maintain >80% code coverage** as specified in tasks
- **Test all business logic** functions and utilities
- **Test Redux reducers and selectors** with various state scenarios
- **Test API endpoints** with different input combinations
- **Use Jest** for JavaScript/Node.js testing
- **Use React Testing Library** for component testing
- **Mock external dependencies** (API calls, database, third-party services)

### Integration Testing
- **Test API endpoint flows** (request → controller → service → database → response)
- **Test authentication flows** (login, token refresh, logout)
- **Test file upload/download** functionality
- **Test email sending** with mock SMTP server

### End-to-End Testing
- **Use Playwright or Cypress** for E2E testing (as per tasks)
- **Test complete user workflows**: create receipt → mark paid → view dashboard
- **Test across browsers**: Chrome, Firefox, Safari
- **Test on multiple devices**: desktop, tablet, mobile
- **Test with various data volumes**: 1, 10, 100, 1000 records

### Performance Testing
- **Measure page load times** (target: <2s on 4G)
- **Measure API response times** (target: <500ms p95)
- **Load test with 100 concurrent users**
- **Optimize database queries** (<100ms for complex queries)
- **Test export generation** (<5s for 1 year of data)

---

## 6. Documentation Standards

### Code Documentation
- **Add JSDoc comments** for all public functions and API endpoints
- **Document complex algorithms** with inline comments explaining the "why"
- **Include usage examples** in function documentation
- **Document environment variables** in `.env.example`
- **Keep comments up-to-date** when code changes

### API Documentation
- **Document all endpoints** in Swagger/OpenAPI format
- **Include request/response examples** with sample data
- **Document authentication requirements** for each endpoint
- **Document error responses** with status codes and messages
- **Document rate limiting** and pagination details

### User Documentation
- **Write clear user guides** for all features (as per tasks)
- **Create FAQ sections** addressing common questions
- **Record video tutorials** (5-10 min) for key workflows
- **Add in-app help tooltips** with question mark icons
- **Translate documentation to French** for target audience

### Developer Documentation
- **Maintain README.md** with setup instructions
- **Document database schema** with entity relationships
- **Document deployment process** and environment setup
- **Create developer onboarding guide** for new team members
- **Document architectural decisions** and migration paths

---

## 7. Performance Optimization

### Frontend Performance
- **Implement code splitting** with React.lazy and Suspense
- **Optimize bundle size** with tree shaking and minification
- **Use lazy loading** for images and heavy components
- **Implement virtual scrolling** for long lists (>100 items)
- **Optimize images**: compress, use appropriate formats (WebP), responsive sizes
- **Minimize re-renders** with proper React optimization techniques
- **Use skeleton loaders** instead of spinners for better UX

### Backend Performance
- **Optimize database queries** with proper indexes
- **Implement caching** (5 min TTL for expensive queries)
- **Use pagination** for large datasets (default 50 per page)
- **Implement database connection pooling**
- **Compress API responses** with gzip
- **Use async operations** to avoid blocking
- **Implement query result caching** for frequently accessed data

### Database Performance
- **Create indexes** on frequently queried fields
- **Use EXPLAIN** to analyze query performance
- **Avoid N+1 queries** with proper joins or eager loading
- **Implement database query logging** for slow queries (>100ms)
- **Archive old data** to maintain performance

---

## 8. Error Handling & Logging

### Error Handling
- **Use try-catch blocks** for all async operations
- **Implement global error handler** middleware in Express
- **Return consistent error format**: `{ error: { message, code, details } }`
- **Log errors** with context (user, endpoint, timestamp)
- **Implement error boundaries** in React for component errors
- **Provide user-friendly error messages** (avoid technical jargon)
- **Implement retry logic** for transient failures (max 3 attempts)

### Logging
- **Use structured logging** with log levels (error, warn, info, debug)
- **Log all authentication events** (login, logout, failed attempts)
- **Log all state-changing operations** (create, update, delete)
- **Include context** in logs (user_id, request_id, timestamp)
- **Use log aggregation** (Papertrail, Loggly) for production
- **Implement error tracking** with Sentry
- **Never log sensitive data** (passwords, tokens, personal info)

---

## 9. Accessibility (WCAG 2.1 AA)

- **Use semantic HTML** elements (header, nav, main, article, aside, footer)
- **Add ARIA labels** for interactive elements without visible text
- **Ensure keyboard navigation** for all interactive features (Tab, Enter, Escape)
- **Maintain color contrast ratio** ≥4.5:1 for text
- **Provide alt text** for all images
- **Make touch targets** minimum 44x44px for mobile
- **Support screen readers** with proper ARIA attributes
- **Test with accessibility tools** (axe, Lighthouse)
- **Provide focus indicators** for keyboard navigation
- **Ensure forms have proper labels** and error messages

---

## 10. Internationalization (i18n)

- **Use French as primary language** for UI and documentation
- **Format dates** as DD/MM/YYYY (French standard)
- **Format currency** with € symbol and comma as decimal separator (1.234,56 €)
- **Use semicolon delimiter** for CSV exports (French Excel standard)
- **Implement UTF-8 encoding** with BOM for file exports
- **Prepare for multi-language support** (use i18n library structure)
- **Localize error messages** and validation feedback

---

## 11. Git & Version Control

- **Commit frequently** after implementing and testing features
- **Write meaningful commit messages**: `feat: add payment tracking`, `fix: resolve date formatting bug`
- **Follow conventional commits**: feat, fix, docs, style, refactor, test, chore
- **Create feature branches** from main: `feature/payment-tracking`, `fix/receipt-export`
- **Keep commits atomic** (one logical change per commit)
- **Push to remote regularly** for backup and collaboration
- **Never commit sensitive data** (API keys, passwords, tokens)
- **Add `.gitignore` entries** for environment files, uploads, logs

---

## 12. Environment & Configuration

- **Use environment variables** for all configuration (ports, API keys, database URLs)
- **Create `.env.example`** with all required variables (without values)
- **Never commit `.env` files** to Git
- **Support multiple environments**: development, staging, production
- **Use different databases** per environment
- **Implement feature flags** for gradual rollouts
- **Document all environment variables** with descriptions

---

## 13. Project-Specific Requirements

### French Legal Compliance
- **Implement IRL calculator** with INSEE data for rent increases
- **Follow Loi ALUR requirements** for lease agreements
- **Include mandatory clauses** in contract templates
- **Track DPE certificates** with expiry alerts
- **Implement deposit management** per French regulations (max 1-2 months rent)
- **Generate compliant receipts** ("Quittance de loyer") with required fields

### Data Management
- **Implement polymorphic associations** for documents (entity_type + entity_id)
- **Support file uploads** (JPG, PNG, PDF, max 10MB)
- **Generate thumbnails** for uploaded images (200x200px)
- **Implement soft deletes** where appropriate (maintain audit trail)
- **Auto-generate calendar events** from other entities (payments, lease expiries)

### Email & Notifications
- **Send payment reminders** at 3, 7, 14 days overdue
- **Send lease expiry alerts** at 90, 60, 30, 7 days before expiry
- **Send document expiry alerts** at 30, 7, 0 days before expiry
- **Track email opens** with tracking pixels
- **Include privacy notice** in emails
- **Make emails mobile-friendly** and accessible

---

## 14. Document Maintenance

### Always Update These Files

All three live under `dev-docs/`:

#### dev-docs/prd.md (Product Requirements Document)
- **Update when requirements change** or new features are added
- **Document new user stories** and personas as they emerge
- **Update success metrics** based on actual data
- **Revise technical specifications** when architecture changes
- **Add new edge cases** discovered during development
- **Update version history** with date, author, and changes

#### dev-docs/tasks.md (Development Tasks)
- **Add new tasks** when requirements expand
- **Update task descriptions** when scope changes
- **Mark dependencies** accurately to prevent blocking
- **Update acceptance criteria** based on implementation learnings
- **Add discovered subtasks** that weren't initially planned
- **Document task completion** with actual vs estimated effort

#### dev-docs/todo.md (Progress Checklist)
- **Check off completed tasks** immediately after finishing
- **Add new tasks** from tasks.md updates
- **Keep sprint organization** consistent with tasks.md
- **Update regularly** (daily or after each task completion)
- **Use as source of truth** for project progress

### When to Update
- **After completing any task** → Update todo.md
- **When discovering new requirements** → Update prd.md and tasks.md
- **When scope changes** → Update all three documents
- **During sprint planning** → Review and update tasks.md and todo.md
- **After user feedback** → Update prd.md with new insights
- **When technical decisions change** → Update prd.md technical specs

---

## 15. Development Workflow

### Before Starting a Task
1. **Read the task description** in tasks.md thoroughly
2. **Review acceptance criteria** to understand completion requirements
3. **Check dependencies** and ensure prerequisite tasks are complete
4. **Review existing code** for similar functionality to reuse
5. **Plan the implementation** approach before coding

### During Development
1. **Follow the acceptance criteria** as a checklist
2. **Write tests** alongside implementation (TDD when possible)
3. **Commit frequently** with meaningful messages
4. **Test manually** in browser/Postman as you build
5. **Keep code modular** and reusable

### After Completing a Task
1. **Run all tests** to ensure nothing broke
2. **Test the feature manually** in all scenarios
3. **Update documentation** (code comments, API docs)
4. **Check off task** in todo.md
5. **Update related documents** (prd.md, tasks.md) if needed
6. **Commit and push** changes
7. **Create pull request** with description of changes

### Code Review Checklist
- [ ] Code follows style guidelines
- [ ] No code duplication
- [ ] Tests written and passing (>80% coverage)
- [ ] Security best practices followed
- [ ] Error handling implemented
- [ ] Documentation updated
- [ ] Performance optimized
- [ ] Accessibility requirements met
- [ ] Mobile responsive
- [ ] todo.md updated

---

## 16. Common Patterns & Anti-Patterns

### ✅ DO

- **Reuse existing API service functions** in `client/src/services/api.js`
- **Extend existing Redux slices** rather than creating new ones
- **Use shared components** from `client/src/components/`
- **Follow existing file structure** and naming conventions
- **Implement optimistic UI updates** for better UX
- **Add loading and error states** to all async operations
- **Use environment variables** for configuration
- **Implement proper validation** on both client and server
- **Write tests** for all new functionality
- **Keep functions pure** when possible (no side effects)

### ❌ DON'T

- **Don't duplicate API call logic** across components
- **Don't create parallel state management** for related data
- **Don't hardcode values** that should be configurable
- **Don't skip error handling** assuming everything will work
- **Don't commit commented-out code** (use Git history instead)
- **Don't use inline styles** (use TailwindCSS classes)
- **Don't skip input validation** on the server
- **Don't expose sensitive data** in API responses or logs
- **Don't write functions >50 lines** (break them down)
- **Don't skip documentation** for complex logic

---

## 17. Quick Reference

### File Paths
- Frontend: `/client/src/`
- Backend: `/server/src/`
- Redux Slices: `/client/src/store/slices/`
- API Services: `/client/src/services/api.js`
- Components: `/client/src/components/`
- Pages: `/client/src/pages/`
- Controllers: `/server/src/controllers/`
- Middleware: `/server/src/middleware/`
- Database: `/server/database/`

### Key Commands
Build/test/lint commands are recorded once in @CLAUDE.md (Critical Commands)
and detailed in @ENVIRONMENT.md — consult those instead of duplicating them
here. The server (jest) and client (vitest) suites are installed and green;
there is no `npm run migrate` script in this repository.

### Important Constants
- API Base: `/api` (unversioned)
- Rate Limit: 100 req/min/user
- Max File Size: 10MB
- JWT Expiry: 24 hours
- Page Size: 50 items
- Cache TTL: 5 minutes
- Min Touch Target: 44x44px
- Target Load Time: <2s
- Target API Response: <500ms (p95)

---

## 18. When in Doubt

- **Review the PRD** (dev-docs/prd.md) for product requirements and technical specs
- **Check dev-docs/tasks.md** for implementation details and acceptance criteria
- **Look at existing code** for similar patterns and conventions
- **Prioritize security** over convenience
- **Prioritize user experience** over developer convenience
- **Ask for clarification** rather than making assumptions
- **Test thoroughly** before marking tasks complete
- **Document your decisions** for future reference

---

## 19. Token Efficiency
- Never re-read files you just wrote or edited. You know the contents.
- Never re-run commands to "verify" unless the outcome was uncertain.
- Don't echo back large blocks of code or file contents unless asked.
- Batch related edits into single operations. Don't make 5 edits when 1 handles it.
- Skip confirmations like "I'll continue..." Just do it.
- If a task needs 1 tool call, don't use 3. Plan before acting.
- Do not summarize what you just did unless the result is ambiguous or you need additional input.

---

**Remember:** Quality over speed. Write code that is maintainable, secure, and user-friendly. Always think about the end user (French landlords) and their needs.
