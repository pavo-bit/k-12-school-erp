# Personas and User Journeys

**Status:** Baseline  
**Owner:** Product / Design  
**Related:** [01-product-vision-and-scope.md](01-product-vision-and-scope.md), [modules/](modules/README.md), [21-ui-ux-guidelines.md](21-ui-ux-guidelines.md)

---

## 1. Personas

| Persona                              | Goals                                                            | Pain points                                             | Primary surfaces       |
| ------------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------- | ---------------------- |
| **Platform admin**                   | Onboard schools, manage plans, support customers, monitor health | Manual tenant setup, unclear usage, risky impersonation | Platform console       |
| **Trust owner / organization admin** | Compare branches, control costs, standardize operations          | No consolidated view; inconsistent processes            | Organization dashboard |
| **Principal / school admin**         | Run the school smoothly, improve parent trust, see performance   | Fragmented data, late fee reports, teacher resistance   | Web admin, mobile web  |
| **Accountant**                       | Collect fees accurately, reconcile payments, run payroll         | Missing receipts, mismatched dues, manual follow-up     | Web admin, reports     |
| **Teacher**                          | Mark attendance quickly, enter marks, communicate with parents   | Slow systems, poor connectivity, duplicate data entry   | Teacher app, web       |
| **Class teacher**                    | Track their section, follow up absentees, consolidate marks      | No single section view; manual follow-up                | Teacher app, web       |
| **Front desk / admissions**          | Capture enquiries, follow up, convert applications               | Paper forms, missed leads, duplicate records            | Web admin              |
| **HR / payroll officer**             | Maintain staff data, run payroll, produce statutory exports      | Spreadsheet errors, compliance changes                  | Web admin              |
| **Parent / guardian**                | Pay fees, see attendance and results, receive updates            | Lost receipts, no visibility, too many WhatsApp groups  | Parent app             |
| **Student**                          | See timetable, results, homework                                 | Not a launch persona                                    | Future student portal  |

### Persona priorities for beta

1. Teacher — attendance must be effortless.
2. Parent — fees and attendance must be obvious.
3. Accountant — money must reconcile.
4. Principal — needs a trustworthy daily view.
5. Platform admin — must onboard a school without engineering help.

---

## 2. Journey: Platform Onboards a New School

**Actor:** Platform admin  
**Goal:** A school is live with its own subdomain, branding, academic year, classes, staff, and imported students.

1. Platform admin creates the organization and school.
2. Enters school profile, board, address, timezone, currency, and academic year dates.
3. Uploads logo and selects brand colors.
4. System reserves the school slug and creates `{slug}.erp.com`.
5. Platform admin invites the principal and accountant by email/phone.
6. School admin sets up classes, sections, subjects, and teacher assignments.
7. School admin imports students and guardians from an Excel template.
8. Import runs a dry run, shows errors, and requires confirmation.
9. School admin configures fee heads, structures, and opening dues.
10. School admin configures notification templates and sender identities.
11. Platform admin runs a go-live checklist.
12. School admin marks a test attendance and collects a test payment.
13. School goes live.

**Success criteria**

- School workspace is provisioned in under one working day once data and configuration are ready; full onboarding follows the six-to-eight-week playbook in [18-pilot-onboarding-and-migration.md](18-pilot-onboarding-and-migration.md).
- No engineering involvement for standard onboarding.
- Tenant isolation and branding verified.
- Audit log records all setup actions.

**Edge cases**

- Duplicate school slug
- Invalid academic year dates
- Import errors or duplicate students
- Missing fee structure
- SMS/WhatsApp templates not approved

---

## 3. Journey: Parent Pays Fees

**Actor:** Parent  
**Goal:** Pay the current dues and get a receipt without visiting school.

1. Parent downloads the app or opens the school portal.
2. Enters phone number and receives an OTP.
3. App shows linked children and schools.
4. Parent selects the child and sees outstanding invoices.
5. Taps “Pay now.”
6. Razorpay checkout opens with UPI, cards, and netbanking.
7. Payment succeeds; app shows confirmation.
8. Server verifies the webhook and records the payment.
9. Receipt PDF is generated and available in the app.
10. Parent receives push/WhatsApp confirmation.
11. Accountant sees the payment in the daily collection report.
12. Reconciliation job matches the payment with the Razorpay settlement.

**Success criteria**

- Payment completed in under two minutes.
- Receipt available immediately after webhook confirmation.
- No duplicate payment on retry.
- Accountant can reconcile the transaction.
- Parent can see payment history and download receipts.

**Edge cases**

- Payment succeeds but webhook is delayed
- Parent closes the app during checkout
- Duplicate taps
- Partial payment
- Refund or failed payment
- Multiple children in different schools

---

## 4. Journey: Teacher Marks Attendance Offline

**Actor:** Teacher  
**Goal:** Mark attendance for a class even when the school network is down.

1. Teacher opens the app in the morning while online.
2. App syncs today’s classes and student lists.
3. Teacher selects the class and marks present/absent.
4. App saves records locally in an encrypted SQLite database.
5. If offline, records enter an outbox with client-generated IDs.
6. Teacher sees a “pending sync” indicator.
7. When connectivity returns, app syncs automatically or on manual retry.
8. Server validates teacher assignment, session, and idempotency.
9. Server stores attendance and returns per-item results.
10. Absence alerts are queued after the school’s cutoff time.
11. Parent app shows the updated attendance.
12. Teacher sees “synced” status.

**Success criteria**

- Marking a 40-student class takes under 60 seconds.
- No duplicate records after retries.
- Conflicts are visible and resolvable.
- Parent alerts are sent only after server acceptance.
- Local data is purged on logout.

**Edge cases**

- App killed before sync
- Duplicate sync after network timeout
- Teacher assignment changed mid-day
- Admin edits attendance while teacher is offline
- Student transferred to another section
- Device lost or stolen

---

## 5. Journey: Exam and Report Card

**Actor:** Teacher, exam coordinator, principal, parent

1. Exam coordinator creates the term, exams, subjects, max marks, and grading scheme.
2. Teachers see assigned exam-subject-section combinations.
3. Teacher enters marks online, saves drafts, and submits.
4. System validates marks against max/pass marks and flags anomalies.
5. Exam coordinator locks submission and reviews.
6. Principal previews report cards for a sample section.
7. Principal publishes report cards.
8. System generates PDFs in the pdf-worker and stores them in GCS.
9. Parents receive push/WhatsApp notification.
10. Parent app shows subject marks, grades, attendance, and remarks.
11. School can reissue a report card with a new version and audit entry.

**Success criteria**

- Marks entry scoped to assigned teachers only.
- No report card published with missing mandatory marks.
- Bulk PDF generation does not block the web app.
- Parent sees results only after publish.
- Every publish/reissue is audited.

**Edge cases**

- Teacher on leave; marks reassigned
- Absent student or exempt subject
- Practical/internal marks entered separately
- Grade scheme change after marks entry
- Report card template change after publish
- Parent disputes a mark

---

## 6. Journey: Accountant Runs Payroll

**Actor:** Accountant / HR

1. Staff records and salary structures are up to date.
2. Accountant creates a payroll run for the month.
3. System computes earnings, deductions, and leave-based adjustments.
4. Accountant reviews exceptions: missing bank details, negative net pay, new joiners, exits.
5. Principal/owner approves the run.
6. System locks the run and generates payslips.
7. Accountant downloads bank transfer CSV and statutory export files.
8. Payslips become available to staff in the teacher app.
9. Run is audited and cannot be edited without a reversal.

**Success criteria**

- Payroll run reproducible for the same inputs.
- Approval and lock enforced.
- Payslip PDFs generated correctly.
- Statutory exports validated by the school’s CA.
- No salary data visible to unauthorized roles.

**Edge cases**

- Mid-month joiner or exit
- Unpaid leave / LOP
- Salary revision with arrears
- Bank details missing
- Statutory rate change
- Correction after lock

---

## 7. Journey: Principal’s Daily View

**Actor:** Principal

1. Opens the dashboard on mobile or desktop.
2. Sees today’s attendance percentage by class.
3. Sees fee collection for the day and outstanding dues.
4. Sees absentees and overdue follow-ups.
5. Sees pending marks submission and report-card status.
6. Drills into a class or student.
7. Sends a reminder or assigns follow-up.
8. Reviews audit trail for sensitive changes.

**Success criteria**

- Dashboard loads in under 2 seconds on 4G.
- Data is consistent with detailed reports.
- No PII leakage to unauthorized staff.
- Actions are auditable.

---

## 8. Journey: Platform Support Impersonates a School Admin

**Actor:** Platform support

1. Support receives a ticket.
2. Support searches for the school and user.
3. Support requests time-bound impersonation with a reason.
4. Platform admin approves if required.
5. Support enters the school with a visible impersonation banner.
6. All actions are logged with the support user, school, and reason.
7. Impersonation expires automatically.
8. Sensitive actions (payments, refunds, payroll) are blocked during impersonation.

**Success criteria**

- No silent impersonation.
- Full audit trail.
- Tenant data remains isolated.
- Support cannot access payment card data or secrets.

---

## 9. Journey: Parent’s Daily Use

1. Opens the app and sees the child’s dashboard.
2. Checks attendance for the day.
3. Reads a school announcement.
4. Pays a due invoice.
5. Downloads a receipt.
6. Checks upcoming exams and results.
7. Updates contact details or submits a consent.
8. Receives push notifications for absences, fees, and results.

**Success criteria**

- One-tap access to the most important information.
- Works on a mid-range Android phone and slow network.
- Clear empty, loading, and error states.
- Hindi/regional language support.

---

## 10. Journey: Year-End Rollover (Post-GA)

1. Principal selects “Prepare next academic year.”
2. System previews class promotions and section allocations.
3. Admin resolves exceptions: detained students, transfers, new admissions.
4. System copies fee structures and timetable templates.
5. Opening balances and carry-forward dues are reviewed.
6. New academic year is activated.
7. Previous year becomes read-only.
8. Parents see the new year’s fee schedule.

This is post-GA because the first launch year begins with imported enrollments.

---

## 11. Journey-Level Non-Functional Expectations

| Journey            | Performance                          | Reliability                     | Security                             |
| ------------------ | ------------------------------------ | ------------------------------- | ------------------------------------ |
| Attendance offline | Under 60s per class                  | Works offline, idempotent sync  | Encrypted local DB, role scope       |
| Parent payment     | Under 2 minutes                      | Webhook retries, reconciliation | Signed webhooks, no card data stored |
| Report cards       | Bulk 1,000 students under 10 minutes | Background jobs, retries        | Publish permissions, audit           |
| Payroll            | Run under 5 minutes for 500 staff    | Locked runs, reproducible       | Restricted roles, encryption         |
| Onboarding import  | 5,000 rows under 2 minutes           | Dry run, error report           | Tenant isolation, validation         |
