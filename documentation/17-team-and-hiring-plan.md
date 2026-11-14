# Team and Hiring Plan

**Status:** Baseline  
**Owner:** Founders  
**Related:** [16-delivery-roadmap.md](16-delivery-roadmap.md), [18-pilot-onboarding-and-migration.md](18-pilot-onboarding-and-migration.md), [19-risk-register.md](19-risk-register.md), [20-engineering-standards.md](20-engineering-standards.md)

---

## 1. Team Model

The project is delivered fully in-house. No development contractors. The initial team is deliberately small:

| Role                                 | Count | Start         |
| ------------------------------------ | ----- | ------------- |
| Founders (full-stack/product/design) | 3     | Now           |
| Mobile engineer                      | 1     | January 2027  |
| QA automation engineer               | 1     | February 2027 |
| **Total**                            | **5** |               |

Later hires are triggered by paying schools and support load, not by a fixed date.

## 2. Founder Roles

| Founder                                     | Primary ownership                                                                                               | Secondary                                                  |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **Founder 1 — Technical lead**              | Architecture, infrastructure, CI/CD, security, platform, fees/payments backend, database, performance           | Code review, incident command, vendor technical evaluation |
| **Founder 2 — Product and backend**         | Product scope, SIS, admissions, attendance, exams, HR/payroll, communication, requirements, pilot configuration | Customer discovery, pricing input, QA acceptance           |
| **Founder 3 — Product design and frontend** | UX/UI, design system, web frontend, parent/teacher app UX, onboarding experience, training material             | Marketing site, school branding, support content           |

Founders share on-call, code review, support, and hiring. No single point of failure is acceptable for production access, payroll exports, or payment reconciliation.

## 3. Role Descriptions

### 3.1 Mobile Engineer

**Mission:** Own the Android parent and teacher apps from architecture through Play Store release.

**Must have**

- 3+ years building production React Native apps
- Strong TypeScript
- Expo and Expo Router experience
- Android build, signing, and Play Store release experience
- Offline-first data sync, local databases, and conflict handling
- API integration, token refresh, and secure storage
- Testing with Jest/Vitest and Maestro or Detox
- Ability to work with a small backend team and shape API needs

**Nice to have**

- SQLCipher or encrypted local storage
- Razorpay or payment SDK integration
- FCM push notifications
- Accessibility and Hindi/regional localization
- Experience in education, fintech, or field-worker apps
- iOS experience for the post-GA phase

**First 90 days**

- Weeks 1–2: onboarding, ship a small app fix, learn the API and design system
- Weeks 3–6: parent app login, children, attendance, fees list
- Weeks 7–10: teacher app roster and online attendance
- Weeks 11–13: offline attendance spike and sync prototype; device test plan

### 3.2 QA Automation Engineer

**Mission:** Build and run the quality system that lets a small team release safely.

**Must have**

- 3+ years in software QA with automation ownership
- Playwright or equivalent web E2E experience
- API testing and contract validation
- Vitest/Jest or similar for integration tests
- CI/CD experience with GitHub Actions
- Clear bug reports and risk-based test design
- Ability to test mobile apps with Maestro or manual device matrices

**Nice to have**

- Tenant isolation, authorization, and security testing
- Financial or payroll domain testing
- Performance testing with k6
- Accessibility testing
- SQL proficiency for data verification
- Experience in a startup or small team

**First 90 days**

- Weeks 1–2: onboarding, test inventory, CI test stages
- Weeks 3–6: tenant isolation suite, financial invariant tests, core E2E
- Weeks 7–10: mobile test matrix, offline attendance scenarios
- Weeks 11–13: beta regression suite, release checklist, UAT coordination

## 4. Hiring Plan

### 4.1 Timeline

| Month         | Activity                                                          |
| ------------- | ----------------------------------------------------------------- |
| November 2026 | Finalize roles, scorecards, compensation bands, sourcing channels |
| December 2026 | Publish roles, screen, interviews, paid work sample               |
| January 2027  | Mobile engineer offer and start; QA final interviews              |
| February 2027 | QA engineer start; onboarding complete                            |
| March 2027    | Both hires productive in their first ownership area               |
| Post-GA       | Trigger-based hires (see section 9)                               |

### 4.2 Sourcing

- Founder networks and referrals
- LinkedIn and well-known Indian tech communities
- React Native and testing communities
- College alumni groups
- Freelance-to-hire is **not** used for core development; contract work is limited to design, legal, CA, and penetration testing

### 4.3 Process

| Stage                 | Duration        | Focus                                                       |
| --------------------- | --------------- | ----------------------------------------------------------- |
| Screen                | 30 min          | Motivation, communication, relevant experience              |
| Technical interview   | 60 min          | TypeScript, React Native/QA fundamentals, debugging         |
| Practical exercise    | 4–6 hours, paid | Build or test a small realistic feature; no production work |
| System/quality design | 60 min          | Offline sync, test strategy, trade-offs                     |
| Team fit              | 30 min          | Ownership, feedback, small-team collaboration               |
| References            | 2 calls         | Reliability and collaboration                               |
| Offer                 | —               | Compensation, start date, equipment                         |

**Rules**

- No unpaid take-home work longer than two hours.
- Scorecards are completed before debrief.
- Decision within five working days of the final interview.
- Every candidate receives a response.
- Offers include a 90-day plan and a named onboarding buddy.

### 4.4 Compensation Approach

- Benchmark against Indian startup market for the role and city; review annually.
- Early hires receive meaningful ESOP with a standard four-year vest and one-year cliff.
- No misleading “market rate plus equity” offers; cash and equity are explained separately.
- Compensation bands are documented internally and reviewed each year.
- Salaries are excluded from the ₹15–30k monthly cloud budget.

## 5. Capacity Plan

Gross capacity over 11 months:

| Role            | Months                           | Person-months |
| --------------- | -------------------------------- | ------------- |
| Founder 1       | 11                               | 11            |
| Founder 2       | 11                               | 11            |
| Founder 3       | 11                               | 11            |
| Mobile engineer | 10 (from Jan, net of onboarding) | 10            |
| QA engineer     | 9 (from Feb, net of onboarding)  | 9             |
| **Gross**       |                                  | **52**        |

Productive capacity after onboarding, leave, support, and meetings: approximately **42–44 person-months**.

Planned allocation:

| Area                                    | Person-months |
| --------------------------------------- | ------------- |
| Platform, auth, tenancy, infrastructure | 6             |
| SIS, admissions                         | 5             |
| Fees and payments                       | 6             |
| Attendance and timetable                | 4             |
| Exams and report cards                  | 4             |
| HR and payroll                          | 3             |
| Communication                           | 2             |
| Reports and dashboards                  | 2             |
| Mobile apps                             | 8             |
| QA and release                          | 6             |
| Security, performance, hardening        | 3             |
| Pilot onboarding and support            | 4             |
| **Total**                               | **53**        |

The plan is tight. The scope trade list in [16-delivery-roadmap.md](16-delivery-roadmap.md) exists because capacity has little slack. The buffer comes from founders working beyond nominal hours during alpha and beta—sustainable for a short period, not for a year.

## 6. RACI

**R** = responsible, **A** = accountable, **C** = consulted, **I** = informed.

| Area                    | F1  | F2  | F3  | Mobile | QA  |
| ----------------------- | --- | --- | --- | ------ | --- |
| Architecture and infra  | A/R | C   | I   | I      | C   |
| Product scope           | C   | A/R | C   | I      | C   |
| Design system           | C   | C   | A/R | C      | I   |
| Platform and auth       | A/R | C   | I   | C      | C   |
| SIS and admissions      | C   | A/R | C   | I      | C   |
| Fees and payments       | A/R | R   | I   | C      | C   |
| Attendance              | C   | A/R | I   | R      | C   |
| Exams and report cards  | C   | A/R | C   | C      | C   |
| HR and payroll          | A/R | R   | I   | I      | C   |
| Communication           | R   | A/R | C   | C      | C   |
| Mobile apps             | C   | C   | C   | A/R    | C   |
| Web frontend            | C   | C   | A/R | I      | C   |
| QA and release          | C   | C   | I   | C      | A/R |
| Security and compliance | A/R | C   | I   | C      | C   |
| Pilot onboarding        | C   | R   | A/R | C      | C   |
| Commercial              | C   | A/R | C   | I      | I   |

## 7. Working Cadence

| Ceremony             | When                   | Duration | Output                          |
| -------------------- | ---------------------- | -------- | ------------------------------- |
| Async standup        | Daily 09:30            | 15 min   | Blockers, plan                  |
| Weekly planning      | Monday 10:00           | 60 min   | Priorities, owners              |
| Demo                 | Friday 16:00           | 30 min   | Working software, feedback      |
| Retro                | Every two weeks        | 45 min   | Actions with owners             |
| Roadmap/risk review  | Weekly                 | 30 min   | Updated risks and dates         |
| Cost/security review | Monthly                | 45 min   | Budget, access, vulnerabilities |
| Pilot check-in       | Daily during hypercare | 15 min   | School issues, adoption         |
| Quarterly planning   | Quarterly              | Half day | Next-quarter goals              |

**Focus time:** no recurring meetings before 11:00 except standup; two no-meeting afternoons per week.

## 8. Onboarding Plan

### 8.1 First day

- Accounts: GitHub, GCP (least privilege), Sentry, staging, Play Console (as needed)
- Hardware and development environment
- Read `00`, `01`, `04`, `05`, `20`, `22`
- Buddy assigned
- First small task scoped

### 8.2 First 30 days

- Ship at least three small changes to production or staging
- Complete a code review shadowing rotation
- Understand tenant model, auth, and deploy process
- Run the test suite and one E2E suite
- Attend a pilot or customer call as an observer

### 8.3 First 60 days

- Own a feature from spec to staging
- Write or extend a runbook
- Participate in on-call shadowing
- Improve one developer-experience pain point

### 8.4 First 90 days

- Own a module area or mobile surface
- Lead a release or QA cycle
- Propose one quality or reliability improvement
- Complete a performance and growth check-in

## 9. Trigger-Based Future Hires

| Hire                         | Trigger                                  | Why                                         |
| ---------------------------- | ---------------------------------------- | ------------------------------------------- |
| Implementation/support lead  | 10 paying schools or 30+ tickets/week    | Founders must stop doing routine onboarding |
| Second QA / release engineer | 15 schools or weekly release load        | Mobile + web + regression coverage          |
| Backend/full-stack engineer  | 20 schools or roadmap backlog > 2 months | Module velocity and reliability             |
| Customer success             | 20 schools                               | Retention, renewals, adoption               |
| Part-time designer           | 15 schools or marketing site scope       | Founder 3 overload                          |
| DevOps/SRE                   | 30 schools or HA complexity              | Reliability and security depth              |

Consultants allowed (not core development):

- Chartered accountant for payroll statutory review
- Lawyer for DPDP, contracts, and terms
- Penetration-test firm
- Accessibility auditor
- Accountant/bookkeeper for the company

## 10. Knowledge Management

- Documentation lives in the repo and is updated in the same PR as the change.
- ADRs record significant decisions.
- Runbooks are tested during incidents and drills.
- Every module has a named owner and a backup.
- Demo recordings and release notes are archived.
- No critical knowledge only in WhatsApp or someone’s head.
- Bus factor: at least two people can deploy, restore the database, and process a payment incident.

## 11. Performance and Development

- Monthly 1:1 with each founder/team member.
- Clear quarterly goals tied to roadmap.
- Feedback is specific and timely; no annual-surprise reviews.
- Learning budget for courses, conferences, and books within reason.
- Engineers are encouraged to own a module end to end, including tests and operations.
- Burnout is a delivery risk: track on-call load and consecutive weekend work.

## 12. Hiring Risks

| Risk                      | Mitigation                                                                                                      |
| ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Mobile hire delayed       | Start sourcing now; contract only for non-core design if needed; move beta date rather than ship unowned mobile |
| QA hire delayed           | Founders cover critical tests; reduce beta scope; do not skip isolation or financial suites                     |
| Small team bus factor     | Pairing, runbooks, shared on-call, documented decisions                                                         |
| Compensation mismatch     | Benchmark early, be transparent, offer meaningful equity                                                        |
| Onboarding slows delivery | Start hires before the critical phase; assign buddy and scoped first tasks                                      |
| Founder overload          | Protect focus time, cut scope, hire at triggers                                                                 |

## 13. Related Documents

- [16-delivery-roadmap.md](16-delivery-roadmap.md)
- [18-pilot-onboarding-and-migration.md](18-pilot-onboarding-and-migration.md)
- [19-risk-register.md](19-risk-register.md)
- [20-engineering-standards.md](20-engineering-standards.md)
