# Communication

**Prefix:** `FR-COMM`  
**Release:** Beta; campaigns and advanced reporting at GA  
**Owner:** Product / Communication

---

## 1. Purpose

Deliver timely, reliable, and cost-controlled messages to parents and staff across push, WhatsApp, SMS, and email, with templates and delivery visibility.

## 2. Actors and Permissions

| Actor                    | Permissions                                                                      |
| ------------------------ | -------------------------------------------------------------------------------- |
| School admin / principal | Create announcements, manage templates, view delivery reports                    |
| Teacher                  | Send class-scoped announcements if permitted; see own sent messages              |
| Accountant               | Send fee reminders within approved templates                                     |
| Parent                   | Receive messages, manage non-essential preferences                               |
| Platform admin           | Manage provider configuration and global templates; no school content by default |

## 3. Release Scope

**Beta**

- Transactional notifications: OTP, absence, fee due, payment receipt, admission acknowledgement, payslip
- Announcements targeted by school, class, section, and role
- Templates with variables and school branding
- Email via Resend, SMS via MSG91 with DLT, WhatsApp via BSP, push via FCM
- Delivery status and failure queue
- Opt-outs for non-essential messages
- Basic cost tracking

**GA**

- Scheduled campaigns
- Delivery reports by channel and audience
- Template approval status for WhatsApp
- Send-time optimization and quiet hours
- Parent inbox in app

**Post-GA**

- Two-way chat
- Surveys and forms
- PTM booking
- Voice calls

## 4. Functional Requirements

- **FR-COMM-001 (MUST):** Configure provider credentials per environment and sender identities per school.
- **FR-COMM-002 (MUST):** Create message templates with variables, channel, language, and category.
- **FR-COMM-003 (MUST):** Templates render with school branding and validate required variables.
- **FR-COMM-004 (MUST):** Send transactional messages triggered by domain events.
- **FR-COMM-005 (MUST):** Create announcements with audience filters and preview recipient count.
- **FR-COMM-006 (MUST):** Support push, WhatsApp, SMS, and email channels; channel selection is per template or message.
- **FR-COMM-007 (MUST):** Respect opt-outs for non-essential messages.
- **FR-COMM-008 (MUST):** Record delivery status per recipient and channel.
- **FR-COMM-009 (MUST):** Retry transient failures with backoff; expose permanent failures.
- **FR-COMM-010 (MUST):** Enforce DLT template IDs for SMS and approved template IDs for WhatsApp.
- **FR-COMM-011 (MUST):** Rate-limit sends per school and provider.
- **FR-COMM-012 (MUST):** Track cost per message and per school.
- **FR-COMM-013 (MUST):** Parents can view announcements in the app.
- **FR-COMM-014 (SHOULD):** Schedule announcements for a future time.
- **FR-COMM-015 (SHOULD):** Quiet hours for non-urgent messages.
- **FR-COMM-016 (SHOULD):** Fallback chain, e.g., WhatsApp → SMS if undelivered after a timeout.
- **FR-COMM-017 (SHOULD):** Preview message as the recipient would see it.
- **FR-COMM-018 (WON'T for beta):** Two-way chat.

## 5. Business Rules

1. Transactional messages (absence, payment, OTP) are not blocked by marketing opt-outs, but channel preferences apply where legally allowed.
2. OTP messages are sent synchronously; other messages are queued.
3. WhatsApp requires an approved template and opt-in per Meta policy.
4. SMS requires a DLT-registered entity, sender ID, and template.
5. Email requires a verified sending domain with SPF, DKIM, and DMARC.
6. Push requires a registered device token and notification permission.
7. Duplicate notifications for the same event and recipient are suppressed.
8. Delivery status is recorded as queued, sent, delivered, failed, or opted out.
9. Announcement recipients are resolved at send time, with a preview count before send.
10. Messages never contain Aadhaar numbers, bank details, or full medical information.
11. Parents can update their phone number only through a verified change flow.
12. Messaging costs are attributed to the school.

## 6. Key Data

`notification_templates`, `template_versions`, `template_approvals`, `announcements`, `announcement_audiences`, `notifications`, `notification_deliveries`, `notification_preferences`, `opt_outs`, `provider_configs`, `message_costs`, `outbox_jobs`.

## 7. APIs and Events

**APIs**

- `GET/POST /api/v1/communication/templates`
- `POST /api/v1/communication/announcements`
- `POST /api/v1/communication/announcements/{id}/send`
- `GET /api/v1/communication/deliveries`
- `POST /api/v1/webhooks/resend`
- `POST /api/v1/webhooks/msg91`
- `POST /api/v1/webhooks/whatsapp`
- `GET /api/v1/communication/preferences`

**Events**

- `notification.queued`
- `notification.sent`
- `notification.delivered`
- `notification.failed`
- `announcement.sent`
- `opt_out.updated`
- `template.approved`

## 8. Template Variables

Common variables: student name, guardian name, school name, class/section, invoice number, amount, due date, receipt number, exam name, result status, attendance date, support phone, payment link.

Validation ensures required variables exist and no unknown variables are rendered.

## 9. Edge Cases

- Provider outage
- DLT/WhatsApp template rejected
- Parent changes phone number
- Duplicate event triggers
- Invalid device token
- Opt-out after message queued
- Message exceeds channel length
- Cost cap reached
- School suspended
- Language unavailable for a template

## 10. Acceptance Criteria

- **Given** an approved WhatsApp template, **when** an absence event occurs after cutoff, **then** the parent receives one message and delivery status is recorded.
- **Given** an SMS without a DLT template ID, **when** saved, **then** the system blocks sending with a clear error.
- **Given** a parent who opted out of non-essential messages, **when** an announcement is sent, **then** they are excluded but still receive fee and safety alerts.
- **Given** a provider timeout, **when** the job retries, **then** duplicate messages are not delivered to the parent.
- **Given** an announcement audience of 500 parents, **when** previewed, **then** the count and channel cost estimate are shown before sending.
- **Given** a permanent provider failure, **when** retries exhaust, **then** the failure appears in the exception queue.

## 11. Metrics and Audit Events

**Metrics**

- Delivery rate by channel
- Failure rate by provider
- Cost per message and per school
- Opt-out rate
- Announcement open/view rate (push/app)
- Time from event to delivery

**Audit events**

- Template created/updated/approved
- Announcement created/sent/cancelled
- Provider configuration changed
- Opt-out updated
- Cost cap changed

## 12. Open Questions

- Which WhatsApp BSP is selected: Gupshup, Interakt, Kaleyra, or direct Meta?
- Is SMS fallback required at beta?
- What is the monthly messaging allowance per school?
- Who owns DLT registration and WhatsApp business verification?
