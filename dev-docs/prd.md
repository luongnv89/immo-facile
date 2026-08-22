# Product Requirements Document: ImmoFacile Enhanced Platform

**Version:** 2.0  
**Date:** October 8, 2025  
**Author:** Product Team  
**Status:** Draft for Review  

---

## Product Overview

**Product Vision:** Transform ImmoFacile from a simple receipt generator into the leading all-in-one rental property management platform for French landlords, automating administrative tasks, ensuring legal compliance, and providing actionable financial insights.

**Target Users:** 
- Primary: Independent landlords managing 1-5 rental properties in France
- Secondary: Property portfolio managers with 5+ properties
- Tertiary: Accountants and financial advisors working with landlords

**Business Objectives:**
- Increase user retention by 40% through expanded feature set
- Reduce time spent on administrative tasks by 60%
- Achieve 80% feature adoption rate within 6 months of launch
- Position as the go-to solution for French rental property management
- Enable monetization through premium tier subscriptions

**Success Metrics:**
- Monthly Active Users (MAU) growth: 25% quarter-over-quarter
- User retention rate: >75% after 6 months
- Feature adoption: >60% of users using at least 3 new features
- Customer Satisfaction Score (CSAT): >4.5/5
- Net Promoter Score (NPS): >50
- Average session duration: >15 minutes
- Reduction in support tickets related to manual processes: 50%

---

## User Personas

### Persona 1: Marie Dubois - The Independent Landlord
- **Demographics:** 42 years old, works full-time as a teacher, owns 2 rental apartments in Lyon, moderate technical proficiency
- **Goals:** 
  - Minimize time spent on rental management (< 2 hours/month)
  - Ensure legal compliance with French rental laws
  - Track finances for tax declaration
  - Maintain good tenant relationships
- **Pain Points:** 
  - Manually tracking payments and sending reminders
  - Forgetting important dates (lease renewals, maintenance)
  - Difficulty organizing receipts and documents for taxes
  - Uncertainty about legal requirements (IRL increases, deposit returns)
  - No clear view of profitability per property
- **User Journey:** Logs in monthly to generate receipts → checks payment status → reviews financial dashboard → handles occasional maintenance requests
- **Quote:** *"I need something simple that just works. I don't have time to learn complex software."*

### Persona 2: Thomas Laurent - The Portfolio Manager
- **Demographics:** 38 years old, manages 12 properties as a side business, high technical proficiency
- **Goals:**
  - Maximize ROI across portfolio
  - Scale operations efficiently
  - Compare property performance
  - Delegate tasks to accountant/assistant
- **Pain Points:**
  - Lack of portfolio-level insights
  - Manual data entry across multiple properties
  - Difficulty identifying underperforming properties
  - No centralized document storage
  - Time-consuming expense tracking
- **User Journey:** Daily dashboard check → weekly financial review → monthly portfolio analysis → quarterly tax preparation
- **Quote:** *"I need data-driven insights to make better investment decisions."*

### Persona 3: Sophie Martin - The Accountant
- **Demographics:** 35 years old, accountant specializing in real estate, very high technical proficiency
- **Goals:**
  - Access clean, organized financial data
  - Export reports for tax filing
  - Minimize back-and-forth with clients
  - Ensure compliance with French tax regulations
- **Pain Points:**
  - Clients provide disorganized receipts
  - Manual data entry from various sources
  - Difficulty reconciling income and expenses
  - Missing documentation during tax season
- **User Journey:** Quarterly access to client accounts → export financial data → review for accuracy → prepare tax documents
- **Quote:** *"If the data is clean and exportable, I can save hours per client."*

---

## Feature Requirements

See detailed feature table in implementation documentation.

**Must-Have Features (MVP):**
1. Payment Tracking System
2. Automated Payment Reminders  
3. Expense Tracking System
4. Financial Dashboard
5. Accounting Export

**Should-Have Features (v1.1-v1.2):**
6. Maintenance Request Tracking
7. Document Management
8. Lease Management & Alerts
9. Calendar & Task Management
10. IRL Rent Increase Calculator
11. Deposit Management
12. Mobile Photo Upload

**Could-Have Features (v2.0+):**
13. Contract Template Generator
14. Multi-User & Role-Based Access
15. Insurance Policy Tracking
16. Portfolio Overview Dashboard

---

## Non-Functional Requirements

### Performance
- Page Load Time: < 2 seconds for dashboard on 4G connection
- API Response Time: < 500ms for 95th percentile
- Concurrent Users: Support 1,000 simultaneous users
- Database Query Time: < 100ms for complex financial queries
- File Upload: Support files up to 10MB with progress indicator
- Export Generation: < 5 seconds for reports with up to 1 year of data

### Security
- JWT-based authentication with 24-hour token expiry
- Secure password requirements (min 8 chars, uppercase, number, special char)
- Role-based access control (RBAC)
- All data encrypted at rest (AES-256) and in transit (TLS 1.3)
- GDPR compliance for EU users
- Regular automated backups (daily)

### Compatibility
- Devices: Desktop, tablet, smartphone (iOS 14+, Android 10+)
- Browsers: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Screen Sizes: Mobile (375px-767px), Tablet (768px-1024px), Desktop (1025px+)

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation for all features
- Screen reader compatibility (ARIA labels)
- Color contrast ratio ≥ 4.5:1 for text

---

## Technical Specifications

### Frontend
- **Stack:** React 18+, Redux Toolkit, React Router v6, Vite
- **UI Libraries:** Recharts, React Big Calendar, React Dropzone, Heroicons, TailwindCSS
- **Design:** Mobile-first, responsive breakpoints, touch-friendly targets (min 44x44px)

### Backend
- **Stack:** Node.js 18+ LTS, Express.js 4.x, SQLite 3.x (migration path to PostgreSQL)
- **API:** RESTful, JSON format, versioning (/api/v1/), rate limiting (100 req/min/user)
- **Auth:** JWT tokens with refresh mechanism, bcrypt password hashing

### Database Schema
```
Key Tables:
- receipts (payment_status, payment_date, tracking_token, email_opened, ...)
- tenants (leaseStartDate, leaseEndDate, apartment_id, ...)
- apartments (name, address, city, postalCode, ...)
- expenses (category, amount, expense_date, receipt_file_path, ...)
- maintenance_requests (status, priority, estimated_cost, ...)
- documents (entity_type, entity_id, document_type, file_path, expiry_date, ...)
- users (email, password_hash, role, ...)
- insurance_policies (policy_type, provider, start_date, end_date, ...)
- calendar_events (event_type, title, event_date, ...)
```

### Infrastructure
- **Hosting:** Node.js server (VPS/cloud), Static hosting (Vercel/Netlify)
- **File Storage:** Local filesystem for MVP, migration path to AWS S3
- **CI/CD:** GitHub Actions, staging environment, blue-green deployment
- **Monitoring:** APM, error tracking (Sentry), uptime monitoring, log aggregation

### Third-Party Integrations
- Email: Nodemailer with SMTP (Gmail, SendGrid, Mailgun)
- PDF: PDFMake or Puppeteer
- Cron: node-cron for scheduled tasks
- File Upload: Multer middleware
- Export: ExcelJS for Excel generation
- Charts: Recharts

---

## Analytics & Monitoring

### Key Metrics
- **User Engagement:** DAU, MAU, DAU/MAU ratio, avg session duration
- **Feature Adoption:** % using payment tracking, expense tracking, dashboard, maintenance
- **Business:** Conversion rate, churn rate, CLV, MRR, NRR
- **Performance:** API response times (p50, p95, p99), error rates, page load times

### Events to Track
- User: signup, login, receipt_generated, payment_recorded, expense_added, maintenance_created, document_uploaded, report_exported
- System: email_sent, email_opened, reminder_sent, alert_triggered, error_occurred

### Dashboards
- Product: User growth, feature adoption funnel, retention cohorts
- Technical: API performance, error rates, database performance
- Business: Revenue metrics, conversion funnel, churn analysis

### Alerting
- Critical: API error rate >1%, server downtime, DB failures
- Warning: API response time >1s (p95), disk space >80%, error spikes
- Business: Daily signup drops, churn rate >5%/week, low feature adoption

---

## Release Planning

### MVP (v1.0) - Week 12
**Features:**
1. Payment Tracking System
2. Automated Payment Reminders
3. Expense Tracking System
4. Financial Dashboard
5. Accounting Export

**Success Criteria:**
- 100% of users can access new features
- <5% error rate
- >40% try at least one new feature in first week
- Payment tracking reduces late payment inquiries by 30%
- Dashboard viewed by >60% of active users

**Timeline:**
- Week 1-3: Payment tracking & reminders
- Week 4-6: Expense tracking
- Week 7-9: Financial dashboard
- Week 10-11: Accounting export
- Week 12: Testing, bug fixes, launch

### v1.1 - Week 18 (6 weeks after MVP)
**Features:**
1. Maintenance Request Tracking
2. Document Management
3. Lease Management

**Success Criteria:**
- >50% upload at least one document
- >30% create at least one maintenance request
- Lease alerts reduce missed renewals by 80%

### v1.2 - Week 24 (6 weeks after v1.1)
**Features:**
1. Calendar & Task Management
2. French Legal Compliance Tools (IRL calculator, deposit management, DPE)
3. Contract Template Generator

**Success Criteria:**
- >40% access calendar weekly
- >70% with renewals use IRL calculator
- >50% generate at least one contract

### v2.0 - Week 36 (12 weeks after v1.2)
**Features:**
1. Multi-User & Role-Based Access
2. Insurance Policy Tracking
3. Portfolio Overview Dashboard
4. Mobile Optimization

**Success Criteria:**
- >20% of portfolio managers add users
- >60% with multiple properties use portfolio dashboard
- Mobile usage >30% of total traffic

### Future Roadmap (v2.1+)
- Tenant self-service portal
- Online rent payment (Stripe, PayPal)
- Bank transaction import
- Marketplace integration (Leboncoin, SeLoger)
- AI-powered expense categorization
- Mobile native apps
- Multi-language support

---

## Open Questions & Assumptions

### Open Questions
1. Acceptable cost per user for file storage? (Decision by Week 4)
2. Support multiple currencies for international expansion? (Decision by Week 8)
3. Email template customization level? (Decision by Week 2)
4. Integrate with French government APIs for IRL data? (Decision by Week 16)
5. Target price point for premium features? (Decision by Week 10)
6. Support offline mode for mobile? (Decision by Week 20)

### Assumptions
1. Users have basic email and file management skills (Low risk)
2. SQLite handles data volume for MVP and v1.x (Medium risk - migration path planned)
3. Users primarily access via desktop (Medium risk - responsive design from MVP)
4. French legal requirements remain stable (Low risk - configurable design)
5. Users adopt features without extensive training (Medium risk - in-app help planned)
6. Nodemailer handles reminder volume (Medium risk - migration path to SendGrid)
7. Users trust platform with financial data (High risk - robust security essential)

---

## Appendix

### Competitive Analysis

**Rentila:**
- Strengths: Established brand, comprehensive features, mobile apps, banking integration
- Weaknesses: Complex interface, higher pricing (€15-30/month), slow support
- Our Edge: Simpler interface, lower pricing, faster development, better mobile UX

**Gererseul:**
- Strengths: Free tier, good reporting, legal compliance, active community
- Weaknesses: Outdated UI, limited automation, no mobile app, poor docs
- Our Edge: Modern interface, advanced automation, superior organization, mobile-first

**Locatme:**
- Strengths: Legal compliance focus, excellent templates, good support, notary integration
- Weaknesses: Expensive (€25+/month), overkill for small landlords, slow, limited analytics
- Our Edge: Right-sized, better insights, faster platform, competitive pricing

### User Research Findings

1. **Payment Tracking Critical:** 92% cite "knowing who paid" as #1 pain (n=25 interviews)
2. **Tax Prep Time-Consuming:** Average 8 hours annually preparing tax docs (n=150 survey)
3. **Maintenance Chaotic:** 70% use WhatsApp/email, lose track of requests (n=10 observations)
4. **Legal Compliance Anxiety:** 65% unsure about requirements (IRL, deposits, DPE) (n=25 interviews)
5. **Mobile Important Not Critical:** 25% mobile access, 80% prefer desktop for complex tasks (analytics data)

### AI Research Insights

**Round 1 - Market Analysis:**
- 3.2M French landlords, 60% manage <3 properties
- Gap between complex enterprise and basic spreadsheet solutions
- Growing automation demand, legal compliance concerns post-2023 reforms

**Round 2 - Feature Prioritization (RICE Scores):**
1. Payment Tracking: 85
2. Financial Dashboard: 80
3. Expense Tracking: 75
4. Accounting Export: 70
5. Maintenance Tracking: 65

**Round 3 - Technical Feasibility:**
- SQLite sufficient for MVP/v1.x (tested to 100K records)
- Node.js + React well-suited for rapid development
- 12-week MVP timeline aggressive but achievable

**Round 4 - Edge Cases Identified:**
- Payment: Cash payments, partial payments, chargebacks, currency conversion
- Expenses: Shared across properties, variable recurring, foreign currency
- Maintenance: Emergency requests, multi-apartment issues, duplicate requests
- Lease: Rent decreases, early termination, co-tenant scenarios
- Documents: Size limits, unsupported formats, GDPR compliance

**Round 5 - Holistic Review:**
- ✅ Vision aligns with personas and objectives
- ✅ Features map to pain points
- ✅ Technical specs support requirements
- ✅ Release planning follows dependencies
- ✅ Metrics are measurable and tied to goals

**AI-Suggested Improvements:**
1. Add user onboarding flow
2. Include data migration plan from spreadsheets
3. Define customer support strategy
4. Add security audit schedule
5. Include user feedback loop in releases
6. Define rollback procedures
7. Add internationalization plan

### Glossary

- **IRL:** Indice de Référence des Loyers (French rental reference index)
- **DPE:** Diagnostic de Performance Énergétique (Energy Performance Certificate)
- **Copropriété:** Condominium association fees
- **Quittance de loyer:** Rent receipt
- **MoSCoW:** Must-have, Should-have, Could-have, Won't-have prioritization
- **RICE:** Reach, Impact, Confidence, Effort prioritization framework
- **WCAG:** Web Content Accessibility Guidelines
- **JWT:** JSON Web Token for authentication
- **RBAC:** Role-Based Access Control
- **GDPR:** General Data Protection Regulation
- **DAU/MAU:** Daily/Monthly Active Users
- **MRR/ARR:** Monthly/Annual Recurring Revenue
- **CLV:** Customer Lifetime Value
- **NPS:** Net Promoter Score
- **CSAT:** Customer Satisfaction Score

---

**Document Approval:**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Manager | [Name] | _________ | _____ |
| Engineering Lead | [Name] | _________ | _____ |
| Design Lead | [Name] | _________ | _____ |
| Business Owner | [Name] | _________ | _____ |

**Version History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-08 | Product Team | Initial draft based on new features analysis |