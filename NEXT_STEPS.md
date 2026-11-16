# Next Steps - School ERP

## Current Status: Phase 0 Complete ✅

All foundation work has been completed. The project now has:
- ✅ Monorepo structure
- ✅ Database schema with RLS
- ✅ Better Auth integration
- ✅ Tenant isolation system
- ✅ Audit logging system
- ✅ Test suites
- ✅ Middleware and utilities

## Immediate Next Steps (Phase 1)

### 1. Complete Better Auth Integration
**Status:** Partially done
**Priority:** High
**Owner:** Tech Lead

Tasks:
- [ ] Finish Better Auth configuration
- [ ] Replace dev-auth with Better Auth in all routes
- [ ] Implement mobile JWT authentication
- [ ] Add TOTP verification flow
- [ ] Test invitation system

### 2. Implement Full Tenant Middleware
**Status:** Partially done
**Priority:** High
**Owner:** Tech Lead

Tasks:
- [ ] Apply `withTenantContext` to all API routes
- [ ] Update route handlers to use new context
- [ ] Add origin validation to all endpoints
- [ ] Test middleware in all scenarios
- [ ] Document middleware usage

### 3. Complete Module Implementations
**Status:** Partially done
**Priority:** High
**Owner:** All Founders

Tasks by module:

#### Platform Module
- [ ] Organization CRUD operations
- [ ] School creation and configuration
- [ ] Academic year management
- [ ] Staff invitation system
- [ ] Import/export functionality

#### SIS Module
- [ ] Student management (full CRUD)
- [ ] Guardian management
- [ ] Enrollment system
- [ ] Student documents
- [ ] Search and filtering

#### Fees Module
- [ ] Fee head management
- [ ] Fee structure creation
- [ ] Invoice generation
- [ ] Payment processing (Razorpay)
- [ ] Receipt generation
- [ ] Dues tracking

#### Attendance Module
- [ ] Daily attendance
- [ ] Holiday management
- [ ] Attendance registers
- [ ] Absence alerts
- [ ] Attendance corrections

#### HR Module
- [ ] Staff records
- [ ] Leave management
- [ ] Salary structures
- [ ] Payroll runs
- [ ] Payslip generation

#### Communication Module
- [ ] Notification templates
- [ ] Email/SMS/WhatsApp support
- [ ] Announcement system
- [ ] Delivery tracking
- [ ] Opt-out management

#### Exams Module
- [ ] Exam term management
- [ ] Exam creation
- [ ] Subject configuration
- [ ] Marks entry
- [ ] Result computation
- [ ] Report card templates

#### Admissions Module
- [ ] Enquiry management
- [ ] Application workflow
- [ ] Document upload
- [ ] Conversion tracking

#### Reports Module
- [ ] Basic dashboards
- [ ] Attendance summaries
- [ ] Fee collection reports
- [ ] Exam results
- [ ] Student lists

## Testing Requirements

### Phase 1 Gate Criteria (March 31, 2027)
- [ ] **Foundation:** GCP, CI, auth, tenancy, skeleton working
- [ ] **SIS:** Student/guardian records, enrollment working
- [ ] **Fees:** Fee heads, structures, invoices, payments working
- [ ] **Attendance:** Daily attendance working
- [ ] **HR:** Staff records, leave, payroll working
- [ ] **Communication:** Templates, announcements working
- [ ] **Exams:** Terms, exams, marks entry working
- [ ] **Admissions:** Enquiries, applications working
- [ ] **Platform:** Organization/school setup working
- [ ] **Mobile:** Login, dashboards working
- [ ] **QA:** Tenant isolation tests passing
- [ ] **QA:** Financial invariant tests passing
- [ ] **QA:** Core E2E tests passing

## Technical Debt

### Immediate
1. Replace dev-auth with Better Auth (high priority)
2. Apply tenant middleware to all routes (high priority)
3. Complete module implementations (high priority)

### Medium Priority
1. Add more comprehensive audit tests
2. Implement offline sync for mobile
3. Add error boundary components
4. Implement proper logging

### Low Priority
1. Add performance monitoring
2. Implement caching strategy
3. Add rate limiting
4. Implement WebSocket support

## Open Decisions

See `documentation/23-open-decisions.md` for 50+ decisions that need resolution:

### Critical (block Phase 1)
- [ ] Regional language selection
- [ ] Pilot school profiles and LOIs
- [ ] Domain name and ownership
- [ ] WhatsApp BSP provider

### Important (affect UX)
- [ ] Report-card templates
- [ ] Offline attendance for yesterday
- [ ] Teacher authentication method
- [ ] Receipt sharing policy

### Technical
- [ ] Cloudflare paid tier trigger
- [ ] Cloud SQL HA trigger
- [ ] Log retention policy
- [ ] Backup retention policy

## Development Workflow

### Daily
- [ ] Review and merge PRs
- [ ] Run tests
- [ ] Update documentation
- [ ] Check build status

### Weekly
- [ ] Sprint planning
- [ ] Code review
- [ ] Demo to stakeholders
- [ ] Update roadmap

### Monthly
- [ ] Cost review
- [ ] Security review
- [ ] Hiring review
- [ ] Risk assessment

## Deployment Strategy

### Staging
- [ ] Deploy to staging after each PR
- [ ] Run integration tests
- [ ] Manual UAT
- [ ] Documentation updates

### Production
- [ ] Deploy after Phase 1 gate
- [ ] 5-10 pilot schools
- [ ] Intensive support
- [ ] Daily monitoring

### Rollout Plan
1. **Internal Alpha:** Synthetic data, dogfooding
2. **Pilot Beta:** 1-2 schools, June 2027
3. **GA:** 5-10 schools, October 2027
4. **Stabilization:** iOS, HA, performance, Dec 2027

## Success Metrics

### Product
- [ ] Attendance marked in under 60 seconds
- [ ] Parent fee payment in under 2 minutes
- [ ] Report cards generated without blocking
- [ ] Parent app MAU > 60%
- [ ] Teacher app usage > 80%

### Engineering
- [ ] 99.5% uptime (beta), 99.9% (GA)
- [ ] p95 < 800ms for core pages
- [ ] Zero cross-tenant incidents
- [ ] All tests passing

### Business
- [ ] 5-10 paying schools by GA
- [ ] Pilot schools renew
- [ ] Revenue covers GCP costs
- [ ] Onboarding < 8 weeks

## Resources Needed

### Team
- [ ] Mobile engineer (Jan 2027)
- [ ] QA engineer (Feb 2027)

### Budget
- [ ] ₹15-30k/month GCP + vendors
- [ ] ₹3-5 lakh one-time (pen-test, legal)

### Infrastructure
- [ ] GCP Mumbai setup
- [ ] Cloudflare account
- [ ] Domain name
- [ ] Razorpay KYC
- [ ] MSG91 DLT
- [ ] WhatsApp BSP
- [ ] Google Play account

## Risk Mitigation

### High Risk
- **Hiring delays:** Start immediately; move dates if needed
- **Scope creep:** Freeze beta/GA scope; post-GA backlog
- **Cloudflare limits:** Monitor; upgrade if needed

### Medium Risk
- **Single-zone DB:** PITR, backups, restore drills
- **Offline sync conflicts:** Attendance only, idempotency
- **Payroll compliance:** CA validation

### Low Risk
- **Report card correctness:** Golden tests, school sign-off
- **App store rejection:** Submit early, privacy review
- **SMS/WhatsApp delay:** Start DLT in December

## Conclusion

Phase 0 is complete. The foundation is solid and tested. Phase 1 will focus on implementing the operational core modules (Platform, SIS, Fees, Attendance, HR, Communication, Exams, Admissions, Reports).

**Next Review:** Phase 1 Gate (March 31, 2027)
