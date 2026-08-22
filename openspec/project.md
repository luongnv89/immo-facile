# Project Context

## Purpose
ImmoFacile is a modern fullstack web application designed for French property managers to efficiently handle tenant information, generate professional rent receipts ("Quittance de Loyer"), and manage rental property operations. The platform aims to transform rental property management from manual, time-consuming processes into an automated, compliant, and user-friendly experience.

**Key Goals:**
- Reduce administrative time spent on rental management by 60%
- Ensure full compliance with French rental laws and regulations
- Provide actionable financial insights and reporting
- Enable scalable management for landlords with multiple properties
- Maintain user-friendly interface suitable for non-technical users

## Tech Stack

### Frontend
- **React 18+** with functional components and hooks (no class components)
- **Vite** for fast development and optimized production builds
- **Redux Toolkit** for state management with slices and async thunks
- **React Router v6** for client-side routing
- **TailwindCSS** for utility-first styling with mobile-first responsive design
- **Heroicons** for consistent iconography
- **Axios** for API communication
- **Recharts** for data visualizations
- **React Big Calendar** for calendar views
- **React Dropzone** for file uploads

### Backend
- **Node.js 18+ LTS** with async/await for asynchronous operations
- **Express.js 4.x** with proper middleware structure and RESTful API design
- **SQLite 3.x** for MVP with planned migration path to PostgreSQL
- **JWT authentication** with bcrypt for password hashing (min 10 salt rounds)
- **Nodemailer** for email functionality with SMTP configuration
- **PDFKit** for professional PDF receipt generation
- **Multer** for file upload handling (max 10MB files)
- **node-cron** for scheduled tasks and automated reminders
- **express-rate-limit** (100 requests/min/user) for API protection
- **Helmet** for security headers and middleware

### Development Tools
- **ESLint** for code linting with Airbnb style guide
- **Jest** for unit testing with >80% code coverage requirement
- **React Testing Library** for component testing
- **Playwright/Cypress** for end-to-end testing
- **Git** with conventional commits and feature branching

## Project Conventions

### Code Style
- **Airbnb JavaScript Style Guide** or equivalent modern conventions
- **ES6+ features**: destructuring, arrow functions, template literals, async/await
- **Meaningful variable names**: `paymentStatus` not `ps`, `tenantList` not `tl`
- **Functions <50 lines** and single-purpose
- **const by default**, let when reassignment needed, avoid var
- **Proper error messages** that are user-friendly and actionable
- **JSDoc comments** for complex functions and API endpoints
- **camelCase** for variables and functions, PascalCase for components/classes
- **File length reasonable** (200-300 lines max)

### Architecture Patterns
- **Modular design** with separated concerns and clear component boundaries
- **Feature-based file organization** rather than type-based
- **Redux slices** for related state management (extend existing rather than duplicate)
- **Custom hooks** to extract reusable logic from components
- **Service layer** (api.js) for all external API calls
- **Controller-service-model** pattern in backend
- **Middleware pattern** for cross-cutting concerns (auth, validation, error handling)
- **Environment-based configuration** with .env files and validation
- **Index.js files** for clean exports from directories

### Testing Strategy
- **Unit testing** for all business logic functions and utilities (>80% coverage)
- **Component testing** with React Testing Library for UI components
- **Integration testing** for API endpoint flows (request → controller → service → database → response)
- **End-to-end testing** with Playwright/Cypress for complete user workflows
- **Test-driven development (TDD)** when possible
- **Mock external dependencies** (API calls, database, third-party services)
- **Performance testing** for page load times (<2s), API response times (<500ms p95), and export generation (<5s)

### Git Workflow
- **Conventional commits**: feat, fix, docs, style, refactor, test, chore
- **Feature branches** from main: `feature/payment-tracking`, `fix/receipt-export`
- **Atomic commits** (one logical change per commit)
- **Frequent commits** after implementing and testing features
- **Pull requests** with clear descriptions of changes
- **Code review checklist** before merging
- **Never commit sensitive data** (API keys, passwords, tokens, .env files)

## Domain Context
**French Rental Property Management Domain Knowledge:**

- **Quittance de loyer**: Official rent receipt required by French law, must include specific fields (landlord/tenant info, amount, period, payment date, signature)
- **IRL (Indice de Référence des Loyers)**: Government index for calculating maximum annual rent increases (3% max)
- **DPE (Diagnostic de Performance Énergétique)**: Energy performance certificate required for all rentals, expires every 10 years
- **Security deposit**: Maximum 1-2 months rent, must be returned within 1-3 months after lease end
- **Lease agreements**: Must follow Loi ALUR requirements with mandatory clauses
- **Tax reporting**: Landlords must report rental income annually, receipts serve as proof
- **Payment tracking**: Critical for cash flow management and late fee calculations
- **Maintenance requests**: Must be tracked for insurance claims and tax deductions
- **Document management**: Legal requirement to retain documents for 3-10 years depending on type

**Key French Legal Requirements:**
- All receipts must be in French with proper formatting
- Email delivery is acceptable but physical copies may be requested
- Rent increases limited by IRL index
- Security deposits regulated by law
- Energy certificates mandatory since 2023
- GDPR compliance for EU data protection

## Important Constraints

### Technical Constraints
- **Database**: SQLite for MVP (tested to 100K records), PostgreSQL migration planned
- **File storage**: Local filesystem for MVP, AWS S3 migration path
- **Performance**: <2s page load, <500ms API responses, <5s exports
- **File size limit**: 10MB maximum upload size
- **Rate limiting**: 100 requests/minute per user
- **Concurrent users**: Support 1,000 simultaneous users
- **Mobile targets**: 375px-767px (mobile), 768px-1024px (tablet), 1025px+ (desktop)

### Business Constraints
- **Target audience**: French landlords (primary market)
- **Pricing model**: Freemium with premium features
- **Compliance**: French rental laws, GDPR, WCAG 2.1 AA accessibility
- **Timeline**: MVP in 12 weeks, iterative releases every 6 weeks
- **Success metrics**: 75% retention, >60% feature adoption, >4.5/5 CSAT

### Regulatory Constraints
- **French rental laws**: IRL increases, deposit limits, mandatory clauses
- **GDPR compliance**: Data export/deletion, consent management
- **Accessibility**: WCAG 2.1 AA, keyboard navigation, screen readers
- **Security**: JWT with 24h expiry, bcrypt hashing, encrypted data
- **Data retention**: 3-10 years for different document types

## External Dependencies
- **Email services**: SMTP providers (Gmail, SendGrid, Mailgun) for receipt delivery and reminders
- **PDF generation**: PDFKit for receipt creation (local), Puppeteer alternative
- **File processing**: Image thumbnails (Sharp), file type validation
- **Date/time handling**: Standard JavaScript Date with French locale formatting
- **Currency formatting**: Euro (€) with comma decimal separator (French standard)
- **CSV/Excel export**: ExcelJS for accounting exports with semicolon delimiter
- **Charts/visualization**: Recharts for dashboard analytics
- **Calendar integration**: React Big Calendar for scheduling
- **File uploads**: React Dropzone with Multer backend processing
- **Cron scheduling**: node-cron for automated reminders and alerts
