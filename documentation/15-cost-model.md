# Cost Model

**Status:** Baseline  
**Owner:** Founders  
**Currency:** INR  
**Budget target:** ₹15,000–30,000 per month for GCP and vendors, excluding SMS/WhatsApp usage, payment fees, salaries, and one-time costs  
**Related:** [06-aws-infrastructure.md](06-aws-infrastructure.md), [14-observability-and-operations.md](14-observability-and-operations.md), [16-delivery-roadmap.md](16-delivery-roadmap.md)

---

## 1. Assumptions

| Assumption      | Value                                                                       |
| --------------- | --------------------------------------------------------------------------- |
| Launch schools  | 5–10                                                                        |
| Design capacity | 20 schools / 20,000 students / 2,000 concurrent users                       |
| Region          | `asia-south1` (Mumbai)                                                      |
| Web             | 1 warm Cloud Run instance, scale to 10                                      |
| Workers         | Scale to zero                                                               |
| Database        | Cloud SQL PostgreSQL, single zone, 1 vCPU / 3.75 GB, 50 GB SSD, PITR 7 days |
| Storage         | 50–100 GB across documents and generated PDFs                               |
| Logging         | 30-day retention, health checks excluded                                    |
| Edge            | Cloudflare free or Workers Paid                                             |
| Messaging       | Pass-through, not included in the target                                    |
| Payment fees    | Pass-through, not included in the target                                    |
| Taxes           | Estimates exclude GST; GCP and vendor invoices may attract 18% GST          |

All figures are planning estimates. Verify with the GCP Pricing Calculator and vendor quotes before purchase. Currency conversion assumption: US$1 ≈ ₹85; adjust for actual billing.

## 2. Monthly GCP Estimate at Launch

| Service              | Configuration                                               | Monthly estimate   |
| -------------------- | ----------------------------------------------------------- | ------------------ |
| Cloud Run web        | 1 vCPU, 1 GiB, 1 warm, ~100k requests, mostly throttled CPU | ₹2,000–3,500       |
| Cloud Run worker     | 1 vCPU, 1 GiB, scale to zero, ~100k jobs                    | ₹500–1,500         |
| Cloud Run pdf-worker | 2 vCPU, 2 GiB, scale to zero, ~5k PDFs                      | ₹500–2,000         |
| Cloud SQL            | 1 vCPU, 3.75 GB, single zone, 50 GB SSD, backups, PITR      | ₹6,000–9,000       |
| Cloud Storage        | 50–100 GB, operations, signed URLs                          | ₹200–600           |
| Cloud Tasks          | ~1M operations                                              | ₹100–300           |
| Cloud Scheduler      | 6 jobs                                                      | ₹50–150            |
| Secret Manager       | ~15 secrets, access operations                              | ₹100–250           |
| Cloud KMS            | 1 keyring, 2 keys, operations                               | ₹100–300           |
| Artifact Registry    | ~5 GB images                                                | ₹50–150            |
| Cloud Logging        | 30-day retention with exclusions                            | ₹500–1,500         |
| Cloud Monitoring     | Metrics, uptime checks, alerts                              | ₹300–800           |
| Network egress       | API and document downloads, Cloudflare caching              | ₹300–1,000         |
| **GCP subtotal**     |                                                             | **₹10,700–21,050** |

**Why the range:** request volume, PDF count, log volume, and egress vary by school. The warm web instance and database dominate fixed cost.

## 3. Monthly Vendor Estimate at Launch

| Vendor              | Plan                                 | Monthly estimate |
| ------------------- | ------------------------------------ | ---------------- |
| Cloudflare          | Free; Workers Paid if limits require | ₹0–500           |
| Sentry              | Free or Team                         | ₹0–2,200         |
| Domain              | Amortized annual                     | ₹70–125          |
| GitHub              | Free or Team for 5 users             | ₹0–1,700         |
| Resend              | Free tier or Pro                     | ₹0–1,700         |
| Uptime/status page  | Free or low-cost                     | ₹0–500           |
| **Vendor subtotal** |                                      | **₹70–6,725**    |

Most vendors have free tiers sufficient for beta. Budget for paid tiers when usage or team size requires them.

## 4. Combined Run-Rate

| Scenario       | GCP     | Vendors | Total   |
| -------------- | ------- | ------- | ------- |
| Lean launch    | ₹10,700 | ₹70     | ₹10,800 |
| Typical launch | ₹16,000 | ₹2,500  | ₹18,500 |
| High usage     | ₹21,050 | ₹6,725  | ₹27,775 |
| Budget ceiling | —       | —       | ₹30,000 |

**Target:** stay under ₹25,000 in normal months and treat ₹30,000 as the ceiling before review.

## 5. Messaging and Payment Pass-Through

These are excluded from the run-rate target because they scale with school activity and should be passed through or included in the subscription allowance.

### 5.1 Indicative unit costs

| Channel                     | Indicative cost        | Notes                                  |
| --------------------------- | ---------------------- | -------------------------------------- |
| SMS (transactional)         | ₹0.15–0.30 per message | DLT + provider; verify with MSG91      |
| WhatsApp utility template   | ₹0.20–0.60 per message | Meta conversation pricing + BSP markup |
| WhatsApp marketing template | ₹0.60–1.00 per message | Use sparingly                          |
| Email                       | ₹0.02–0.10 per message | Resend; free tier covers small volume  |
| Push                        | ₹0                     | FCM                                    |

### 5.2 Example for one 1,000-student school

| Message type                      | Volume/month | Unit cost | Monthly cost |
| --------------------------------- | ------------ | --------- | ------------ |
| Absence alerts (SMS/WhatsApp)     | 1,000        | ₹0.25     | ₹250         |
| Fee reminders                     | 2,000        | ₹0.30     | ₹600         |
| Payment receipts (WhatsApp/email) | 1,000        | ₹0.40     | ₹400         |
| Announcements (push/email)        | 3,000        | ₹0.05     | ₹150         |
| OTPs                              | 600          | ₹0.20     | ₹120         |
| **Total**                         |              |           | **₹1,520**   |

At 10 schools, messaging could be ₹15,000–25,000 per month—comparable to or larger than infrastructure. This is why it is excluded from the base budget and must be priced into contracts.

**Controls**

- Push and in-app first for non-urgent messages.
- WhatsApp only with approved templates and opt-in.
- SMS fallback only for high-urgency events.
- Per-school monthly allowance and hard cap.
- Digest announcements where possible.
- Suppress duplicates and respect opt-outs.

### 5.3 Payment fees

Razorpay typically charges around 2% + GST per transaction, with method-specific variation. On ₹10 lakh monthly collection, that is roughly ₹20,000 + GST. This is a school cost or pass-through, not a platform infrastructure cost.

## 6. Staging Costs

Staging shares the GCP project, Cloud SQL instance, and services. Incremental cost:

| Item                                | Monthly estimate   |
| ----------------------------------- | ------------------ |
| Cloud Run staging (scale to zero)   | ₹200–800           |
| Shared Cloud SQL (staging database) | ₹0–500 incremental |
| Storage staging                     | ₹50–200            |
| Logging staging                     | ₹100–300           |
| **Staging incremental**             | **₹350–1,800**     |

A separate staging Cloud SQL instance would add ₹6,000–9,000 per month. Defer until 10+ schools or when isolation requirements justify it.

## 7. HA Scenario

At 10 schools, move Cloud SQL to HA (regional, two zones):

| Change                    | Monthly increase    |
| ------------------------- | ------------------- |
| Cloud SQL HA              | +₹8,000–15,000      |
| Possible larger tier      | +₹3,000–8,000       |
| Monitoring/logging growth | +₹500–1,500         |
| **Total increase**        | **+₹11,500–24,500** |

This can push the total above ₹30,000. Options:

1. Increase the budget with revenue.
2. Drop the shared staging database first.
3. Delay HA until revenue supports it, accepting single-zone risk with tested restores.
4. Revisit Cloud SQL tier and commitments.

**Trigger:** 10 paying schools or a contractual uptime requirement, whichever comes first.

## 8. Scaling Scenarios

| Schools     | Students | GCP estimate    | Vendors       | Total platform  | Messaging (pass-through) |
| ----------- | -------- | --------------- | ------------- | --------------- | ------------------------ |
| 3 (pilot)   | 3,000    | ₹10,000–15,000  | ₹500–3,000    | ₹10,500–18,000  | ₹5,000–8,000             |
| 10 (GA)     | 10,000   | ₹16,000–25,000  | ₹2,000–5,000  | ₹18,000–30,000  | ₹15,000–25,000           |
| 20 (design) | 20,000   | ₹25,000–40,000  | ₹3,000–8,000  | ₹28,000–48,000  | ₹30,000–50,000           |
| 20 + HA     | 20,000   | ₹40,000–60,000  | ₹3,000–8,000  | ₹43,000–68,000  | ₹30,000–50,000           |
| 50          | 50,000   | ₹60,000–100,000 | ₹8,000–15,000 | ₹68,000–115,000 | ₹75,000–125,000          |

At 50 schools, expect a larger database tier, read replicas, dedicated staging, more logging, and likely a second worker pool. Architecture still holds; the cost model must be revisited.

## 9. One-Time Costs

Excluded from monthly run-rate:

| Item                                    | Estimate           |
| --------------------------------------- | ------------------ |
| Penetration test                        | ₹1,50,000–4,00,000 |
| Legal: DPDP, DPA, privacy policy, terms | ₹50,000–1,50,000   |
| Domain and trademark search             | ₹10,000–50,000     |
| Google Play account                     | $25 (≈₹2,200)      |
| Apple Developer (post-GA)               | $99/year (≈₹8,400) |
| Test Android devices                    | ₹50,000–1,00,000   |
| Design assets, fonts, icons             | ₹0–50,000          |
| Training and travel for pilots          | ₹50,000–1,50,000   |
| Contingency (10–15%)                    | —                  |

Salaries, hiring costs, office, and founder compensation are separate and not part of this model.

## 10. Budget Allocation

| Category                               | Monthly cap |
| -------------------------------------- | ----------- |
| Cloud Run                              | ₹6,000      |
| Cloud SQL                              | ₹10,000     |
| Storage, tasks, secrets, KMS, registry | ₹1,500      |
| Logging, monitoring, egress            | ₹2,500      |
| Cloudflare, Sentry, domain, GitHub     | ₹3,000      |
| Buffer                                 | ₹7,000      |
| **Total**                              | **₹30,000** |

The buffer absorbs usage spikes, currency variation, and GST.

## 11. Cost Controls

1. **Budgets and alerts:** set a ₹25,000 monthly budget with alerts at 50%, 80%, 100%, and 120%; treat ₹15,000 as an early-warning checkpoint and ₹30,000 as a hard review ceiling.
2. **Labels:** `env`, `service`, `owner`, `cost-center`; review by label.
3. **Scale to zero:** workers and PDF workers; only web keeps a warm instance.
4. **Cloud Run caps:** max instances prevent runaway scaling.
5. **Logging:** exclude health checks and static assets; 30-day retention; archive only security logs.
6. **Storage lifecycle:** delete temporary exports after 7 days; archive closed-year documents.
7. **Image cleanup:** keep the last 20 images per service.
8. **No NAT gateway or load balancer at launch.**
9. **Cloudflare caching** for static assets and public pages.
10. **Database tier review:** rightsize after two months of metrics; consider committed use after stable.
11. **Messaging caps:** per-school allowance, duplicate suppression, push-first.
12. **Monthly review:** compare actuals to plan; investigate any line item over 20% variance.

## 12. Unit Economics (Planning)

| Assumption                        | Value                             |
| --------------------------------- | --------------------------------- |
| Subscription per student per year | ₹150–300                          |
| Students per school               | 1,000                             |
| Annual revenue per school         | ₹1.5–3 lakh                       |
| Monthly revenue per school        | ₹12,500–25,000                    |
| Platform cost at 10 schools       | ₹18,000–30,000                    |
| Messaging pass-through            | ₹15,000–25,000                    |
| Gross margin before salaries      | Thin at 5 schools, healthy at 20+ |

At 5 schools (5,000 students) and ₹200/student/year, revenue is ₹10 lakh/year (₹83,000/month), which covers infrastructure and messaging but not a full team. The business depends on reaching 20+ schools and controlling support cost.

**Pricing must be validated with pilot schools before GA.**

## 13. Cost Review Cadence

| Frequency          | Activity                                              |
| ------------------ | ----------------------------------------------------- |
| Weekly during beta | GCP billing, messaging, error budget                  |
| Monthly after GA   | Full cost review, forecast, vendor invoices           |
| Quarterly          | Pricing and unit economics, commitments, HA readiness |
| Annually           | Vendor renegotiation, architecture cost review        |

## 14. Exclusions

- Salaries, contractor payments, and hiring costs
- Payment gateway fees
- SMS, WhatsApp, and email overages
- One-time legal, security, and hardware costs
- Office, travel, and utilities
- GST and other taxes
- Refunds and chargebacks
- Support tooling beyond the listed vendors

## 15. Open Cost Questions

| Question                                           | Owner         | Deadline |
| -------------------------------------------------- | ------------- | -------- |
| Confirm GCP pricing with the calculator for Mumbai | Engineering   | Dec 2026 |
| Decide Cloudflare free vs Workers Paid             | Engineering   | Jan 2027 |
| Confirm Sentry plan after beta usage               | Engineering   | Jul 2027 |
| Set messaging allowance per school                 | Product       | Apr 2027 |
| Approve HA budget at 10 schools                    | Founders      | Sep 2027 |
| Confirm whether GST is included in school pricing  | Founders / CA | Mar 2027 |

## 16. Related Documents

- [00-executive-summary.md](00-executive-summary.md)
- [06-aws-infrastructure.md](06-aws-infrastructure.md)
- [14-observability-and-operations.md](14-observability-and-operations.md)
- [16-delivery-roadmap.md](16-delivery-roadmap.md)
