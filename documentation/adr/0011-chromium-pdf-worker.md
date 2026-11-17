# ADR-0011: Chromium PDF Worker

- **Status:** Accepted
- **Date:** 14 November 2026
- **Owner:** Founder 1
- **Related:** [../04-system-architecture.md](../04-system-architecture.md), [../06-aws-infrastructure.md](../06-aws-infrastructure.md), [../modules/exams-and-report-cards.md](../modules/exams-and-report-cards.md)

---

## Context

The platform must generate:

- Report cards with complex tables, grades, attendance, remarks, and school branding
- Fee receipts with legal headers and Indian number formatting
- Payslips with earnings/deductions tables
- Registers and exports

These documents are HTML/CSS-friendly and must support Devanagari and a regional script. They are generated in bulk, must not block web requests, and must be stored privately.

## Decision

Run a **dedicated `pdf-worker` Cloud Run service** with headless Chromium:

- HTML/CSS templates rendered server-side.
- `puppeteer-core` with a pinned Chromium build and bundled fonts.
- Jobs delivered via Cloud Tasks with OIDC authentication.
- Output written to GCS; database stores the object path and version.
- Scale to zero; 2 vCPU, 2 GiB, concurrency 1–2.
- No direct public access; signed URLs for downloads.
- Templates versioned; published report cards reference the template version.

## Consequences

**Easier**

- Consistent, high-fidelity layout with CSS.
- Good Indic font rendering.
- Reuse of web design tokens and components.
- Isolated memory-heavy rendering from the web app.
- Retryable batch jobs.

**Harder**

- Image is large and cold starts are slower.
- Chromium memory usage limits concurrency.
- Security surface of a browser process; must isolate and restrict.
- Fonts must be bundled and licensed.
- PDF generation is eventually consistent, not instant.

**New requirements**

- Chromium sandbox flags and non-root user.
- Pinned Chromium version and regular patching.
- Font licensing and subsetting.
- Template versioning and golden tests.
- Queue-based orchestration for bulk generation.
- GCS lifecycle and signed URL policy.
- Memory and timeout alerts.

## Alternatives Considered

| Alternative           | Why not                                                         |
| --------------------- | --------------------------------------------------------------- |
| `wkhtmltopdf`         | Unmaintained, poor modern CSS support                           |
| React PDF             | Limited layout control for complex report cards                 |
| LaTeX                 | Steep learning curve and poor fit for school-designed templates |
| Third-party PDF API   | Recurring cost, data residency, and vendor dependency           |
| Browser-side printing | Inconsistent output and poor bulk workflow                      |

## References

- [04-system-architecture.md](../04-system-architecture.md)
- [06-aws-infrastructure.md](../06-aws-infrastructure.md)
- [modules/exams-and-report-cards.md](../modules/exams-and-report-cards.md)
