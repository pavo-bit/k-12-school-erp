# Students and Admissions

**Prefixes:** `FR-STU`  
**Release:** Students and enrollment at beta; lean admissions at GA  
**Owner:** Product / SIS

---

## 1. Purpose

Maintain a reliable, searchable record of every student, guardian, enrollment, and admission application.

## 2. Actors and Permissions

| Actor                    | Permissions                                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| School admin / principal | Full student and admission access within the school                                                  |
| Front desk / admissions  | Create enquiries/applications, edit applicant data, convert to student (with approval if configured) |
| Teacher                  | View students in assigned classes; no admission access                                               |
| Accountant               | View student fee identity and class; no documents unless permitted                                   |
| Parent                   | View their own child’s profile; request corrections                                                  |
| Platform admin           | No default access; impersonation only with audit                                                     |

## 3. Release Scope

**Beta**

- Student profile and guardians
- Enrollment per academic year
- Admission number generation
- Documents and photos
- Search, filters, bulk actions
- Excel/CSV import and export
- Student status: active, inactive, transferred, alumni
- Consent records

**GA**

- Enquiries and applications
- Public admission enquiry/application form
- Document upload by applicants
- Pipeline statuses and follow-up notes
- Convert application to student and enrollment
- Admission acknowledgements and status notifications

**Post-GA**

- Entrance tests, interviews, merit lists, offers, waitlists
- Sibling and staff-ward priority rules
- Online application fee payments
- Advanced admission analytics

## 4. Functional Requirements

### Students

- **FR-STU-001 (MUST):** Create a student with first name, last name, date of birth, gender, admission number, admission date, class/section, and status.
- **FR-STU-002 (MUST):** Admission number is unique per school; system can auto-generate using a configurable prefix and sequence.
- **FR-STU-003 (MUST):** Record optional fields: blood group, category, religion, nationality, mother tongue, address, emergency contact, medical notes.
- **FR-STU-004 (MUST):** Upload student photo and documents; enforce type and size limits.
- **FR-STU-005 (MUST):** Link one or more guardians with relationship, primary contact flag, phone, email, occupation, and address.
- **FR-STU-006 (MUST):** A student can have different guardians for communication and fees.
- **FR-STU-007 (MUST):** Search by name, admission number, phone, class/section, status, and guardian name.
- **FR-STU-008 (MUST):** Bulk update class/section only through a validated promotion flow or import.
- **FR-STU-009 (MUST):** Soft-archive students; never hard-delete records with fees, attendance, or exams.
- **FR-STU-010 (MUST):** Maintain consent records for communication and data processing.
- **FR-STU-011 (SHOULD):** Custom fields for school-specific data.
- **FR-STU-012 (SHOULD):** Sibling linking and duplicate detection.
- **FR-STU-013 (SHOULD):** Student timeline: enrollment, fee events, exam results, documents, communication.

### Enrollment

- **FR-STU-020 (MUST):** Enrollment links a student to academic year, class, section, roll number, and status.
- **FR-STU-021 (MUST):** A student has at most one active enrollment per academic year.
- **FR-STU-022 (MUST):** Roll number is unique within a section and academic year, unless the school disables uniqueness.
- **FR-STU-023 (MUST):** Changing section preserves historical attendance and marks under the original enrollment.
- **FR-STU-024 (MUST):** Enrollment status: active, transferred, withdrawn, completed, detained.
- **FR-STU-025 (SHOULD):** Transfer certificate generation is post-GA.

### Admissions

- **FR-STU-030 (MUST):** Capture an enquiry with applicant name, guardian phone, class sought, source, and notes.
- **FR-STU-031 (MUST):** Application captures student and guardian details and required documents.
- **FR-STU-032 (MUST):** Pipeline statuses: new, contacted, visit scheduled, application received, under review, admitted, rejected, withdrawn.
- **FR-STU-033 (MUST):** Add follow-up notes and next action date.
- **FR-STU-034 (MUST):** Convert an application to a student and enrollment; prevent duplicate conversion.
- **FR-STU-035 (MUST):** Public application form is rate-limited and protected against spam.
- **FR-STU-036 (MUST):** Applicant receives acknowledgement and status updates via configured channels.
- **FR-STU-037 (SHOULD):** Track source (walk-in, website, referral, campaign) for reporting.
- **FR-STU-038 (SHOULD):** Assign applications to front-desk staff.

## 5. Business Rules

1. Admission number cannot be reused, even after a student leaves.
2. Guardian phone is normalized to E.164; Indian numbers default to `+91`.
3. A guardian phone can link to multiple students and schools; parent identity is global.
4. A student cannot be enrolled twice in the same academic year.
5. Historical enrollments are immutable except for status corrections with audit.
6. Documents are private by default; access is role-scoped and logged.
7. Deleting a guardian removes the link, not the guardian if linked elsewhere.
8. Admission conversion requires class/section availability and an active academic year.
9. Applicant data is retained only as long as the admissions policy requires; rejected applicants are purged or anonymized on schedule.

## 6. Key Data

`students`, `guardians`, `student_guardians`, `enrollments`, `student_documents`, `student_consents`, `student_custom_fields`, `enquiries`, `applications`, `application_documents`, `application_notes`, `admission_status_history`, `document_sequences`.

## 7. APIs and Events

**APIs**

- `GET/POST /api/v1/students`
- `GET/PATCH /api/v1/students/{id}`
- `POST /api/v1/students/{id}/guardians`
- `POST /api/v1/students/{id}/enrollments`
- `POST /api/v1/students/imports`
- `GET /api/v1/students/export`
- `GET/POST /api/v1/admissions/enquiries`
- `GET/POST /api/v1/admissions/applications`
- `POST /api/v1/admissions/applications/{id}/convert`

**Events**

- `student.created`
- `student.updated`
- `enrollment.created`
- `student.transferred`
- `application.received`
- `application.status_changed`
- `application.converted`

## 8. Imports and Exports

- Student import template includes student, guardian, and enrollment columns.
- Validation: mandatory fields, date formats, duplicate admission numbers, duplicate student candidates, class/section existence, guardian phone format.
- Export includes role-scoped fields; sensitive fields are masked for non-admin roles.
- Admission application export for follow-up campaigns.

## 9. Edge Cases

- Duplicate student created with a different spelling
- Guardian phone shared by siblings
- Student changes section mid-year
- Student leaves and rejoins in a later academic year
- Admission number collision during import
- Application converted twice by two users
- Document upload interrupted
- Parent requests correction of date of birth
- Student without a guardian phone

## 10. Acceptance Criteria

- **Given** a valid student form, **when** saved, **then** the student appears in the class roster and can be linked to a guardian.
- **Given** two students with the same admission number, **when** the second is saved or imported, **then** the system rejects it with a row-level error.
- **Given** a 1,000-row import with duplicate guardians, **when** the dry run runs, **then** valid rows are separated from duplicates and the admin can choose merge behavior.
- **Given** a teacher assigned to Section A, **when** they search students, **then** they see only Section A students.
- **Given** an application, **when** converted, **then** a student and active enrollment are created once and the application status becomes `admitted`.
- **Given** an archived student, **when** an accountant views fees, **then** historical invoices remain accessible but no new invoices can be created.

## 11. Metrics and Audit Events

**Metrics**

- Students imported per school
- Duplicate rate
- Admission conversion rate
- Time to complete an application
- Parent profile completion rate

**Audit events**

- Student created/updated/archived
- Guardian linked/unlinked
- Enrollment created/changed
- Document uploaded/deleted
- Consent recorded/withdrawn
- Application status changed
- Application converted
- Sensitive field viewed/exported

## 12. Open Questions

- Should admission numbers be editable after fees exist? Default: no, only with audit and admin approval.
- Is sibling linking required at beta or GA?
- Which documents are mandatory per board/school?
- What is the retention period for rejected applications?
