# Reports and Analytics

**Prefix:** `FR-REP`  
**Release:** Basic dashboards at beta; full operational reporting at GA; BI post-GA  
**Owner:** Product / Data

---

## 1. Purpose

Give principals, trustees, accountants, and administrators timely, trustworthy views of enrollment, attendance, fees, academics, and staffing without exporting to spreadsheets. Reports must be role-scoped, reproducible, and fast enough for daily use.

## 2. Actors and Permissions

| Actor                      | Permissions                                                                  |
| -------------------------- | ---------------------------------------------------------------------------- |
| Principal / school admin   | All school reports within scope; drill-down to student/staff where permitted |
| Trust / organization owner | Cross-branch aggregate reports; no payroll detail unless granted             |
| Accountant                 | Fee, collection, outstanding, payroll summary, and statutory reports         |
| Exam coordinator           | Exam and result reports                                                      |
| Teacher                    | Class/section attendance and result reports for assigned sections            |
| Parent                     | Own child’s attendance, fees, and results via app                            |
| Platform admin             | Usage and health metrics; no school content without audited impersonation    |

## 3. Release Scope

**Beta**

- Principal dashboard: today’s attendance, fee collection, outstanding dues, absentees
- Enrollment summary by class, section, gender, category
- Daily and monthly attendance registers and percentages
- Fee demand vs collection, daily collection, outstanding by class/section, concessions
- Payroll summary and staff strength
- CSV/XLSX export for core reports
- Role-scoped access and audit for exports

**GA**

- Exam and result analytics: pass percentage, subject averages, grade distribution
- Admissions funnel and source analysis
- Fee aging and defaulter reports
- Class-wise and fee-head-wise collection
- Staff attendance and leave summary
- Scheduled report delivery by email
- Saved views and report favorites
- Organization-level consolidated dashboard for multi-branch trusts

**Post-GA**

- Data warehouse and BI tool integration
- Custom report builder
- Benchmarking across schools (anonymized, opt-in)
- Predictive insights (dropout, collection risk)

## 4. Functional Requirements

### Dashboards

- **FR-REP-001 (MUST):** Principal dashboard shows today’s attendance percentage, present/absent counts, and sections not yet marked.
- **FR-REP-002 (MUST):** Dashboard shows today’s collection, month-to-date collection, and total outstanding.
- **FR-REP-003 (MUST):** Dashboard shows upcoming fee due dates and overdue invoice counts.
- **FR-REP-004 (MUST):** Dashboard shows pending marks submission and report-card status at GA.
- **FR-REP-005 (MUST):** Dashboard data is scoped to the user’s school and role.
- **FR-REP-006 (SHOULD):** Dashboard cards drill through to the underlying list or report.
- **FR-REP-007 (SHOULD):** Dashboard supports a date selector for historical views.
- **FR-REP-008 (SHOULD):** Organization owners can switch between branches and view a consolidated summary.

### Operational reports

- **FR-REP-010 (MUST):** Enrollment report by academic year, class, section, gender, category, and status.
- **FR-REP-011 (MUST):** Attendance register per section per month with daily status and percentage.
- **FR-REP-012 (MUST):** Attendance summary by class and section for a date range.
- **FR-REP-013 (MUST):** Absentee report for a date with guardian contact details, role-scoped.
- **FR-REP-014 (MUST):** Fee demand vs collection by class, section, and fee head.
- **FR-REP-015 (MUST):** Daily collection report by mode, collector, and class.
- **FR-REP-016 (MUST):** Outstanding dues report with aging buckets (0–30, 31–60, 61–90, 90+ days).
- **FR-REP-017 (MUST):** Concession report with approver and reason.
- **FR-REP-018 (MUST):** Payroll summary by department and month without exposing individual salaries to unauthorized roles.
- **FR-REP-019 (MUST):** Report parameters are validated and reflected in the report header.
- **FR-REP-020 (MUST):** Reports use the school’s timezone, currency, and date format.
- **FR-REP-021 (SHOULD):** Saved filter presets per user.
- **FR-REP-022 (SHOULD):** Report results can be exported to CSV and XLSX.
- **FR-REP-023 (SHOULD):** Large reports run as background jobs and notify the user when ready.
- **FR-REP-024 (SHOULD):** Scheduled reports can be emailed daily, weekly, or monthly at GA.

### Academic reports (GA)

- **FR-REP-030 (MUST):** Exam result summary by class and section: appeared, passed, failed, pass percentage.
- **FR-REP-031 (MUST):** Subject-wise average, highest, lowest, and grade distribution.
- **FR-REP-032 (MUST):** Student result history across terms for the academic year.
- **FR-REP-033 (SHOULD):** Section comparison for the same exam.
- **FR-REP-034 (SHOULD):** Export result data for board or internal review, with PII controls.

### Admissions reports (GA)

- **FR-REP-040 (MUST):** Enquiry and application counts by status, class sought, and source.
- **FR-REP-041 (MUST):** Conversion rate from enquiry to admitted by period.
- **FR-REP-042 (SHOULD):** Follow-up aging and staff assignment summary.

### Platform and usage reports

- **FR-REP-050 (MUST):** Platform admin can see active students, schools, and module usage per school.
- **FR-REP-051 (MUST):** Platform admin can see messaging volume and estimated cost per school.
- **FR-REP-052 (SHOULD):** Platform health dashboard: error rate, queue depth, job failures, payment webhook lag.

## 5. Business Rules

1. Every report is tenant-scoped by `school_id`; cross-school aggregation is allowed only for organization-level roles.
2. Report access is checked server-side on every request, including exports and scheduled deliveries.
3. A report’s definition and parameter set are recorded with each export for reproducibility.
4. Financial reports use posted transactions only; draft or failed payments are excluded.
5. Attendance percentages use school-configured rules for late, half-day, and excused statuses.
6. Report totals must reconcile with the underlying module reports; differences are defects.
7. Exports containing PII are watermarked with the requesting user and timestamp where feasible.
8. Scheduled reports are delivered only to verified recipients within the school.
9. Historical reports use the academic year’s configuration at the time of the data, not current settings.
10. Reports must not expose bank details, statutory IDs, or full medical notes unless the role explicitly permits it.
11. Report queries must have a maximum date range or row limit; broader requests become background jobs.
12. Deleted or archived records are excluded from operational totals unless the report explicitly includes them.

## 6. Key Data

Reporting reads from operational tables and maintains:

- `report_definitions`
- `report_jobs`
- `report_exports`
- `saved_report_views`
- `scheduled_reports`
- `daily_attendance_summaries`
- `daily_fee_summaries`
- `enrollment_snapshots`
- `dashboard_cache`

Summary tables are derived and rebuildable; operational tables remain the source of truth.

## 7. APIs and Events

**APIs**

- `GET /api/v1/reports/dashboard`
- `GET /api/v1/reports/enrollment`
- `GET /api/v1/reports/attendance/register`
- `GET /api/v1/reports/attendance/summary`
- `GET /api/v1/reports/fees/demand-vs-collection`
- `GET /api/v1/reports/fees/outstanding`
- `GET /api/v1/reports/fees/collection`
- `GET /api/v1/reports/payroll/summary`
- `GET /api/v1/reports/results/summary`
- `POST /api/v1/reports/exports`
- `GET /api/v1/reports/exports/{id}`
- `GET/POST /api/v1/reports/schedules`

**Events**

- `report.export_requested`
- `report.export_ready`
- `report.export_failed`
- `report.schedule_delivered`

## 8. Imports and Exports

- CSV and XLSX export with a header row containing school, report name, parameters, and generation time.
- PDF export for registers and principal summaries.
- Export files expire after 7 days and are access-controlled.
- Scheduled reports are delivered by email with a signed, expiring link.
- No report import at beta; report definitions are code-defined. A custom report builder is post-GA.

## 9. Edge Cases

- Section with no attendance marked for the day
- Student enrolled mid-month
- Invoice cancelled after collection
- Refund after the report period
- Multiple academic years in one date range
- Very large export (50,000+ rows)
- Report requested during payroll lock
- Timezone boundary at midnight
- User’s role changed while an export is running
- Scheduled report recipient removed from the school

## 10. Acceptance Criteria

- **Given** a principal on the dashboard, **when** the page loads, **then** attendance and collection figures match the underlying module reports for the same day.
- **Given** a teacher, **when** they open attendance reports, **then** they can select only assigned sections.
- **Given** an accountant exporting outstanding dues, **when** the export completes, **then** the file includes only their school and records the exporter, parameters, and timestamp.
- **Given** a report over 10,000 rows, **when** requested, **then** it runs as a background job and the user is notified when ready.
- **Given** a refund processed after month-end, **when** the prior month’s collection report is viewed, **then** the report remains reproducible and the refund appears in the current period.
- **Given** an organization owner, **when** they open the consolidated dashboard, **then** branch totals sum to the organization total.

## 11. Metrics and Audit Events

**Metrics**

- Dashboard p95 load time
- Report query p95 duration
- Export success rate
- Scheduled report delivery success
- Report usage by role
- Reconciliation differences found

**Audit events**

- Report viewed (sensitive reports)
- Export requested/completed/downloaded
- Schedule created/changed/deleted
- Cross-branch report accessed
- Report permission denied

## 12. Open Questions

- Which reports do pilot principals use daily, and which can wait for GA?
- Is a custom report builder needed in year one? Default: no.
- Should parents see historical attendance beyond the current academic year? Default: current year only.
- Which reports must be printable for board or trust reviews?
