# Exams and Report Cards

**Prefix:** `FR-EXAM`  
**Release:** GA — October 2027  
**Owner:** Product / Academics

---

## 1. Purpose

Replace manual marks registers and spreadsheet report cards with a controlled, auditable workflow that supports CBSE/ICSE-style grading and produces parent-ready report cards.

## 2. Actors and Permissions

| Actor            | Permissions                                                         |
| ---------------- | ------------------------------------------------------------------- |
| Exam coordinator | Create terms, exams, subjects, grading schemes, lock marks, publish |
| Teacher          | Enter marks for assigned exam-subject-sections                      |
| Class teacher    | View section results, attendance, and remarks                       |
| Principal        | Approve and publish report cards                                    |
| Parent           | View published results and download report cards                    |
| Accountant       | No exam access by default                                           |

## 3. Release Scope

**GA**

- Exam terms and exam types
- Exam-subject configuration with max/pass marks and weightage
- Marks entry with drafts, submit, lock
- Practical/internal marks
- Configurable grading schemes and grade bands
- Report-card templates (2–3)
- Bulk PDF generation
- Publish workflow and parent app view
- Reissue with versioning and audit
- Basic result analytics

**Post-GA**

- Online exams and question bank
- Co-scholastic assessments
- Moderation workflows
- Rank/percentile (configurable; default off)
- Transcripts and migration certificates
- Auto-promotion rules

## 4. Functional Requirements

### Exam setup

- **FR-EXAM-001 (MUST):** Create academic terms with name and date range.
- **FR-EXAM-002 (MUST):** Create exams with type, term, start/end dates, and status.
- **FR-EXAM-003 (MUST):** Add exam subjects with class, max marks, pass marks, theory/practical split, and weightage.
- **FR-EXAM-004 (MUST):** Configure grading schemes with grade name, minimum percentage, and description.
- **FR-EXAM-005 (MUST):** Configure report-card template per school and class group.
- **FR-EXAM-006 (MUST):** Validate that exam subject totals and weightages are consistent before marks entry opens.

### Marks entry

- **FR-EXAM-010 (MUST):** Teacher sees only assigned exam-subject-section combinations.
- **FR-EXAM-011 (MUST):** Marks entry supports absent, exempt, and not-applicable states.
- **FR-EXAM-012 (MUST):** Save drafts; submit for review; lock after submission.
- **FR-EXAM-013 (MUST):** Marks cannot exceed max marks or be negative.
- **FR-EXAM-014 (MUST):** Admin can reassign marks entry and unlock with reason and audit.
- **FR-EXAM-015 (MUST):** Offline marks entry is out of scope at GA; marks require a connection.
- **FR-EXAM-016 (SHOULD):** Bulk paste/import from a validated spreadsheet.
- **FR-EXAM-017 (SHOULD):** Anomaly detection for unusually low/high marks.

### Results and report cards

- **FR-EXAM-020 (MUST):** Compute subject totals, percentage, grade, and result status.
- **FR-EXAM-021 (MUST):** Report card includes student details, subjects, marks, grades, attendance, remarks, and school branding.
- **FR-EXAM-022 (MUST):** Principal previews a sample before publish.
- **FR-EXAM-023 (MUST):** Publish is blocked if mandatory marks are missing.
- **FR-EXAM-024 (MUST):** Bulk PDF generation runs as a background job.
- **FR-EXAM-025 (MUST):** Parent sees results only after publish.
- **FR-EXAM-026 (MUST):** Reissue creates a new version and preserves the previous one.
- **FR-EXAM-027 (MUST):** Published report cards are immutable.
- **FR-EXAM-028 (SHOULD):** School can configure remarks per student.
- **FR-EXAM-029 (SHOULD):** Result analytics: pass percentage, subject averages, distribution.

## 5. Business Rules

1. Marks are scoped to academic year, exam, subject, section, and student.
2. A teacher cannot see or edit another teacher’s assigned subject unless explicitly granted.
3. Absent is treated as zero for totals unless the school configures otherwise.
4. Exempt subjects are excluded from totals and percentage.
5. Rounding follows a school-configured rule; default is two decimal places.
6. Grade bands must not overlap and must cover 0–100.
7. Report-card generation uses the template version at publish time.
8. Publishing is an audited, idempotent operation.
9. Reissuing does not delete the prior PDF; it creates a new version.
10. Parents see only their own child’s results.
11. Rank/percentile is off by default.
12. Marks cannot be edited after the exam is closed without a formal reopening.

## 6. Key Data

`exam_terms`, `exams`, `exam_subjects`, `grading_schemes`, `grade_bands`, `marks`, `mark_submissions`, `results`, `report_card_templates`, `report_cards`, `report_card_versions`, `exam_audit_events`.

## 7. APIs and Events

**APIs**

- `POST /api/v1/exams`
- `GET /api/v1/exams/{id}/subjects`
- `GET /api/v1/exams/{id}/marks?section_id=&subject_id=`
- `PUT /api/v1/exams/{id}/marks`
- `POST /api/v1/exams/{id}/marks/submit`
- `POST /api/v1/exams/{id}/marks/lock`
- `POST /api/v1/exams/{id}/report-cards/preview`
- `POST /api/v1/exams/{id}/report-cards/publish`
- `GET /api/v1/results/my-children`

**Events**

- `marks.submitted`
- `marks.locked`
- `report_card.generated`
- `report_card.published`
- `report_card.reissued`
- `result.published`

## 8. Imports and Exports

- Marks import template: admission number, subject, max marks, obtained marks, absent/exempt.
- Report-card PDFs per student and bulk ZIP.
- Result export: CSV/XLSX.
- Subject analysis export.

## 9. Edge Cases

- Teacher on leave; marks reassigned
- Student absent for one subject
- Student exempt in a subject
- Practical marks entered by a different teacher
- Mark correction after lock
- Grade scheme changed after marks entry
- Report-card template changed after publish
- Duplicate publish request
- Student transferred after exams
- Parent disputes a mark

## 10. Acceptance Criteria

- **Given** a teacher assigned to Class 8A Mathematics, **when** they open marks entry, **then** they see only that subject-section and cannot access other subjects.
- **Given** a mark above max marks, **when** saved, **then** the system rejects it with the valid range.
- **Given** missing mandatory marks, **when** the principal tries to publish, **then** publishing is blocked with a list of missing entries.
- **Given** a valid publish request, **when** processed, **then** all report-card PDFs are generated and parents can view results.
- **Given** a duplicate publish request, **when** repeated, **then** no duplicate versions or notifications are created.
- **Given** a reissue, **when** completed, **then** a new version is created and the old version remains downloadable by admins.
- **Given** a parent with two children, **when** they open results, **then** they see only their children’s published report cards.

## 11. Metrics and Audit Events

**Metrics**

- Marks submission completion by exam
- Time from last mark to publish
- Report-card generation time
- Parent result view rate
- Reissue rate
- Missing-mark exceptions

**Audit events**

- Exam created/updated
- Grading scheme changed
- Marks submitted/locked/unlocked
- Report card generated/published/reissued
- Result viewed by parent (optional, privacy-aware)

## 12. Open Questions

- Which report-card templates are required by the pilot schools?
- Is co-scholastic assessment required at GA?
- Are practical marks a separate teacher assignment?
- Should absent students receive a report card?
- What is the policy for rank/percentile?
