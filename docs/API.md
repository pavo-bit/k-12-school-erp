# School ERP API Documentation

## Overview

The School ERP API is a RESTful API built with Next.js. All endpoints are prefixed with `/api/v1/`.

## Authentication

All API endpoints (except auth endpoints) require authentication via session token cookie.

## Tenant Resolution

Tenant (school) is resolved from:

1. Subdomain (e.g., `schoolname.erp.com`)
2. Query parameter `?school=slug`
3. Default fallback slug (development only)

## Common Response Format

### Success Response

```json
{
  "data": { ... },
  "meta": {
    "request_id": "uuid"
  }
}
```

### Error Response

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "requestId": "uuid",
    "details": { ... }
  }
}
```

## Error Codes

| Code               | HTTP Status | Description                |
| ------------------ | ----------- | -------------------------- |
| `VALIDATION_ERROR` | 400         | Invalid input data         |
| `TENANT_REQUIRED`  | 400         | School context required    |
| `MISSING_PARAM`    | 400         | Required parameter missing |
| `UNAUTHENTICATED`  | 401         | Login required             |
| `SESSION_EXPIRED`  | 401         | Session expired            |
| `FORBIDDEN`        | 403         | Direct access not allowed  |
| `NOT_FOUND`        | 404         | Resource not found         |
| `TENANT_NOT_FOUND` | 404         | School not found           |
| `INTERNAL_ERROR`   | 500         | Unexpected error           |

## API Endpoints

### Platform Module

#### Organizations

- `GET /api/v1/platform/organizations` — List all organizations
- `POST /api/v1/platform/organizations` — Create organization
  - Body: `{ name, billingEmail }`

#### Schools

- `GET /api/v1/platform/schools?organizationId=` — List schools
- `POST /api/v1/platform/schools` — Create school
  - Body: `{ organizationId, name, slug, board?, timezone, locale }`

#### Academic Years

- `GET /api/v1/academic-years?schoolId=` — List academic years
- `POST /api/v1/academic-years` — Create academic year
  - Body: `{ schoolId, name, startDate, endDate, status }`

### SIS Module

#### Students

- `GET /api/v1/sis/students?q=&page=&limit=` — List/search students
- `POST /api/v1/sis/students` — Create student
  - Body: `{ admissionNumber, firstName, lastName, dateOfBirth, gender, email?, phone?, ... }`
- `GET /api/v1/students/:id` — Get student by ID

### Fees Module

#### Fee Heads

- `GET /api/v1/fees/heads` — List fee heads
- `POST /api/v1/fees/heads` — Create fee head
  - Body: `{ name, code, category, isTaxable }`

#### Fee Structures

- `GET /api/v1/fees/structures?academicYearId=` — List fee structures
- `POST /api/v1/fees/structures` — Create fee structure
  - Body: `{ academicYearId, classId, name, status, feeStructureLines: [{ feeHeadId, amountPaise, frequency, dueRule }] }`

#### Invoices

- `GET /api/v1/fees/invoices?studentId=&status=` — List invoices
- `POST /api/v1/fees/invoices` — Create invoice
  - Body: `{ studentId, academicYearId, financialYear, invoiceNumber, issueDate, dueDate, status, invoiceLines: [{ feeHeadId, amountPaise, concessionPaise, netPaise }] }`

#### Payments

- `POST /api/v1/fees/payments` — Record payment
  - Body: `{ studentId, amountPaise, mode, status }`

### Attendance Module

#### Sessions

- `GET /api/v1/attendance/sessions?sectionId=&date=` — List sessions
- `POST /api/v1/attendance/sessions` — Create session
  - Body: `{ sectionId, date, sessionType, status }`

#### Records

- `GET /api/v1/attendance/records?sessionId=` — List records
- `POST /api/v1/attendance/records` — Mark attendance
  - Body: `{ sessionId, studentId, status }`

### HR Module

#### Staff

- `GET /api/v1/hr/staff?status=&employeeCode=&departmentId=` — List staff
- `POST /api/v1/hr/staff` — Create staff
  - Body: `{ employeeCode, userId?, designationId?, departmentId?, joiningDate, status, email?, phone? }`
- `PUT /api/v1/hr/staff` — Update staff
  - Body: `{ id, ... }`

#### Leave Requests

- `GET /api/v1/hr/leave-requests?status=&staffId=&leaveTypeId=` — List leave requests
- `POST /api/v1/hr/leave-requests` — Create leave request
  - Body: `{ staffId, leaveTypeId, academicYearId, fromDate, toDate, daysRequested, reason, status }`
- `PUT /api/v1/hr/leave-requests` — Update leave request
  - Body: `{ id, status, notes }`

#### Payroll Runs

- `GET /api/v1/hr/payroll-runs?status=&month=&year=` — List payroll runs
- `POST /api/v1/hr/payroll-runs` — Create payroll run
  - Body: `{ month, year, status?, preparedBy? }`
- `PUT /api/v1/hr/payroll-runs` — Update payroll run
  - Body: `{ id, status }`

#### Salary Structures

- `POST /api/v1/hr/salary-structures` — Create salary structure
  - Body: `{ staffId, effectiveFrom, status?, salaryStructureLines? }`

### Communication Module

#### Announcements

- `GET /api/v1/communication/announcements?status=` — List announcements
- `POST /api/v1/communication/announcements` — Create announcement
  - Body: `{ title, body, audience?, status?, scheduledAt?, sentAt? }`

#### Templates

- `POST /api/v1/communication/templates` — Create notification template
  - Body: `{ key, channel, language, subject, body, status? }`

### Exams Module

#### Terms

- `GET /api/v1/exams/terms?academicYearId=` — List exam terms
- `POST /api/v1/exams/terms` — Create exam term
  - Body: `{ academicYearId, name, startDate, endDate, status? }`

#### Exams

- `GET /api/v1/exams?termId=` — List exams
- `POST /api/v1/exams` — Create exam
  - Body: `{ termId, name, type, status? }`
- `PATCH /api/v1/exams` — Update exam
  - Body: `{ id, name?, type?, status? }`

#### Subjects

- `GET /api/v1/exams/subjects?examId=` — List exam subjects
- `POST /api/v1/exams/subjects` — Create exam subject
  - Body: `{ examId, classId, subjectId, maxMarks, passMarks, theoryMax?, practicalMax?, weightage? }`

#### Marks

- `GET /api/v1/exams/marks?examSubjectId=&examId=&studentId=` — List marks/results
- `POST /api/v1/exams/marks` — Create marks or result
  - Body (marks): `{ examSubjectId, studentId, theoryMarks, practicalMarks?, status? }`
  - Body (result): `{ examId, studentId, totalMarks, percentage, grade, resultStatus }`
- `PATCH /api/v1/exams/marks` — Update marks
  - Body: `{ id, theoryMarks?, practicalMarks?, status? }`

#### Grading Schemes

- `POST /api/v1/exams/grading-schemes` — Create grading scheme
  - Body: `{ name, description? }`

#### Report Card Templates

- `POST /api/v1/exams/report-card-templates` — Create template
  - Body: `{ name, htmlTemplate, version?, isDefault?, status? }`

#### Report Cards

- `GET /api/v1/exams/report-cards?examId=&studentId=` — List report cards
- `POST /api/v1/exams/report-cards` — Create report card
  - Body: `{ examId, studentId, templateId, objectPath, status?, publishedAt?, version? }`

### Admissions Module

#### Enquiries

- `GET /api/v1/admissions/enquiries?status=&classSought=` — List enquiries
- `POST /api/v1/admissions/enquiries` — Create enquiry
  - Body: `{ studentName, guardianPhone, classSought, source?, status? }`

#### Applications

- `GET /api/v1/admissions/applications?academicYearId=&status=` — List applications
- `POST /api/v1/admissions/applications` — Create application
  - Body: `{ enquiryId, academicYearId, status?, notes? }`

#### Conversions

- `GET /api/v1/admissions/conversions?applicationId=` — List conversions
- `POST /api/v1/admissions/conversions` — Create conversion
  - Body: `{ applicationId, convertedStudentId, convertedAt }`

### Reports Module

#### Reports

- `GET /api/v1/reports?type=` — List reports
- `POST /api/v1/reports` — Create report
  - Body: `{ type, name, description?, filters?, schedule? }`
- `PATCH /api/v1/reports` — Update report
  - Body: `{ id, name?, description?, filters?, schedule? }`

#### Exports

- `GET /api/v1/reports/exports?reportId=` — List exports
- `POST /api/v1/reports/exports` — Create export
  - Body: `{ reportId, format, startDate, endDate }`

#### Scheduled Reports

- `GET /api/v1/reports/scheduled-reports?reportId=` — List scheduled reports
- `POST /api/v1/reports/scheduled-reports` — Create scheduled report
  - Body: `{ reportId, recipients, frequency, dayOfWeek?, dayOfMonth?, time? }`

#### Dashboards

- `GET /api/v1/reports/dashboards` — List dashboards
- `POST /api/v1/reports/dashboards` — Create dashboard
  - Body: `{ name, layout?, widgets? }`
- `PATCH /api/v1/reports/dashboards` — Update dashboard
  - Body: `{ id, name?, layout?, widgets? }`

#### Dashboard Widgets

- `GET /api/v1/reports/dashboards/widgets?dashboardId=` — List widgets
- `POST /api/v1/reports/dashboards/widgets` — Create widget
  - Body: `{ dashboardId, type, title, dataSource, config?, position? }`

### Academics Module

#### Classes

- `GET /api/v1/academics/classes?academicYearId=` — List classes
- `POST /api/v1/academics/classes` — Create class

#### Sections

- `GET /api/v1/academics/sections?classId=` — List sections
- `POST /api/v1/academics/sections` — Create section

#### Subjects

- `GET /api/v1/academics/subjects` — List subjects
- `POST /api/v1/academics/subjects` — Create subject

### Platform (Schools & Invitations)

#### Schools

- `POST /api/v1/platform/schools/invitations` — Invite staff
  - Body: `{ email, roleId }`

## Rate Limiting

API endpoints are rate-limited per tenant. Default limits:

- 100 requests per minute per IP
- 1000 requests per minute per school

## Pagination

List endpoints support pagination via query parameters:

- `page` — Page number (default: 1)
- `limit` — Items per page (default: 20, max: 100)

## Filtering

Most list endpoints support filtering via query parameters. See individual endpoint documentation for available filters.
