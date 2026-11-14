# API Contracts

**Status:** Baseline  
**Owner:** Engineering  
**Base path:** `/api/v1`  
**Related:** [04-system-architecture.md](04-system-architecture.md), [07-multi-tenancy-and-authorization.md](07-multi-tenancy-and-authorization.md), [10-mobile-application.md](10-mobile-application.md)

---

## 1. API Principles

1. **REST over HTTP** with JSON payloads and standard status codes.
2. **Server-authoritative.** Clients never decide authorization, totals, or final status.
3. **Tenant-safe by construction.** The school is derived from the authenticated context, not a request body.
4. **Idempotent where retries are expected.** Payments, imports, payroll, and publishing.
5. **Explicit contracts.** Zod schemas generate OpenAPI and typed clients.
6. **No breaking changes inside a major version.** Additive changes only.
7. **Fast acknowledgement, asynchronous work.** Slow operations return `202` with a job ID.
8. **Every response has a request ID.** Support can trace any error.

## 2. Authentication

| Client                    | Mechanism                                                                     |
| ------------------------- | ----------------------------------------------------------------------------- |
| Web                       | Better Auth session cookie (`HttpOnly`, `Secure`, `SameSite=Lax`)             |
| Mobile                    | `Authorization: Bearer <access_jwt>`                                          |
| Cloud Tasks / Scheduler   | Google OIDC token; audience checked                                           |
| Webhooks                  | Provider signature                                                            |
| Server-to-server internal | Not exposed publicly; use Cloud Run IAM or shared secret for worker callbacks |

**Cookie CSRF protection:** mutating requests must include a CSRF token header and a valid `Origin` or `Referer` matching the school host. `GET`, `HEAD`, and `OPTIONS` are exempt.

**Token expiry:** access token 15 minutes; refresh token 30 days rotating. The API returns `401` with code `AUTH_TOKEN_EXPIRED` so the client can refresh once and retry.

## 3. Tenant Resolution

| Request type | Tenant source                                                                    |
| ------------ | -------------------------------------------------------------------------------- |
| Web page/API | Host → school slug → session membership                                          |
| Mobile API   | Access token’s active membership; child ID resolves the school for parent routes |
| Platform API | Platform admin session; no school tenant unless impersonating                    |
| Webhook      | Provider account mapping or payload lookup; no host trust                        |

**Rules**

- A `school_id` in a path or body is a filter, never proof of access.
- If the host school and token school differ, return `403 TENANT_MISMATCH`.
- Parent routes verify the guardian link for the child before setting tenant context.
- Jobs carry `school_id` and re-validate before writing.

## 4. Request Conventions

### 4.1 Headers

| Header                           | Purpose                                                    |
| -------------------------------- | ---------------------------------------------------------- |
| `Authorization`                  | Bearer token for mobile                                    |
| `Content-Type: application/json` | JSON bodies                                                |
| `Idempotency-Key`                | Required for specified mutations                           |
| `X-CSRF-Token`                   | Web mutating requests                                      |
| `X-Request-ID`                   | Optional client correlation ID; server generates if absent |
| `Accept-Language`                | `en`, `hi`, or regional code                               |
| `X-App-Version`                  | Mobile version for minimum-version enforcement             |
| `X-Device-ID`                    | Mobile device identifier                                   |

### 4.2 Dates and times

- Dates: `YYYY-MM-DD`.
- Timestamps: ISO 8601 with offset, e.g. `2027-06-14T09:12:31+05:30`.
- Server stores UTC; display uses school timezone.
- Academic years and financial years are explicit fields, not inferred from dates.

### 4.3 Money

```json
{
  "amount_paise": 125000,
  "currency": "INR"
}
```

Never send or accept decimal rupees for financial mutations. Read models may include `amount_display` for convenience, but clients must not use it for calculations.

### 4.4 IDs

All resource IDs are UUID strings. Human-readable numbers (`admission_number`, `invoice_number`, `receipt_number`) are separate fields and are never used as database identifiers.

## 5. Response Envelopes

### 5.1 Single resource

```json
{
  "data": {
    "id": "0192f0c4-7a2b-7c3d-8e9f-0123456789ab",
    "name": "Aarav Sharma"
  },
  "meta": {
    "request_id": "req_01J8Z3K4M5"
  }
}
```

### 5.2 List

```json
{
  "data": [ ... ],
  "page": {
    "limit": 20,
    "has_more": true,
    "next_cursor": "eyJpZCI6IjAxOTJmMGM0..."
  },
  "meta": {
    "request_id": "req_01J8Z3K4M5"
  }
}
```

### 5.3 Error

```json
{
  "error": {
    "code": "FEE_INVOICE_ALREADY_PAID",
    "message": "This invoice is already fully paid.",
    "details": [{ "field": "invoice_id", "message": "Invoice is in paid status." }],
    "request_id": "req_01J8Z3K4M5"
  }
}
```

Rules:

- `message` is safe for end users and localized where practical.
- `code` is stable and machine-readable; clients branch on code, not message.
- `details` is optional and field-oriented.
- Stack traces, SQL, and provider secrets never appear.

### 5.4 Status codes

| Code        | Use                                                         |
| ----------- | ----------------------------------------------------------- |
| `200`       | Success                                                     |
| `201`       | Created; include `Location`                                 |
| `202`       | Accepted for async processing; include job ID               |
| `204`       | Success, no body                                            |
| `400`       | Malformed request or validation failure                     |
| `401`       | Missing/invalid/expired authentication                      |
| `403`       | Authenticated but not permitted                             |
| `404`       | Not found or not visible in tenant                          |
| `409`       | Conflict, duplicate, stale version, or idempotency mismatch |
| `410`       | School suspended or resource permanently unavailable        |
| `422`       | Business rule violation                                     |
| `429`       | Rate limited; include `Retry-After`                         |
| `500`       | Unexpected server error                                     |
| `502`/`503` | Dependency failure or maintenance                           |
| `504`       | Upstream timeout                                            |

`404` is preferred over `403` when revealing existence would leak cross-tenant data.

## 6. Pagination, Filtering, Sorting

### 6.1 Pagination

- Cursor-based by default.
- `limit`: 1–100, default 20.
- `cursor`: opaque, signed, tied to the filter and sort.
- Response includes `page.next_cursor` and `page.has_more`.
- Cursors expire after 24 hours; expired cursors return `400 INVALID_CURSOR`.
- Stable ordering always includes `id` as the final tiebreaker.

### 6.2 Filtering

```
GET /api/v1/students?filter[status]=active&filter[class_id]=...&q=aarav&sort=last_name,-created_at
```

- Unknown filters return `400 UNKNOWN_FILTER`.
- Filter fields are allowlisted per endpoint.
- Date ranges use `from` and `to` with a maximum span where needed.
- Search `q` is trimmed, minimum two characters, and rate-limited.

### 6.3 Counts

Expensive totals are not included in every list response. Dedicated summary endpoints provide counts, or the client requests `include=total` where the endpoint supports it and the query is bounded.

## 7. Idempotency

**Required for:**

- `POST /fees/payments/offline`
- `POST /fees/payments/online/order`
- `POST /fees/refunds`
- `POST /fees/invoices/generate`
- `POST /students/imports` commit
- `POST /payroll/runs`
- `POST /exams/{id}/report-cards/publish`
- `POST /communication/announcements/{id}/send`

**Behavior**

1. Client sends a unique `Idempotency-Key` (UUID or 32+ char string).
2. Server stores key, request hash, status, and response.
3. Same key + same body returns the stored response.
4. Same key + different body returns `409 IDEMPOTENCY_KEY_REUSED`.
5. A request still processing returns `409 IDEMPOTENCY_IN_PROGRESS` with `Retry-After`.
6. Keys expire after 24 hours, except payment keys which are retained 7 days.

## 8. Optimistic Concurrency

Mutable financial and exam resources include a `version` field. Updates send `If-Match: "7"` or `version` in the body. A stale version returns:

```json
{
  "error": {
    "code": "STALE_VERSION",
    "message": "This record was updated by someone else. Reload and try again.",
    "details": [{ "current_version": 8 }],
    "request_id": "req_..."
  }
}
```

## 9. Rate Limits

| Scope                      | Limit                |
| -------------------------- | -------------------- |
| General authenticated user | 600 requests/minute  |
| General per IP             | 300 requests/minute  |
| OTP request per phone      | 5/hour               |
| OTP request per IP         | 20/hour              |
| OTP verify per session     | 5 attempts           |
| Login attempts per account | 10/hour with backoff |
| Payment order creation     | 10/student/minute    |
| Announcement send          | 5/school/hour        |
| Export creation            | 20/user/hour         |
| Public admission form      | 10/IP/hour, captcha  |

Rate limits are enforced in the app with Cloudflare as a coarse first layer. `429` responses include `Retry-After` and `X-RateLimit-*` headers.

## 10. Key Endpoint Contracts

### 10.1 Create student

```http
POST /api/v1/students
```

```json
{
  "first_name": "Aarav",
  "last_name": "Sharma",
  "date_of_birth": "2015-04-18",
  "gender": "male",
  "admission_number": "2027-0142",
  "admission_date": "2027-04-01",
  "class_id": "0192...",
  "section_id": "0192...",
  "guardians": [
    {
      "name": "Rohit Sharma",
      "relationship": "father",
      "phone": "+919876543210",
      "email": "rohit@example.com",
      "is_primary": true,
      "can_pay": true
    }
  ]
}
```

`201 Created` with the student, enrollment, and guardian links. Duplicate admission number returns `409 STUDENT_ADMISSION_NUMBER_TAKEN`.

### 10.2 Generate invoices

```http
POST /api/v1/fees/invoices/generate
Idempotency-Key: 5b0e...
```

```json
{
  "academic_year_id": "0192...",
  "term": "2027-T1",
  "class_ids": ["0192..."],
  "due_date": "2027-04-15",
  "dry_run": false
}
```

`202 Accepted`:

```json
{
  "data": {
    "job_id": "0192...",
    "status": "queued",
    "estimated_students": 412
  },
  "meta": { "request_id": "req_..." }
}
```

A dry run returns `200` with counts and validation issues without creating invoices.

### 10.3 Create payment order

```http
POST /api/v1/fees/payments/online/order
Idempotency-Key: 7c1a...
Authorization: Bearer ...
```

```json
{
  "student_id": "0192...",
  "invoice_ids": ["0192...", "0192..."],
  "amount_paise": 250000
}
```

```json
{
  "data": {
    "payment_id": "0192...",
    "gateway": "razorpay",
    "gateway_order_id": "order_...",
    "amount_paise": 250000,
    "currency": "INR",
    "key_id": "rzp_live_...",
    "expires_at": "2027-06-14T10:00:00+05:30"
  }
}
```

The server validates the requested amount against unpaid invoice balances. Amount tampering returns `422 PAYMENT_AMOUNT_MISMATCH`.

### 10.4 Attendance sync

```http
POST /api/v1/mobile/sync/attendance
Authorization: Bearer ...
```

```json
{
  "device_id": "0192...",
  "operations": [
    {
      "operation_id": "0192...",
      "type": "attendance.submit",
      "section_id": "0192...",
      "date": "2027-06-14",
      "session": "full_day",
      "records": [
        { "student_id": "0192...", "status": "present" },
        { "student_id": "0192...", "status": "absent" }
      ],
      "client_recorded_at": "2027-06-14T09:12:31+05:30"
    }
  ]
}
```

```json
{
  "data": {
    "results": [
      {
        "operation_id": "0192...",
        "status": "applied",
        "session_id": "0192...",
        "server_recorded_at": "2027-06-14T09:14:02+05:30"
      }
    ]
  }
}
```

Per-operation status: `applied`, `duplicate`, `conflict`, `rejected`. A batch is partial-success capable; the client reconciles each item.

### 10.5 Publish report cards

```http
POST /api/v1/exams/{exam_id}/report-cards/publish
Idempotency-Key: ...
```

```json
{
  "class_ids": ["0192..."],
  "section_ids": ["0192..."],
  "publish_at": "2027-10-01T10:00:00+05:30"
}
```

Returns `202` with a job ID. Publishing is blocked with `422 EXAM_MARKS_INCOMPLETE` if mandatory marks are missing; the error includes counts by subject/section, not student PII beyond what the caller can access.

### 10.6 Create payroll run

```http
POST /api/v1/payroll/runs
Idempotency-Key: ...
```

```json
{
  "month": "2027-09",
  "department_ids": ["0192..."],
  "notes": "September payroll"
}
```

Returns the run in `draft` status with computed items and exceptions. Approval and lock are separate endpoints.

## 11. Webhooks

| Provider     | Endpoint                         | Verification                                     |
| ------------ | -------------------------------- | ------------------------------------------------ |
| Razorpay     | `POST /api/v1/webhooks/razorpay` | `X-Razorpay-Signature` HMAC-SHA256 over raw body |
| Resend       | `POST /api/v1/webhooks/resend`   | Svix signature headers                           |
| MSG91        | `POST /api/v1/webhooks/msg91`    | Shared secret/signature or IP allowlist          |
| WhatsApp BSP | `POST /api/v1/webhooks/whatsapp` | `X-Hub-Signature-256` or BSP signature           |

**Rules**

1. Read the raw body before JSON parsing for signature verification.
2. Compare signatures in constant time.
3. Store every event in `gateway_events` with a unique provider event ID.
4. Return `2xx` quickly after durable storage; do the work asynchronously.
5. Duplicate events return `200` without reprocessing.
6. Unverified events return `400` and are logged without payload secrets.
7. Webhook endpoints are excluded from session auth and CSRF.
8. Provider retries are expected; handlers must be idempotent.

## 12. Async Job Contract

For `202 Accepted`:

```json
{
  "data": {
    "job_id": "0192...",
    "status": "queued",
    "poll_url": "/api/v1/jobs/0192..."
  }
}
```

Job status values: `queued`, `running`, `succeeded`, `failed`, `cancelled`.

```json
{
  "data": {
    "id": "0192...",
    "type": "invoice.generate",
    "status": "succeeded",
    "progress": { "processed": 412, "total": 412 },
    "result": { "created": 412, "skipped": 0 },
    "error": null,
    "created_at": "...",
    "completed_at": "..."
  }
}
```

Jobs are visible only to the user who created them or an authorized admin in the same school.

## 13. Versioning and Deprecation

- Major version in the URL: `/api/v1`.
- Additive fields are non-breaking; clients must ignore unknown fields.
- Removing or renaming a field requires `/api/v2`.
- Deprecated endpoints return `Deprecation` and `Sunset` headers and are documented for at least six months.
- Mobile clients send `X-App-Version`; the server can require an upgrade for security or contract reasons.
- OpenAPI is published to staging and internal docs; the public API is not marketed for third-party integrations in year one.

## 14. OpenAPI and Typed Clients

- Zod schemas live in `packages/contracts`.
- OpenAPI 3.1 is generated from route metadata and schemas.
- CI fails if generated types are stale.
- Web and mobile use a typed fetch wrapper with:
  - Automatic auth header injection
  - One-time refresh-and-retry on `401`
  - Request IDs in errors
  - Timeouts and cancellation
  - Consistent error objects
- Mobile contract changes are checked against the minimum supported app version.

## 15. Error Code Catalog (initial)

| Code                             | HTTP | Meaning                          |
| -------------------------------- | ---- | -------------------------------- |
| `VALIDATION_FAILED`              | 400  | Schema validation failed         |
| `AUTH_REQUIRED`                  | 401  | No credentials                   |
| `AUTH_TOKEN_EXPIRED`             | 401  | Access token expired; refresh    |
| `AUTH_INVALID`                   | 401  | Invalid credentials or token     |
| `FORBIDDEN`                      | 403  | Permission denied                |
| `TENANT_MISMATCH`                | 403  | Host/session/school mismatch     |
| `NOT_FOUND`                      | 404  | Resource absent or out of scope  |
| `STALE_VERSION`                  | 409  | Optimistic concurrency conflict  |
| `IDEMPOTENCY_KEY_REUSED`         | 409  | Same key, different body         |
| `IDEMPOTENCY_IN_PROGRESS`        | 409  | Original request still running   |
| `STUDENT_ADMISSION_NUMBER_TAKEN` | 409  | Duplicate admission number       |
| `ATTENDANCE_ALREADY_SUBMITTED`   | 409  | Session locked                   |
| `PAYMENT_AMOUNT_MISMATCH`        | 422  | Amount does not match dues       |
| `INVOICE_CANCELLED`              | 422  | Invoice cannot receive payment   |
| `REFUND_EXCEEDS_AVAILABLE`       | 422  | Refund too large                 |
| `EXAM_MARKS_INCOMPLETE`          | 422  | Cannot publish                   |
| `PAYROLL_ALREADY_LOCKED`         | 422  | Run is immutable                 |
| `RATE_LIMITED`                   | 429  | Too many requests                |
| `DEPENDENCY_UNAVAILABLE`         | 503  | Provider or database unavailable |
| `INTERNAL_ERROR`                 | 500  | Unexpected error                 |

New codes are additive. Codes are documented in the OpenAPI description and the developer reference.

## 16. Related Documents

- [04-system-architecture.md](04-system-architecture.md)
- [07-multi-tenancy-and-authorization.md](07-multi-tenancy-and-authorization.md)
- [08-data-model.md](08-data-model.md)
- [10-mobile-application.md](10-mobile-application.md)
- [12-testing-and-quality.md](12-testing-and-quality.md)
