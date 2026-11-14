# HR and Payroll

**Prefix:** `FR-HR`  
**Release:** Beta  
**Owner:** Product / HR

---

## 1. Purpose

Maintain staff records, leave, attendance, salary structures, and monthly payroll with controlled approvals and statutory-ready exports.

## 2. Actors and Permissions

| Actor                | Permissions                                                             |
| -------------------- | ----------------------------------------------------------------------- |
| HR / payroll officer | Staff records, leave policies, salary structures, payroll runs, exports |
| Accountant           | Payroll review, bank transfer file, reports                             |
| Principal / owner    | Approve payroll, view all staff data                                    |
| Teacher / staff      | View own profile, leave balance, payslips; request leave                |
| Platform admin       | No default access; impersonation blocks payroll actions                 |

## 3. Release Scope

**Beta**

- Staff profiles and documents
- Designations and departments
- Leave types, policies, balances, requests, approvals
- Staff attendance (manual/import)
- Salary structures and components
- Monthly payroll run
- Payslip PDFs
- Bank transfer CSV
- Statutory export files for PF/ESI/PT/TDS
- Access control and audit

**GA**

- Payroll corrections and reversal workflow
- Arrears and salary revisions
- Loan/advance deductions
- Staff attendance import adapters
- Payroll reports and cost analysis

**Post-GA**

- Recruitment, appraisals, training
- Full statutory filing integrations
- Benefits and reimbursements

## 4. Functional Requirements

### Staff records

- **FR-HR-001 (MUST):** Create staff with name, employee code, designation, department, joining date, employment type, and status.
- **FR-HR-002 (MUST):** Store contact, address, emergency contact, qualifications, and documents.
- **FR-HR-003 (MUST):** Store bank details and statutory identifiers encrypted; mask in UI.
- **FR-HR-004 (MUST):** Staff can be assigned to multiple schools within an organization.
- **FR-HR-005 (MUST):** Deactivation preserves payroll and audit history.
- **FR-HR-006 (SHOULD):** Staff timeline for role changes, salary revisions, and documents.

### Leave and attendance

- **FR-HR-010 (MUST):** Configure leave types with annual quota, carry-forward rules, and paid/unpaid flag.
- **FR-HR-011 (MUST):** Staff request leave; approver is role-based or configured.
- **FR-HR-012 (MUST):** Leave balance is calculated from policy, approvals, and payroll adjustments.
- **FR-HR-013 (MUST):** Staff attendance can be recorded manually or imported.
- **FR-HR-014 (MUST):** Unpaid leave maps to loss of pay in payroll.
- **FR-HR-015 (SHOULD):** Half-day and late policies.
- **FR-HR-016 (SHOULD):** Leave calendar for the school.

### Salary and payroll

- **FR-HR-020 (MUST):** Configure salary components: basic, HRA, allowances, PF, ESI, professional tax, TDS, and custom deductions.
- **FR-HR-021 (MUST):** Create salary structures per staff member with effective dates.
- **FR-HR-022 (MUST):** Create a monthly payroll run for a school and month.
- **FR-HR-023 (MUST):** Payroll computes earnings, deductions, LOP, and net pay.
- **FR-HR-024 (MUST):** Show exceptions: missing bank details, negative net pay, missing salary structure, new joiners, exits.
- **FR-HR-025 (MUST):** Require approval before locking a payroll run.
- **FR-HR-026 (MUST):** Locked runs are immutable; corrections require a reversal/adjustment run.
- **FR-HR-027 (MUST):** Generate payslip PDFs per staff member.
- **FR-HR-028 (MUST):** Generate bank transfer CSV and statutory export files.
- **FR-HR-029 (MUST):** Staff can view their own payslips in the teacher app.
- **FR-HR-030 (MUST):** Payroll data is restricted to authorized roles.
- **FR-HR-031 (SHOULD):** Payroll summary by department and cost center.

## 5. Business Rules

1. Payroll is per school per month; an organization can run branches separately.
2. A staff member has one active salary structure at a time.
3. Salary structures are effective-dated; changes do not rewrite historical payroll.
4. Payroll runs are reproducible for the same inputs and policy versions.
5. Statutory rates are configuration, not hard-coded; changes are versioned.
6. The school’s CA validates PF/ESI/PT/TDS treatment before go-live.
7. The ERP produces exports; it does not file statutory returns.
8. Bank details and statutory IDs are encrypted and masked.
9. Payroll approval requires a different person from the preparer where the school enables segregation of duties.
10. Payslips are immutable after lock; corrections create a new adjustment.
11. Staff cannot view another staff member’s salary.
12. Impersonation cannot approve payroll.

## 6. Key Data

`staff`, `staff_documents`, `designations`, `departments`, `leave_types`, `leave_policies`, `leave_balances`, `leave_requests`, `staff_attendance`, `salary_components`, `salary_structures`, `salary_structure_lines`, `payroll_runs`, `payroll_items`, `payslips`, `payroll_adjustments`, `statutory_rates`.

## 7. APIs and Events

**APIs**

- `GET/POST /api/v1/staff`
- `POST /api/v1/staff/{id}/salary-structure`
- `GET/POST /api/v1/leave/requests`
- `POST /api/v1/leave/requests/{id}/approve`
- `POST /api/v1/payroll/runs`
- `POST /api/v1/payroll/runs/{id}/approve`
- `POST /api/v1/payroll/runs/{id}/lock`
- `GET /api/v1/payroll/runs/{id}/payslips`
- `GET /api/v1/payroll/runs/{id}/bank-file`
- `GET /api/v1/payroll/runs/{id}/statutory-export`

**Events**

- `staff.created`
- `leave.requested`
- `leave.approved`
- `payroll.prepared`
- `payroll.approved`
- `payroll.locked`
- `payslip.available`

## 8. Imports and Exports

- Staff import template.
- Salary structure import.
- Staff attendance import.
- Payroll register export.
- Bank transfer CSV.
- PF/ESI/PT/TDS export files for CA.
- Payslip PDFs.

## 9. Edge Cases

- Mid-month joiner or exit
- Unpaid leave spanning two months
- Salary revision mid-month
- Missing bank details
- Negative net pay
- Duplicate payroll run
- Statutory rate change mid-year
- Staff transferred between branches
- Correction after lock
- Payroll run with zero staff

## 10. Acceptance Criteria

- **Given** a salary structure with basic, HRA, PF, and PT, **when** payroll runs, **then** each component and net pay match the approved calculation.
- **Given** an unpaid leave day, **when** payroll runs, **then** LOP is applied according to the policy.
- **Given** missing bank details, **when** payroll is prepared, **then** the staff member appears in the exception list and the run can still be reviewed.
- **Given** a prepared payroll, **when** the principal approves and locks it, **then** no edits are possible and payslips are generated.
- **Given** a locked payroll, **when** a correction is required, **then** a new adjustment run is created and audited.
- **Given** a teacher, **when** they open payslips, **then** they see only their own payslips.

## 11. Metrics and Audit Events

**Metrics**

- Payroll run time
- Exception count per run
- Payslip delivery rate
- Leave approval turnaround
- Payroll correction rate
- Staff data completeness

**Audit events**

- Staff created/updated/deactivated
- Salary structure changed
- Leave approved/rejected
- Payroll prepared/approved/locked
- Payslip generated/viewed
- Bank/statutory export downloaded
- Sensitive field viewed

## 12. Open Questions

- Which payroll components and statutory rules apply to the pilot schools?
- Is segregation of duties required between preparer and approver?
- Are loans/advances needed in year one? Default: post-GA.
- Which payroll provider/CA will validate statutory exports?
