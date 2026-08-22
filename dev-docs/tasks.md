# Development Tasks: ImmoFacile Enhanced Platform

**Version:** 1.0  
**Date:** October 9, 2025  
**Based on:** PRD v2.0

---

## Sprint 1: MVP - Core Financial Features (Week 1-12)

**Goal:** Deliver payment tracking, expense tracking, financial dashboard, and accounting export  
**Success Criteria:** >60% dashboard adoption, 30% reduction in late payment inquiries

### 1.1 Payment Tracking System (Week 1-3)

#### Task 1.1.1: Database Schema for Payment Tracking
**Description:** Extend `receipts` table with payment tracking fields.

**Acceptance Criteria:**
- [ ] Add fields: payment_status, payment_date, payment_method, tracking_token, email_opened, reminder_sent_count
- [ ] Create database migration script
- [ ] Test with sample data

**Dependencies:** None

---

#### Task 1.1.2: Backend API - Payment Status Management
**Description:** RESTful API endpoints for payment management.

**Acceptance Criteria:**
- [ ] `PATCH /api/v1/receipts/:id/payment-status` - Update status
- [ ] `POST /api/v1/receipts/:id/record-payment` - Record payment
- [ ] `GET /api/v1/receipts/payment-status/:status` - Filter by status
- [ ] Validate inputs, add rate limiting, write unit tests (>80% coverage)

**Dependencies:** Task 1.1.1

---

#### Task 1.1.3: Frontend - Payment Status UI
**Description:** React components for payment status display and management.

**Acceptance Criteria:**
- [ ] Create PaymentStatusBadge, PaymentStatusFilter, RecordPaymentModal components
- [ ] Implement optimistic UI updates
- [ ] Add mobile responsiveness and keyboard navigation
- [ ] Write component tests

**Dependencies:** Task 1.1.2

---

#### Task 1.1.4: Frontend - Enhanced Receipt List
**Description:** Update receipt list with payment tracking features.

**Acceptance Criteria:**
- [ ] Display payment status badges and filters
- [ ] Add "Record Payment" quick action
- [ ] Show overdue indicators (>5 days)
- [ ] Implement bulk actions and sorting

**Dependencies:** Task 1.1.3

---

#### Task 1.1.5: Redux State Management
**Description:** Redux slices for payment tracking.

**Acceptance Criteria:**
- [ ] Create paymentSlice with reducers and async thunks
- [ ] Add selectors for filtering and calculations
- [ ] Implement optimistic updates with rollback
- [ ] Write tests

**Dependencies:** Task 1.1.2

---

### 1.2 Automated Payment Reminders (Week 2-4)

#### Task 1.2.1: Email Template System
**Description:** Responsive HTML email templates for reminders.

**Acceptance Criteria:**
- [ ] Design HTML template with landlord/tenant info, amount, due date
- [ ] Include tracking pixel and "View Receipt" button
- [ ] Create plain text fallback
- [ ] Test across email clients

**Dependencies:** None

---

#### Task 1.2.2: Email Tracking System
**Description:** Track email opens via tracking pixels.

**Acceptance Criteria:**
- [ ] Generate unique tracking tokens
- [ ] Create `GET /api/v1/tracking/email/:token/open` endpoint
- [ ] Update email_opened fields
- [ ] Add privacy notice

**Dependencies:** Task 1.1.1, Task 1.2.1

---

#### Task 1.2.3: Reminder Scheduling Service
**Description:** Cron-based automated reminder service.

**Acceptance Criteria:**
- [ ] Use node-cron for daily job (9:00 AM)
- [ ] Send reminders at 3, 7, 14 days overdue
- [ ] Update reminder counts and timestamps
- [ ] Implement retry logic (max 3 attempts)
- [ ] Add admin endpoint for manual triggering

**Dependencies:** Task 1.2.1, Task 1.2.2

---

#### Task 1.2.4: Reminder Configuration UI
**Description:** Settings page for reminder preferences.

**Acceptance Criteria:**
- [ ] Add enable/disable toggle
- [ ] Configure reminder intervals
- [ ] Customize email subject
- [ ] Preview template and send test reminder
- [ ] Display reminder statistics

**Dependencies:** Task 1.2.3

---

### 1.3 Expense Tracking System (Week 4-6)

#### Task 1.3.1: Database Schema for Expenses
**Description:** Create expense tracking schema.

**Acceptance Criteria:**
- [ ] Create `expenses` table: id, user_id, apartment_id, category, amount, expense_date, description, receipt_file_path
- [ ] Create `expense_categories` table with predefined categories
- [ ] Add indexes and foreign keys
- [ ] Seed default categories

**Dependencies:** None

---

#### Task 1.3.2: Backend API - Expense CRUD
**Description:** RESTful API for expense management.

**Acceptance Criteria:**
- [ ] Implement POST, GET, PATCH, DELETE endpoints
- [ ] Support filtering (date range, category, apartment) and pagination
- [ ] Return total count and sum
- [ ] Write unit tests (>80% coverage)

**Dependencies:** Task 1.3.1

---

#### Task 1.3.3: File Upload for Receipts
**Description:** Upload and store receipt files.

**Acceptance Criteria:**
- [ ] Use Multer for file uploads (JPG, PNG, PDF, max 10MB)
- [ ] Store in `/server/uploads/receipts/` with unique filenames
- [ ] Generate thumbnails for images
- [ ] Implement upload, download, delete endpoints
- [ ] Add virus scanning

**Dependencies:** Task 1.3.2

---

#### Task 1.3.4: Frontend - Expense Form
**Description:** Form for creating/editing expenses.

**Acceptance Criteria:**
- [ ] Create ExpenseForm with amount, date, category, description, apartment, receipt upload
- [ ] Add drag-and-drop file upload
- [ ] Implement validation and error handling
- [ ] Support create and edit modes

**Dependencies:** Task 1.3.2, Task 1.3.3

---

#### Task 1.3.5: Frontend - Expense List
**Description:** Filterable, sortable expense list.

**Acceptance Criteria:**
- [ ] Display expenses with filters (date range, category, apartment)
- [ ] Add sorting and pagination (50 per page)
- [ ] Show total expenses and receipt thumbnails
- [ ] Implement search and CSV export

**Dependencies:** Task 1.3.4

---

#### Task 1.3.6: Redux State Management
**Description:** Redux state for expenses.

**Acceptance Criteria:**
- [ ] Create expenseSlice with CRUD reducers
- [ ] Add selectors for filtering and calculations
- [ ] Implement caching and optimistic updates

**Dependencies:** Task 1.3.2

---

### 1.4 Financial Dashboard (Week 7-9)

#### Task 1.4.1: Backend API - Financial Analytics
**Description:** API endpoints for financial data aggregation.

**Acceptance Criteria:**
- [ ] Create endpoints: financial-summary, income-by-month, expenses-by-category, profit-by-property
- [ ] Support date range and apartment filters
- [ ] Optimize queries (<100ms response time)
- [ ] Add caching (5 min TTL)

**Dependencies:** Task 1.1.1, Task 1.3.1

---

#### Task 1.4.2: Frontend - Dashboard Layout
**Description:** Main dashboard page structure.

**Acceptance Criteria:**
- [ ] Create responsive grid layout
- [ ] Add date range selector and property filter
- [ ] Implement skeleton loading states
- [ ] Add error boundaries

**Dependencies:** None

---

#### Task 1.4.3: Frontend - Financial Summary Cards
**Description:** Key financial metrics display.

**Acceptance Criteria:**
- [ ] Display Total Income, Total Expenses, Net Profit, Profit Margin cards
- [ ] Show period comparison with % change
- [ ] Color code positive/negative values
- [ ] Animate numbers on load

**Dependencies:** Task 1.4.1, Task 1.4.2

---

#### Task 1.4.4: Frontend - Income & Expense Charts
**Description:** Visualize trends using Recharts.

**Acceptance Criteria:**
- [ ] Create line/bar chart showing income vs expenses over time
- [ ] Add tooltips, legend, axis labels
- [ ] Support chart type toggle and export

**Dependencies:** Task 1.4.1, Task 1.4.2

---

#### Task 1.4.5: Frontend - Expense Category Breakdown
**Description:** Pie chart for expense distribution.

**Acceptance Criteria:**
- [ ] Display pie/donut chart by category
- [ ] Show percentages and amounts
- [ ] Sort by amount, group small categories as "Other"

**Dependencies:** Task 1.4.1, Task 1.4.2

---

#### Task 1.4.6: Frontend - Payment Status Overview
**Description:** Payment status summary widget.

**Acceptance Criteria:**
- [ ] Display counts: Total, Paid, Pending, Late
- [ ] Show on-time payment percentage
- [ ] Add bar chart and trend indicators

**Dependencies:** Task 1.4.1, Task 1.4.2

---

#### Task 1.4.7: Frontend - Property Performance Table
**Description:** Compare performance across properties.

**Acceptance Criteria:**
- [ ] Display table: Property, Income, Expenses, Net Profit, ROI%
- [ ] Add sorting and sparkline charts
- [ ] Show portfolio totals

**Dependencies:** Task 1.4.1, Task 1.4.2

---

#### Task 1.4.8: Redux State Management
**Description:** Dashboard state management.

**Acceptance Criteria:**
- [ ] Create dashboardSlice with filter state
- [ ] Implement caching to avoid redundant API calls
- [ ] Persist filter preferences to localStorage

**Dependencies:** Task 1.4.1

---

### 1.5 Accounting Export (Week 10-11)

#### Task 1.5.1: Backend API - Export Data Preparation
**Description:** API to prepare financial data for export.

**Acceptance Criteria:**
- [ ] Create `GET /api/v1/exports/accounting-data` endpoint
- [ ] Include receipts and expenses with filtering
- [ ] Calculate totals and subtotals
- [ ] Optimize for large datasets (<5s for 1 year)

**Dependencies:** Task 1.1.1, Task 1.3.1

---

#### Task 1.5.2: Backend - Excel Export
**Description:** Generate Excel files using ExcelJS.

**Acceptance Criteria:**
- [ ] Create `POST /api/v1/exports/excel` endpoint
- [ ] Generate workbook with sheets: Summary, Income, Expenses, By Property
- [ ] Format headers, apply currency formatting, add charts
- [ ] Return as download

**Dependencies:** Task 1.5.1

---

#### Task 1.5.3: Backend - CSV Export
**Description:** Generate CSV files.

**Acceptance Criteria:**
- [ ] Create `POST /api/v1/exports/csv` endpoint
- [ ] Use semicolon delimiter, UTF-8 with BOM
- [ ] Format dates (DD/MM/YYYY) and amounts (French format)

**Dependencies:** Task 1.5.1

---

#### Task 1.5.4: Backend - PDF Report
**Description:** Generate PDF reports using PDFMake.

**Acceptance Criteria:**
- [ ] Create `POST /api/v1/exports/pdf` endpoint
- [ ] Include cover page, summary, detailed tables, charts
- [ ] Apply professional styling

**Dependencies:** Task 1.5.1

---

#### Task 1.5.5: Frontend - Export Configuration Modal
**Description:** UI for configuring exports.

**Acceptance Criteria:**
- [ ] Create ExportModal with format selector (Excel, CSV, PDF)
- [ ] Add date range picker and property filter
- [ ] Show progress indicator and trigger download
- [ ] Add "Email to me" option

**Dependencies:** Task 1.5.2, Task 1.5.3, Task 1.5.4

---

#### Task 1.5.6: Frontend - Export History
**Description:** Track and manage past exports.

**Acceptance Criteria:**
- [ ] Display list of past exports with download/delete actions
- [ ] Show status (generating, ready, expired)
- [ ] Auto-delete exports >7 days old

**Dependencies:** Task 1.5.5

---

### 1.6 MVP Testing & Launch (Week 12)

#### Task 1.6.1: End-to-End Testing
**Description:** Comprehensive E2E testing with Playwright/Cypress.

**Acceptance Criteria:**
- [ ] Write test scenarios for complete user workflows
- [ ] Test on multiple browsers and devices
- [ ] Test with various data volumes

**Dependencies:** All Sprint 1 tasks

---

#### Task 1.6.2: Performance Testing
**Description:** Ensure performance requirements are met.

**Acceptance Criteria:**
- [ ] Measure page load (<2s) and API response times (<500ms p95)
- [ ] Load test with 100 concurrent users
- [ ] Optimize queries and bundle size

**Dependencies:** Task 1.6.1

---

#### Task 1.6.3: Security Audit
**Description:** Security review and hardening.

**Acceptance Criteria:**
- [ ] Review authentication, implement rate limiting, CSRF protection
- [ ] Add security headers, encrypt sensitive data
- [ ] Conduct penetration testing

**Dependencies:** Task 1.6.1

---

#### Task 1.6.4: User Onboarding Flow
**Description:** Guided onboarding wizard.

**Acceptance Criteria:**
- [ ] Create 4-step wizard: Welcome, Add Property, Add Tenant, Generate Receipt
- [ ] Add progress indicator and skip option
- [ ] Track completion rate

**Dependencies:** None

---

#### Task 1.6.5: Documentation & Help
**Description:** User documentation and help resources.

**Acceptance Criteria:**
- [ ] Write user guide and FAQ
- [ ] Record video tutorials (5-10 min each)
- [ ] Add in-app help tooltips
- [ ] Translate to French

**Dependencies:** All Sprint 1 tasks

---

#### Task 1.6.6: Bug Fixing & Polish
**Description:** Address bugs and improve UX.

**Acceptance Criteria:**
- [ ] Fix all critical/high-priority bugs
- [ ] Improve error messages and loading states
- [ ] Polish UI and improve accessibility

**Dependencies:** Task 1.6.1

---

#### Task 1.6.7: Deployment & Monitoring
**Description:** Deploy to production with monitoring.

**Acceptance Criteria:**
- [ ] Set up production environment with SSL
- [ ] Configure backups, error tracking (Sentry), uptime monitoring
- [ ] Set up CI/CD pipeline
- [ ] Document deployment process

**Dependencies:** Task 1.6.2, Task 1.6.3

---

## Sprint 2: Property & Tenant Management (Week 13-18)

**Goal:** Add maintenance tracking, document management, and lease management  
**Success Criteria:** >50% upload documents, >30% create maintenance requests

### 2.1 Maintenance Request Tracking (Week 13-14)

#### Task 2.1.1: Database Schema
- Create `maintenance_requests` and `maintenance_photos` tables
- Add status, priority, category enums
- **Dependencies:** None

#### Task 2.1.2: Backend API
- Implement CRUD endpoints for maintenance requests
- Support photo uploads and filtering
- **Dependencies:** Task 2.1.1

#### Task 2.1.3: Frontend - Request Form
- Build form with photo upload (drag-and-drop)
- Add validation and preview
- **Dependencies:** Task 2.1.2

#### Task 2.1.4: Frontend - List & Board View
- Create table and kanban views
- Add filters, sorting, drag-and-drop status updates
- **Dependencies:** Task 2.1.3

#### Task 2.1.5: Frontend - Detail Page
- Display full request info with photo gallery
- Add status update and notes sections
- **Dependencies:** Task 2.1.4

#### Task 2.1.6: Integration - Link to Expenses
- Add "Create Expense from Maintenance" button
- Link expenses to maintenance requests
- **Dependencies:** Task 2.1.5, Task 1.3.2

#### Task 2.1.7: Notifications
- Send email alerts for status changes
- **Dependencies:** Task 2.1.2

---

### 2.2 Document Management (Week 15-16)

#### Task 2.2.1: Database Schema
- Create `documents` table with polymorphic associations
- Support entity types: apartment, tenant, maintenance, insurance
- **Dependencies:** None

#### Task 2.2.2: Backend API
- Implement upload, download, delete endpoints
- Add virus scanning and thumbnail generation
- **Dependencies:** Task 2.2.1

#### Task 2.2.3: Frontend - Upload Component
- Create reusable DocumentUpload component
- Support drag-and-drop and progress tracking
- **Dependencies:** Task 2.2.2

#### Task 2.2.4: Frontend - Document Library
- Display documents in grid/list view with filters
- Add search, sorting, bulk actions
- **Dependencies:** Task 2.2.3

#### Task 2.2.5: Frontend - Document Viewer
- In-app PDF and image viewer with zoom
- **Dependencies:** Task 2.2.4

#### Task 2.2.6: Integration - Link to Entities
- Add "Documents" tabs to apartment, tenant, maintenance pages
- **Dependencies:** Task 2.2.5

#### Task 2.2.7: Notifications - Expiry Alerts
- Send alerts 30, 7, 0 days before document expiry
- **Dependencies:** Task 2.2.2

---

### 2.3 Lease Management & Alerts (Week 17-18)

#### Task 2.3.1: Database Schema
- Extend `tenants` table with lease fields
- Create `lease_history` table
- **Dependencies:** None

#### Task 2.3.2: Backend API
- Implement lease CRUD and renewal endpoints
- **Dependencies:** Task 2.3.1

#### Task 2.3.3: Frontend - Lease Display
- Add "Lease Information" section to tenant page
- Show countdown to expiry
- **Dependencies:** Task 2.3.2

#### Task 2.3.4: Frontend - Renewal Workflow
- Create LeaseRenewalModal with guided steps
- **Dependencies:** Task 2.3.3

#### Task 2.3.5: Frontend - Dashboard Widget
- Display upcoming lease expirations
- **Dependencies:** Task 2.3.2

#### Task 2.3.6: Notifications
- Send alerts at 90, 60, 30, 7 days before expiry
- **Dependencies:** Task 2.3.2

#### Task 2.3.7: Reports
- Generate lease status report with export
- **Dependencies:** Task 2.3.2

---

## Sprint 3: Legal Compliance & Automation (Week 19-24)

**Goal:** Implement calendar, IRL calculator, deposit management, contract templates  
**Success Criteria:** >40% use calendar weekly, >70% use IRL calculator

### 3.1 Calendar & Task Management (Week 19-20)

#### Task 3.1.1: Database Schema
- Create `calendar_events` and `event_reminders` tables
- **Dependencies:** None

#### Task 3.1.2: Backend API
- Implement event CRUD endpoints
- Auto-create events from other entities
- **Dependencies:** Task 3.1.1

#### Task 3.1.3: Frontend - Calendar View
- Use React Big Calendar for month/week/day views
- Add drag-and-drop rescheduling
- **Dependencies:** Task 3.1.2

#### Task 3.1.4: Frontend - Event Form
- Create event creation/editing form with recurrence
- **Dependencies:** Task 3.1.3

#### Task 3.1.5: Frontend - Dashboard Widget
- Display next 10 upcoming events
- **Dependencies:** Task 3.1.2

#### Task 3.1.6: Integration - Auto-Generate Events
- Auto-create events for payments, lease expiries, maintenance
- **Dependencies:** Task 3.1.2

#### Task 3.1.7: Notifications
- Send event reminders via email and in-app
- **Dependencies:** Task 3.1.2

---

### 3.2 French Legal Compliance (Week 21-22)

#### Task 3.2.1: IRL Calculator - Backend
- Create `irl_indices` table and calculation endpoint
- **Dependencies:** None

#### Task 3.2.2: IRL Calculator - Frontend
- Build calculator UI with results display
- Add "Apply to Lease" and "Generate Letter" buttons
- **Dependencies:** Task 3.2.1

#### Task 3.2.3: Deposit Management - Backend
- Add deposit fields to tenants, create deductions table
- Implement deposit calculation endpoints
- **Dependencies:** None

#### Task 3.2.4: Deposit Management - Frontend
- Add deposit section to tenant page
- Create DepositReturnCalculator component
- **Dependencies:** Task 3.2.3

#### Task 3.2.5: DPE Storage
- Add DPE fields to apartments table
- Link to document management
- **Dependencies:** Task 2.2.2

#### Task 3.2.6: DPE Display & Alerts
- Display DPE rating badges with color coding
- Create expiry alerts widget
- **Dependencies:** Task 3.2.5

#### Task 3.2.7: Legal Document Templates
- Create templates for rent increase, deposit return, termination notices
- **Dependencies:** None

---

### 3.3 Contract Template Generator (Week 23-24)

#### Task 3.3.1: Lease Agreement Template
- Create French lease templates (furnished/unfurnished)
- Include all mandatory clauses per Loi ALUR
- **Dependencies:** None

#### Task 3.3.2: Lease Generator - Frontend
- Build multi-step wizard for lease generation
- Add live preview and PDF download
- **Dependencies:** Task 3.3.1

#### Task 3.3.3: Inventory Checklist Template
- Create état des lieux template with photos
- **Dependencies:** Task 3.3.1

#### Task 3.3.4: Inventory Checklist - Frontend
- Interactive form for completing checklists
- Compare move-in vs move-out
- **Dependencies:** Task 3.3.3

#### Task 3.3.5: Receipt Template Enhancement
- Update receipt to meet French legal requirements
- **Dependencies:** None

#### Task 3.3.6: Template Management
- Allow customization of templates (admin)
- **Dependencies:** Task 3.3.1, Task 3.3.3

---

## Sprint 4: Advanced Features (Week 25-36)

**Goal:** Multi-user support, insurance tracking, portfolio dashboard  
**Success Criteria:** >20% add users, >60% use portfolio dashboard

### 4.1 Multi-User & RBAC (Week 25-27)

#### Task 4.1.1: Database Schema
- Create `user_roles`, `permissions`, `user_invitations` tables
- **Dependencies:** None

#### Task 4.1.2: Permission System
- Implement RBAC middleware with role definitions
- **Dependencies:** Task 4.1.1

#### Task 4.1.3: Backend API
- User invitation and management endpoints
- **Dependencies:** Task 4.1.2

#### Task 4.1.4: Frontend - User Management
- Build user management page with invite modal
- **Dependencies:** Task 4.1.3

#### Task 4.1.5: Frontend - Permission-Based UI
- Hide/show elements based on permissions
- **Dependencies:** Task 4.1.3

#### Task 4.1.6: Invitation Flow
- Create invitation acceptance page
- **Dependencies:** Task 4.1.3

#### Task 4.1.7: Audit Log
- Track all user actions for compliance
- **Dependencies:** Task 4.1.2

---

### 4.2 Insurance Tracking (Week 28-29)

#### Task 4.2.1: Database Schema
- Create `insurance_policies` table
- **Dependencies:** None

#### Task 4.2.2: Backend API
- Implement insurance CRUD endpoints
- **Dependencies:** Task 4.2.1

#### Task 4.2.3: Frontend - Insurance Form
- Build form for adding/editing policies
- **Dependencies:** Task 4.2.2

#### Task 4.2.4: Frontend - Insurance List
- Display policies with renewal alerts
- **Dependencies:** Task 4.2.3

#### Task 4.2.5: Integration
- Link insurance to properties and tenants
- **Dependencies:** Task 4.2.4

#### Task 4.2.6: Notifications
- Send renewal reminders
- **Dependencies:** Task 4.2.2

---

### 4.3 Portfolio Dashboard (Week 30-32)

#### Task 4.3.1: Backend API
- Create portfolio-level analytics endpoints
- **Dependencies:** Task 1.4.1

#### Task 4.3.2: Frontend - Portfolio Overview
- Build portfolio dashboard with property comparison
- **Dependencies:** Task 4.3.1

#### Task 4.3.3: Frontend - Performance Metrics
- Display ROI, occupancy rate, cash flow charts
- **Dependencies:** Task 4.3.1

#### Task 4.3.4: Frontend - Property Comparison
- Side-by-side property comparison tool
- **Dependencies:** Task 4.3.1

---

### 4.4 Mobile Optimization (Week 33-36)

#### Task 4.4.1: Mobile Photo Upload
- Implement mobile-optimized photo upload
- **Dependencies:** Task 2.1.2

#### Task 4.4.2: Responsive Design Audit
- Review and fix all mobile layouts
- **Dependencies:** None

#### Task 4.4.3: Touch Gestures
- Add swipe gestures for navigation
- **Dependencies:** Task 4.4.2

#### Task 4.4.4: Mobile Testing
- Test on iOS and Android devices
- **Dependencies:** Task 4.4.1, Task 4.4.2, Task 4.4.3

---

## Cross-Sprint: Infrastructure & Quality

### Security & Compliance
- Implement GDPR compliance (data export, deletion)
- Regular security audits
- Automated vulnerability scanning

### Performance Monitoring
- Set up APM (Application Performance Monitoring)
- Configure alerts for errors and slowdowns
- Regular performance reviews

### Testing
- Maintain >80% code coverage
- Automated regression testing
- User acceptance testing before each release

### Documentation
- Keep API documentation updated (Swagger)
- Maintain developer onboarding guide
- Update user documentation with each release

---

## Notes

**MVP Definition:** Sprint 1 tasks represent the minimum viable product delivering core value proposition.

**Dependencies:** Tasks are sequenced to minimize blocking. Some tasks can be parallelized within sprints.

**Ambiguous Requirements:** 
- File storage costs need clarification (affects cloud storage decision)
- Multi-currency support timeline unclear (affects database schema)
- Offline mode requirements not specified (affects architecture)

**Risk Mitigation:**
- SQLite to PostgreSQL migration path planned
- Modular architecture allows feature toggles
- Regular user feedback loops built into release cycle
