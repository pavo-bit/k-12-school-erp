# Pilot Onboarding and Migration

**Status:** Baseline  
**Owner:** Product / Implementation  
**Related:** [16-delivery-roadmap.md](16-delivery-roadmap.md), [17-team-and-hiring-plan.md](17-team-and-hiring-plan.md), [19-risk-register.md](19-risk-register.md), [modules/platform-and-onboarding.md](modules/platform-and-onboarding.md)

---

## 1. Purpose

Take a school from signed agreement to confident daily use in six to eight weeks—four to six weeks to cutover plus two weeks of hypercare—with clean data, trained staff, and a cutover that does not disrupt fees or attendance. The playbook is repeatable and becomes the basis for post-GA onboarding.

## 2. Onboarding Principles

1. **One named owner on each side.** No diffuse responsibility.
2. **Data quality before configuration.** Bad data creates support tickets for months.
3. **Dry run twice, then cut over.** Never import directly into production without a reconciled rehearsal.
4. **Train by role, not by feature.** Teachers learn attendance, accountants learn collection.
5. **Parallel run only where necessary.** Fees may run in parallel briefly; attendance should not.
6. **Hypercare is part of launch.** The first two weeks decide adoption.
7. **No code forks.** School needs are met through configuration, templates, and the roadmap.

## 3. Pilot Selection Criteria

Ideal pilot school:

- 500–3,000 students, one to three branches
- CBSE, ICSE, or State board with standard academic structure
- Principal or owner is the champion and can make decisions
- Accountant and office staff willing to provide data and attend training
- Parents predominantly on Android phones
- Reasonable network at school, with awareness of offline attendance
- Willing to give structured feedback and act as a reference if successful
- Not mid-way through a major ERP migration or ownership dispute
- Fee cycle and academic calendar align with the beta window

Avoid for the first pilot:

- Highly customized academic or fee models
- Boarding schools with hostel complexity
- Schools requiring transport, library, or LMS on day one
- Schools with unresolved data ownership or staff resistance
- Schools that demand per-school custom code

## 4. Agreement and Responsibilities

**Letter of Intent / pilot agreement should cover:**

- Scope and modules for the pilot
- Dates and success criteria
- Pilot fee or discount
- Named school owners
- Data processing terms and consent
- Data ownership and export on exit
- Support hours and escalation
- Feedback commitment
- Reference and case-study permission (optional)
- Termination and rollback terms

**Platform responsibilities**

- Configuration, import tooling, training, and support
- Data protection and confidentiality
- Bug fixes and agreed enhancements
- Cutover and hypercare
- Clear communication of limitations

**School responsibilities**

- Provide complete, accurate data in the agreed templates
- Assign a project owner and module owners
- Attend training and complete UAT
- Confirm fee structures, opening dues, and payroll inputs
- Communicate changes to staff and parents
- Provide timely feedback and sign-off

## 5. Onboarding Timeline

| Week | Phase                     | Key activities                                                    |
| ---- | ------------------------- | ----------------------------------------------------------------- |
| 0    | Kickoff                   | Introductions, scope, owners, timeline, data templates            |
| 1    | Discovery                 | School profile, calendar, classes, fees, payroll, branding, roles |
| 2    | Data collection           | Student/guardian/staff/fee data, documents, timetable             |
| 3    | Configuration             | School, academic year, classes, subjects, fee heads, templates    |
| 4    | Import dry run            | Validate, clean, reconcile counts and totals                      |
| 5    | UAT and training          | Role-based training, UAT scripts, fixes                           |
| 6    | Final dry run and cutover | Reconcile, freeze old data, go live                               |
| 7–8  | Hypercare                 | Daily check-ins, issue triage, adoption support                   |

Small schools may compress to four weeks by combining discovery and configuration; complex schools should plan the full eight weeks.

## 6. Discovery Checklist

### School profile

- Legal name, address, board, affiliation number
- Logo, brand colors, receipt header/footer
- Timezone, currency, locale, academic year dates
- Branches and organization structure
- Website and support contacts
- Bank account and receipt signatory

### Academics

- Classes, sections, streams (if any)
- Subjects per class, electives, optional subjects
- Grading scheme and pass criteria
- Exam terms and report-card samples
- Timetable format and periods
- Holidays and events
- Attendance rules, cutoffs, and late/half-day policy

### Students and guardians

- Active students, admission numbers, dates of birth, gender, class/section, roll numbers
- Guardian names, relationships, phones, emails, addresses
- Sibling links
- Categories, house, transport opt-in (if relevant)
- Documents and photos
- Consent status

### Fees

- Fee heads and codes
- Class-wise fee structures
- Term/month frequency and due dates
- Concessions, scholarships, staff wards, siblings
- Opening dues and advance payments
- Receipt format and numbering convention
- Late fee policy
- Refund policy
- GST treatment per fee head
- Payment modes and collection points

### Staff and payroll

- Staff list, employee codes, designations, departments
- Joining dates, employment type, status
- Salary components and structures
- Leave types and policies
- Bank details and statutory IDs
- Payroll month and salary credit date
- CA contact and statutory export format
- Existing payslip sample

### Communication

- Sender identities (email, SMS, WhatsApp)
- DLT entity and template status
- Common messages and languages
- Escalation contacts
- Parent communication channels and preferences

### Operations

- School hours and attendance windows
- Devices and network availability
- IT support contact
- Support hours and preferred channel
- Data retention expectations

## 7. Data Migration Scope

**In scope for beta**

- Active students and guardians for the current academic year
- Class/section enrollment and roll numbers
- Staff records and current salary structures
- Fee heads, structures, concessions, and opening dues
- Current timetable
- School branding and templates
- Opening balances and prior payments reference (summary level)

**Out of scope for beta**

- Historical attendance and marks
- Full historical fee ledger
- Alumni records
- Transport, library, hostel data
- Biometric device data
- Scanned document archive beyond required current documents

Historical data can be exported from the old system by the school and retained outside the ERP. Historical import is evaluated post-GA.

## 8. Data Templates

| Template                | Required columns                                                                                    |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| `students.csv`          | admission_number, first_name, last_name, dob, gender, class, section, roll_number, status, category |
| `guardians.csv`         | admission_number, guardian_name, relationship, phone, email, is_primary, can_pay, address           |
| `staff.csv`             | employee_code, name, designation, department, joining_date, phone, email, employment_type, status   |
| `classes_sections.csv`  | class, section, capacity, class_teacher_employee_code                                               |
| `subjects.csv`          | class, subject, code, type, is_mandatory                                                            |
| `timetable.csv`         | class, section, day, period, start_time, end_time, subject, employee_code, room                     |
| `fee_structures.csv`    | class, fee_head, amount, frequency, due_date_rule                                                   |
| `opening_dues.csv`      | admission_number, fee_head, invoice_reference, amount, due_date, notes                              |
| `salary_structures.csv` | employee_code, effective_from, component, amount, percentage                                        |
| `concessions.csv`       | admission_number, fee_head, type, value, reason, valid_from, valid_to                               |

Templates include examples, validation rules, and a version number.

## 9. Data Validation Rules

- Admission numbers unique per school; no blanks.
- Dates in `YYYY-MM-DD` or `DD/MM/YYYY`, normalized on import.
- Phone numbers normalized to E.164; Indian numbers default to `+91`.
- Gender and status values from the allowed set.
- Class and section must exist or be created before import.
- Guardian phone must be valid; duplicate guardian phones are linked, not duplicated blindly.
- Fee head codes must exist.
- Amounts are positive integers in rupees in the template, converted to paise.
- Due dates must fall within the academic year or opening period.
- Salary components must match configured components.
- Duplicate detection by name + DOB + guardian phone; manual review required.
- Row-level errors are downloadable; commit is blocked on critical errors.

## 10. Migration Process

```mermaid
flowchart LR
  Extract[School provides data] --> Validate[Validate + clean]
  Validate --> Stage[Import to staging]
  Stage --> Reconcile[Reconcile counts and totals]
  Reconcile --> DryRun[School UAT dry run]
  DryRun --> Fix[Fix and repeat]
  Fix --> Signoff[Written sign-off]
  Signoff --> Production[Production import]
  Production --> Verify[Post-import verification]
```

### 10.1 Extract and map

- Receive files through a secure channel, not WhatsApp.
- Map columns to the template; document every transformation.
- Identify missing mandatory fields early.
- Confirm fee structure and opening dues with the accountant.

### 10.2 Stage and validate

- Import into staging with dry-run mode.
- Produce an error report with row numbers and reasons.
- Return to the school for correction; do not guess sensitive data.
- Repeat until the error rate is zero for critical fields.

### 10.3 Reconcile

Compare against the school’s source:

| Check                                     | Owner                |
| ----------------------------------------- | -------------------- |
| Student count by class/section            | School office        |
| Guardian count and duplicates             | School office        |
| Staff count and salary totals             | HR/accountant        |
| Fee demand by class and fee head          | Accountant           |
| Opening dues total                        | Accountant           |
| Concession total                          | Accountant           |
| Timetable periods and teacher assignments | Academic coordinator |

A reconciliation sheet is signed by the accountant and principal.

### 10.4 Production import

1. Freeze source data changes for 24 hours.
2. Take a final extract.
3. Run the validated import in production.
4. Verify counts and totals.
5. Generate sample invoices and receipts in a test student.
6. Confirm parent app linking for a sample of guardians.
7. Record the import job ID, file hash, and approver.

### 10.5 Opening dues

- Create invoices with the original reference in the description.
- Do not mark them as paid unless payment is verified.
- Record prior payments as offline payments with reference and date, if provided.
- Reconcile total dues against the school’s ledger.
- Document any difference and obtain sign-off.

## 11. Cutover Runbook

| Timing      | Activity                                                          |
| ----------- | ----------------------------------------------------------------- |
| T-14 days   | Final data request; confirm training dates; freeze scope          |
| T-10 days   | Configuration complete; first dry run                             |
| T-7 days    | UAT starts; issues triaged daily                                  |
| T-3 days    | Final dry run reconciled; sign-off                                |
| T-1 day     | Freeze source data; final extract; backup; communication to staff |
| T-0 morning | Production import; verify; enable staff access                    |
| T-0 midday  | Teacher training refresher; attendance live                       |
| T-0 evening | Verify attendance, collection, and notifications                  |
| T+1 day     | Hypercare call; fix issues; monitor adoption                      |
| T+7 days    | Week-one review; reconciliation; adjust configuration             |
| T+14 days   | Hypercare exit; normal support                                    |

**System of record:** from T-0, the ERP is authoritative for attendance and new fee transactions. The old system is read-only for reference.

## 12. Training Plan

| Audience          | Duration           | Content                                                               |
| ----------------- | ------------------ | --------------------------------------------------------------------- |
| Principal / owner | 60 min             | Dashboard, reports, approvals, audit, support                         |
| School admin      | 2 hours            | Setup, users, classes, imports, announcements, corrections            |
| Accountant        | 2 hours            | Fee structures, invoices, payments, receipts, reconciliation, reports |
| HR/payroll        | 2 hours            | Staff, leave, salary structures, payroll run, exports                 |
| Teachers          | 45 min             | Login, today’s classes, offline attendance, sync, leave, payslips     |
| Parents           | 15-min video + FAQ | Install, login, attendance, fees, receipts, notifications             |
| Front desk        | 60 min             | Student records, admissions, search, documents                        |

**Materials**

- Short role-based guides with screenshots
- 2–3 minute videos in English and Hindi
- Printable one-pager for the staff room
- Parent WhatsApp message and poster with QR code
- FAQ and support contacts
- Recorded training session

**Training rules**

- Use the school’s own staging data.
- Every participant completes the core task themselves.
- Leave time for questions and edge cases.
- Attendance is mandatory for class teachers before go-live.
- Identify two school “super users” who can help colleagues.

## 13. Go-Live Checklist

- [ ] School profile, logo, and receipt header verified
- [ ] Academic year active
- [ ] Classes, sections, subjects, and teacher assignments complete
- [ ] Students, guardians, and enrollments imported and reconciled
- [ ] Fee structures and opening dues reconciled
- [ ] Staff and salary structures complete
- [ ] Timetable imported or entered
- [ ] Notification templates approved; DLT/WhatsApp approved
- [ ] Roles and permissions assigned
- [ ] Admin, accountant, and teacher training complete
- [ ] Parent communication sent with app link and support contact
- [ ] Test attendance submitted and corrected
- [ ] Test invoice generated, paid in test mode, receipt verified
- [ ] Payroll dry run reviewed by CA
- [ ] Backups and restore verified
- [ ] Support contacts and escalation shared
- [ ] Go-live sign-off signed

## 14. Hypercare

| Period    | Cadence                   | Focus                                          |
| --------- | ------------------------- | ---------------------------------------------- |
| Week 1    | Daily 30-min call         | Attendance, login, fee collection, urgent bugs |
| Week 2    | Alternate-day call        | Adoption, reconciliation, training gaps        |
| Weeks 3–4 | Weekly stabilization call | Optimization, reports, feedback                |
| Week 5+   | Normal support            | Tickets, quarterly review                      |

Formal hypercare ends at T+14 days. Weeks 3–4 use a lighter weekly stabilization cadence before normal support begins.

**Hypercare metrics**

- Sections marked daily
- Teacher app sync success
- Parent activation
- Collection and receipt accuracy
- Ticket count and age
- P0/P1 incidents

**Exit criteria**

- Attendance adoption above 80% of sections
- Fee transactions reconciled for two consecutive weeks
- No open P0/P1
- School super users handling routine questions
- Principal sign-off

## 15. Success Criteria

| Dimension    | Target                                                               |
| ------------ | -------------------------------------------------------------------- |
| Attendance   | 80%+ of sections marked daily by week three                          |
| Fees         | 100% of new collections recorded with receipts; reconciliation clean |
| Parents      | 50%+ activation by week four                                         |
| Teachers     | 70%+ using the app for attendance                                    |
| Payroll      | One full cycle completed and accepted by CA                          |
| Support      | Tickets per week declining after week two                            |
| Satisfaction | Principal and accountant would recommend the pilot                   |
| Renewal      | School commits to continue for the next academic year                |

## 16. Rollback and Exit

If a critical failure cannot be resolved:

1. Declare with the school owner and platform lead.
2. Freeze new data entry.
3. Export students, fees, payments, attendance, and staff data.
4. Provide the school with the export in CSV/XLSX.
5. Restore the prior process for fees or attendance as agreed.
6. Preserve audit logs and data per retention policy.
7. Conduct a joint review and decide whether to retry.

**Do not** run two systems for more than two weeks; it creates reconciliation debt and staff confusion.

## 17. Data Privacy During Onboarding

- Use encrypted transfer or a secure upload link; no WhatsApp or personal email for student data.
- Limit access to the implementation team.
- Delete staging copies after go-live and sign-off.
- Do not use production data for demos.
- Anonymize training data where possible.
- Record consent status and retention instructions.
- Sign a DPA before receiving student data.

## 18. Common Pitfalls

| Pitfall                                  | Prevention                                                     |
| ---------------------------------------- | -------------------------------------------------------------- |
| Incomplete guardian phone numbers        | Validate early; make phone mandatory for at least one guardian |
| Fee structure differs by category/stream | Discover before configuration, not during import               |
| Opening dues don’t match ledgers         | Reconcile with the accountant and sign off                     |
| Teachers not trained                     | Mandatory training and super users                             |
| Parents don’t install the app            | School communication, QR poster, support desk                  |
| Duplicate students                       | Duplicate detection and manual review                          |
| Timetable changes after import           | Freeze near cutover; use effective dates                       |
| SMS templates not approved               | Start DLT/WhatsApp registration 8 weeks before                 |
| Network dead zones                       | Offline attendance and device testing                          |
| Scope creep during UAT                   | Log as enhancement; do not fork code                           |

## 19. Onboarding Tracker

Track per school:

- Kickoff date
- Discovery complete
- Data received and validated
- Configuration complete
- Dry run 1 and 2 reconciled
- UAT sign-off
- Training complete
- Cutover date
- Hypercare start/end
- Success criteria met
- Open risks and issues

## 20. Related Documents

- [16-delivery-roadmap.md](16-delivery-roadmap.md)
- [17-team-and-hiring-plan.md](17-team-and-hiring-plan.md)
- [19-risk-register.md](19-risk-register.md)
- [modules/platform-and-onboarding.md](modules/platform-and-onboarding.md)
- [modules/students-and-admissions.md](modules/students-and-admissions.md)
- [modules/fees-and-payments.md](modules/fees-and-payments.md)
