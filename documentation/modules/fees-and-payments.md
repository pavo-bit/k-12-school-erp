# Fees and Payments

**Prefix:** `FR-FEE`  
**Release:** Beta; refunds and advanced reports at GA  
**Owner:** Product / Finance

---

## 1. Purpose

Make fee demand, collection, receipts, dues, and reconciliation accurate and auditable for schools and parents.

## 2. Actors and Permissions

| Actor                    | Permissions                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| Accountant               | Create fee structures, invoices, offline payments, concessions (with approval), refunds, reports |
| School admin / principal | Approve concessions/refunds, view all fee data                                                   |
| Parent                   | View own child’s invoices, pay online, download receipts                                         |
| Teacher                  | No fee access by default                                                                         |
| Platform admin           | No default access; impersonation blocks payment actions                                          |

## 3. Release Scope

**Beta**

- Fee heads and fee structures
- Student fee assignments
- Concessions and scholarships
- Invoice generation
- Online payments via Razorpay/UPI
- Offline cash/cheque/DD/UPI-reference payments
- Partial payments and allocation
- Gapless receipts
- Dues, reminders, daily collection
- Opening balances migration
- Basic reconciliation

**GA**

- Refunds with approval and audit
- Gateway refunds via Razorpay
- Advanced reconciliation exception handling
- Concession approval workflow
- Late-fee rules
- Advanced reports: demand vs collection, aging, fee-head summary, class-wise outstanding
- Tally-compatible export (post-GA if not ready)

## 4. Functional Requirements

### Fee setup

- **FR-FEE-001 (MUST):** Create fee heads with name, code, category, taxable flag, and default amount.
- **FR-FEE-002 (MUST):** Create fee structures per academic year, class, and optional category.
- **FR-FEE-003 (MUST):** Fee structure lines reference a fee head, amount, frequency, and due date rule.
- **FR-FEE-004 (MUST):** Assign a fee structure to a student based on class and category, with overrides.
- **FR-FEE-005 (MUST):** Optional fee heads such as transport or hostel can be assigned individually.

### Invoices and dues

- **FR-FEE-010 (MUST):** Generate invoices per student per term/month based on the assigned structure.
- **FR-FEE-011 (MUST):** Invoice lines show fee head, amount, concession, and net amount.
- **FR-FEE-012 (MUST):** Invoice status: draft, issued, partially paid, paid, overdue, cancelled.
- **FR-FEE-013 (MUST):** Issued invoices are immutable; corrections use a credit note or cancellation with audit.
- **FR-FEE-014 (MUST):** Due dates and grace periods are configurable.
- **FR-FEE-015 (MUST):** Late fees are optional and configurable; default off.
- **FR-FEE-016 (MUST):** Opening dues can be imported with reference numbers and reconciled.
- **FR-FEE-017 (MUST):** Invoice generation is idempotent; reruns do not duplicate invoices.

### Payments

- **FR-FEE-020 (MUST):** Record an offline payment with mode, reference, date, amount, and collector.
- **FR-FEE-021 (MUST):** Initiate an online payment via Razorpay order; store order ID and status.
- **FR-FEE-022 (MUST):** Verify Razorpay webhook signatures and reject invalid or replayed events.
- **FR-FEE-023 (MUST):** Payment processing is idempotent by gateway event ID and idempotency key.
- **FR-FEE-024 (MUST):** Allocate payments to invoices using a configurable order: oldest due first by default.
- **FR-FEE-025 (MUST):** Support partial payments and multiple invoices per payment.
- **FR-FEE-026 (MUST):** Issue a receipt PDF with a gapless number per school and financial year.
- **FR-FEE-027 (MUST):** Parent app shows payment history and receipts.
- **FR-FEE-028 (MUST):** Daily collection report by mode, collector, class, and fee head.
- **FR-FEE-029 (MUST):** Failed payments do not create receipts or allocations.
- **FR-FEE-030 (SHOULD):** Advance payments or wallet credits are post-beta.

### Concessions and refunds

- **FR-FEE-040 (MUST):** Concessions can be amount or percentage, with reason, approver, and validity.
- **FR-FEE-041 (MUST):** Concessions apply to future invoices or generate a credit note.
- **FR-FEE-042 (MUST):** Refunds require approval, reason, and audit; gateway refunds at GA.
- **FR-FEE-043 (MUST):** Refunds cannot exceed the unallocated paid amount.

### Reconciliation

- **FR-FEE-050 (MUST):** Import or fetch Razorpay settlement data.
- **FR-FEE-051 (MUST):** Match gateway payments to ERP payments and flag exceptions.
- **FR-FEE-052 (MUST):** Exception queue for missing webhook, amount mismatch, duplicate, and settlement mismatch.
- **FR-FEE-053 (MUST):** Manual resolution requires reason and audit.
- **FR-FEE-054 (SHOULD):** Daily reconciliation summary for the accountant.

## 5. Business Rules

1. Money is stored as integer paise; no floating point.
2. Receipt numbers are gapless per school and financial year; allocation happens in the same transaction.
3. Issued invoices are never edited; use credit notes/cancellation.
4. A payment’s allocations must sum exactly to the payment amount.
5. Overpayment becomes unallocated credit; refund or apply later.
6. Gateway fees are recorded separately and are not deducted from the invoice amount unless configured.
7. A cancelled invoice cannot receive new allocations.
8. A concession cannot make an invoice negative; excess becomes a credit note.
9. Only one active fee structure assignment per student per academic year unless explicitly overridden.
10. Financial records are retained for at least seven years.
11. Parents see only their own children’s invoices and receipts.
12. Sensitive fee actions during impersonation are blocked.

## 6. Key Data

`fee_heads`, `fee_structures`, `fee_structure_lines`, `fee_assignments`, `concessions`, `invoices`, `invoice_lines`, `payments`, `payment_allocations`, `receipts`, `refunds`, `credit_notes`, `gateway_orders`, `gateway_events`, `settlements`, `reconciliation_runs`, `document_sequences`.

## 7. APIs and Events

**APIs**

- `GET/POST /api/v1/fees/heads`
- `GET/POST /api/v1/fees/structures`
- `POST /api/v1/fees/invoices/generate`
- `GET /api/v1/fees/invoices?student_id=`
- `POST /api/v1/fees/payments/offline`
- `POST /api/v1/fees/payments/online/order`
- `POST /api/v1/webhooks/razorpay`
- `POST /api/v1/fees/refunds`
- `GET /api/v1/fees/reports/collection`
- `GET /api/v1/fees/reports/outstanding`
- `POST /api/v1/fees/reconciliation/run`

**Events**

- `invoice.issued`
- `payment.received`
- `payment.failed`
- `receipt.issued`
- `refund.approved`
- `reconciliation.exception`
- `fee.reminder_sent`

## 8. Imports and Exports

- Opening dues import: student admission number, invoice reference, fee head, amount, due date.
- Fee structure import.
- Collection export, outstanding export, reconciliation export.
- Receipt PDF and daily cashbook PDF.
- Tally-compatible export (post-GA).

## 9. Edge Cases

- Payment succeeds but webhook is delayed
- Duplicate webhook delivery
- Parent pays while accountant records offline payment
- Partial payment then refund
- Student changes section after invoice generation
- Concession applied after invoice issued
- Gateway settlement includes fee deduction
- Cheque bounce
- Opening balance mismatch
- Parent has children in two schools

## 10. Acceptance Criteria

- **Given** an issued invoice, **when** a parent pays the full amount, **then** the invoice becomes paid, a gapless receipt is generated, and the parent sees it immediately.
- **Given** a duplicate webhook, **when** processed, **then** no second payment or receipt is created.
- **Given** a partial payment, **when** allocated, **then** the invoice balance decreases and the allocation total equals the payment amount.
- **Given** a school with two receipts issued, **when** the third receipt is generated, **then** its number is exactly one greater than the previous receipt for that financial year.
- **Given** a refund request above the unallocated amount, **when** submitted, **then** the system rejects it.
- **Given** a settlement mismatch, **when** reconciliation runs, **then** an exception appears with the gateway and ERP amounts.
- **Given** an accountant without refund permission, **when** they attempt a refund, **then** the API returns 403 and the action is not possible from the UI.

## 11. Metrics and Audit Events

**Metrics**

- Collection rate vs demand
- Online payment success rate
- Reconciliation exception count
- Average days to collect
- Receipt generation time
- Reminder delivery and conversion

**Audit events**

- Fee head/structure created or changed
- Invoice issued/cancelled
- Payment recorded
- Receipt issued/reprinted
- Concession approved
- Refund approved/processed
- Reconciliation exception resolved
- Opening dues imported

## 12. Open Questions

- Is late fee required for beta? Default: no.
- What is the default allocation order? Oldest due first, then fee-head priority.
- Are gateway fees borne by the school or parent?
- Is a fee wallet/advance payment required in year one? Default: post-GA.
- Which GST treatment applies to each fee head? Requires CA input.
