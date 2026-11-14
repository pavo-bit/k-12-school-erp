# UI/UX Guidelines

**Status:** Baseline  
**Owner:** Design  
**Related:** [02-personas-and-user-journeys.md](02-personas-and-user-journeys.md), [20-engineering-standards.md](20-engineering-standards.md), [modules/parent-app.md](modules/parent-app.md), [modules/teacher-app.md](modules/teacher-app.md)

---

## 1. Design Principles

1. **Clarity over density.** A principal should understand the screen in five seconds.
2. **Speed is a feature.** Teachers mark attendance in under a minute; parents pay in under two.
3. **Trust is visual.** Money and academic data look precise, calm, and auditable.
4. **Progressive disclosure.** Show the common path; reveal complexity on demand.
5. **Forgiving by default.** Confirm destructive actions, preserve drafts, explain errors.
6. **Inclusive from the start.** Hindi, regional scripts, low-end Android, slow networks.
7. **Consistent, not uniform.** Admin and parent surfaces share tokens but optimize for their context.

## 2. Brand and Tone

**Personality:** dependable, approachable, efficient, Indian-first.

**Voice:** plain, direct, respectful. Speak to the user as a capable adult. Avoid jargon, bureaucratic phrasing, and blame.

| Instead of                                  | Write                                                                           |
| ------------------------------------------- | ------------------------------------------------------------------------------- |
| “Record has been successfully created.”     | “Student added.”                                                                |
| “Invalid credentials.”                      | “That phone number or password doesn’t match our records.”                      |
| “Error 422: invoice allocation failure.”    | “This payment is more than the pending amount. Check the amount and try again.” |
| “Utilize the dashboard to monitor metrics.” | “See how your school is doing today.”                                           |

Use Indian English conventions: “fee,” “class,” “section,” “guardian,” “academic year,” “marks,” “report card.”

## 3. Design Tokens

Tokens live in `packages/ui/tokens.css` and are exported to Tailwind and mobile.

### 3.1 Color

| Token                   | Value     | Use                         |
| ----------------------- | --------- | --------------------------- |
| `--color-ink`           | `#0F172A` | Primary text                |
| `--color-muted`         | `#475569` | Secondary text              |
| `--color-subtle`        | `#64748B` | Tertiary text               |
| `--color-primary`       | `#1D4ED8` | Primary actions, links      |
| `--color-primary-hover` | `#1E40AF` | Hover                       |
| `--color-primary-soft`  | `#EFF6FF` | Selected backgrounds        |
| `--color-accent`        | `#0D9488` | Positive highlights, charts |
| `--color-success`       | `#15803D` | Success, paid, present      |
| `--color-warning`       | `#B45309` | Warning, pending            |
| `--color-danger`        | `#B91C1C` | Errors, absent, destructive |
| `--color-surface`       | `#FFFFFF` | Cards, modals               |
| `--color-canvas`        | `#F8FAFC` | Page background             |
| `--color-border`        | `#E2E8F0` | Dividers, inputs            |
| `--color-border-strong` | `#CBD5E1` | Focused/hover borders       |

Semantic colors are always paired with text or an icon. Never use color alone to convey status.

School branding may override the primary color, but contrast is validated and the safety palette (success/warning/danger) is fixed.

### 3.2 Typography

| Token       | Size / line height | Use                    |
| ----------- | ------------------ | ---------------------- |
| `text-xs`   | 12 / 16            | Captions, helper text  |
| `text-sm`   | 14 / 20            | Table text, labels     |
| `text-base` | 16 / 24            | Body                   |
| `text-lg`   | 18 / 28            | Section intros         |
| `text-xl`   | 20 / 28            | Card titles            |
| `text-2xl`  | 24 / 32            | Page titles            |
| `text-3xl`  | 30 / 36            | Dashboard KPIs         |
| `text-4xl`  | 36 / 40            | Marketing/empty states |

**Fonts:** Inter for Latin, Noto Sans Devanagari for Hindi, and a Noto Sans variant for the chosen regional language. Bundle fonts; do not rely on system fonts for PDFs.

Weights: 400 body, 500 labels, 600 headings, 700 rare emphasis. Avoid all-caps except tiny overline labels.

### 3.3 Spacing and layout

- 4px base scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.
- Page padding: 16px mobile, 24px tablet, 32px desktop.
- Card padding: 16–24px.
- Form field gap: 16px; section gap: 32px.
- Max content width: 1440px; reading width: 720px.
- Sidebar: 240px expanded, 64px collapsed.
- Top bar: 56px mobile, 64px desktop.
- Border radius: 8px controls, 12px cards, 16px modals, full for pills.
- Shadows: subtle only; borders carry most separation.

### 3.4 Iconography

- Lucide icons, 16/20/24px.
- Icons support labels; icon-only buttons require an accessible label and tooltip.
- Status icons: check (success), clock (pending), alert (warning), x (danger), info.
- Do not mix icon families.

## 4. Component Standards

Base: shadcn/ui + Radix primitives, styled with tokens.

| Component       | Rules                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| Button          | One primary per view; destructive is red and requires confirmation; loading disables and shows progress |
| Input           | Label above, helper text below, inline error; never placeholder-only labels                             |
| Select          | Searchable for long lists; native select on mobile where appropriate                                    |
| Checkbox/radio  | 44px touch target on mobile; group labels                                                               |
| Date picker     | Indian format display; keyboard entry allowed                                                           |
| Table           | Sticky header, sortable columns, row actions, empty state, pagination                                   |
| Badge           | Text + color; statuses use consistent labels                                                            |
| Modal           | Title, description, primary/secondary actions; focus trap; Esc closes                                   |
| Drawer          | Detail views on mobile; full-screen on small devices                                                    |
| Toast           | Non-blocking confirmation; errors also inline where possible                                            |
| Tabs            | Max 5; URL-backed for deep links                                                                        |
| Accordion       | For FAQs and advanced settings                                                                          |
| Progress        | Determinate for jobs; indeterminate only for short waits                                                |
| Empty state     | Explain why and the next action                                                                         |
| Skeleton        | Match final layout; no spinner for full pages                                                           |
| Command palette | Desktop power users; not required on mobile                                                             |

## 5. Layout Patterns

### 5.1 Admin web

```
┌──────────────┬────────────────────────────────────┐
│ Sidebar      │ Top bar: school, year, search, user │
│              ├────────────────────────────────────┤
│ Dashboard    │ Page title + actions                │
│ Students     │ Filters / summary cards             │
│ Fees         │ Content                             │
│ Attendance   │                                     │
│ Exams        │                                     │
│ Staff        │                                     │
│ Reports      │                                     │
│ Settings     │                                     │
└──────────────┴────────────────────────────────────┘
```

- Sidebar groups by workflow, not database tables.
- Current school and academic year are always visible.
- Global search finds students, staff, invoices, receipts.
- Page actions sit top-right; destructive actions in an overflow menu.
- Breadcrumbs for drill-downs.

### 5.2 Dashboards

- Top row: 3–4 KPI cards with value, label, trend, and comparison period.
- Second row: one primary chart and one action list (absentees, overdue fees, pending marks).
- Third row: shortcuts and recent activity.
- Every card links to the underlying report.
- Avoid more than six KPI cards above the fold.

### 5.3 Lists and tables

- Filters in a collapsible bar; show active filter chips.
- Result count and export action.
- Bulk selection appears only when rows are selected.
- Row click opens detail; action menu does not trigger row click.
- Mobile tables become cards with primary fields and a detail link.
- Empty states distinguish “no data yet” from “no results for this filter.”

### 5.4 Forms

- Single column by default; two columns only for short related fields.
- Group into sections with clear headings.
- Mark optional fields; assume required.
- Validate on blur and on submit; do not validate every keystroke.
- Show errors next to fields and summarize at the top for long forms.
- Preserve data on error and navigation warning.
- Sticky save bar for long forms.
- Destructive changes show a before/after summary.

## 6. Mobile Patterns

### 6.1 Parent app

- Bottom tabs: Home, Attendance, Fees, Results, More.
- Child switcher at the top of Home; persistent selection.
- Home prioritizes today’s attendance, dues, and latest announcement.
- Payment is two taps from Home: Fees → Pay.
- Receipts are easy to find under Fees → History.
- Use large cards, clear amounts, and minimal chrome.
- Offline shows cached data with a “last updated” label.
- Never hide critical information behind a gesture.

### 6.2 Teacher app

- Bottom tabs: Today, Classes, Marks, Me.
- Today shows the next class first, with a large “Mark attendance” action.
- Attendance screen defaults to all present; absentees are one tap.
- Sync status is always visible but unobtrusive.
- Large touch targets for use while standing.
- Works one-handed on a 5.5-inch screen.
- Avoid multi-step wizards for daily tasks.

### 6.3 Mobile rules

- Minimum touch target 44×44 dp.
- Primary action within thumb reach at the bottom.
- Support font scaling to 200%.
- Use native navigation gestures and back behavior.
- Show progress for network operations; allow cancel where safe.
- Confirmation for destructive or irreversible actions.
- No hover-only affordances.

## 7. Accessibility

Target: **WCAG 2.1 AA** for web, with equivalent mobile practices.

- Contrast: 4.5:1 for normal text, 3:1 for large text and UI boundaries.
- Visible focus ring on every interactive element.
- Full keyboard access; logical tab order; skip links.
- Semantic landmarks and headings.
- Labels tied to inputs; errors announced with `aria-live`.
- Images have alt text; decorative images are hidden.
- Icons have accessible names.
- Status is conveyed by text/icon, not color alone.
- Reduced motion respected.
- No time-limited actions without an extension.
- Tables have proper headers and captions.
- Modals trap focus and restore it on close.
- Video and audio have captions/transcripts.
- Test with TalkBack, VoiceOver later, and keyboard-only.

## 8. Localization

- English, Hindi, and one regional language at launch.
- All strings externalized; no concatenation.
- Allow 30–40% text expansion in layouts.
- Avoid text embedded in images.
- Use locale-aware dates, numbers, and currency.
- Support Devanagari and regional fonts in web, mobile, and PDFs.
- Provide a glossary for domain terms; do not machine-translate fee or exam terminology without review.
- Report-card templates support the school’s chosen language.
- Language switch is available before login and in settings.
- Store user language preference; default to school locale, then device.

## 9. Content Style

- Sentence case for headings, buttons, labels, and menu items.
- Active voice: “Send reminder,” not “Reminder can be sent.”
- Specific: “3 students are missing marks,” not “Validation error.”
- Actionable: say what to do next.
- Avoid “please” in every sentence; reserve it for genuine requests.
- Use “we” for the platform, “you” for the user.
- Numbers: Indian grouping (`1,00,000`), currency `₹1,00,000`, dates `DD/MM/YYYY`.
- Time: 12-hour with am/pm in UI; 24-hour in exports where space is tight.
- Use “guardian” rather than “parent” when both are possible.
- Never use “utilize,” “leverage,” “seamless,” or “robust” in user-facing copy.

## 10. Error and Empty States

### Error anatomy

1. What happened, in plain language.
2. Why, if known and safe to share.
3. What to do next.
4. A support reference (request ID) for unexpected errors.

Example:

> **Couldn’t save attendance**
> The server didn’t respond. Your marks are saved on this phone and will sync when you’re back online.
> [Retry now] [View pending]

### Empty states

| Context              | Message and action                                                |
| -------------------- | ----------------------------------------------------------------- |
| No students yet      | “Add your first student or import a list.” [Add student] [Import] |
| No fees due          | “No pending fees for this child.”                                 |
| No results published | “Results will appear here after the school publishes them.”       |
| No announcements     | “No announcements yet.”                                           |
| Filtered list empty  | “No students match these filters.” [Clear filters]                |

## 11. Data Visualization

- Use bar or line charts for trends; avoid pie charts for comparison.
- Label axes and units; show the time period.
- Use the semantic palette consistently.
- Provide a table alternative for accessibility.
- Do not truncate axes to exaggerate differences.
- Show “no data” rather than an empty chart.
- Round display values but keep exact values in exports.
- Currency charts state “in ₹” or “in lakh.”

## 12. Motion

- Motion explains change, not decorates it.
- 150–250ms for most transitions.
- Respect `prefers-reduced-motion`.
- Avoid parallax, autoplay, and bouncing.
- Loading skeletons are preferable to spinners for page loads.
- Progress indicators for background jobs.

## 13. Design Process

1. **Frame the problem:** persona, job, frequency, constraints.
2. **Map the flow:** entry, decision points, errors, exit.
3. **Sketch and prototype:** low fidelity first.
4. **Test with 3–5 users:** teachers for attendance, parents for payments, accountants for reconciliation.
5. **Build with tokens and components.**
6. **Review:** design, engineering, accessibility, localization.
7. **Ship and observe:** analytics, support tickets, usability feedback.
8. **Iterate:** small improvements each release.

**Artifacts**

- Figma file with flows, components, and responsive frames.
- Storybook for component states.
- Design tokens in code.
- Usability test notes and decisions.
- Screenshots for release notes and training.

## 14. Design Review Checklist

- [ ] Primary action obvious
- [ ] Screen understandable in five seconds
- [ ] Works at 360px and 1440px
- [ ] Loading, empty, error, and unauthorized states
- [ ] Keyboard and screen-reader access
- [ ] Contrast and touch targets pass
- [ ] Hindi/regional text fits
- [ ] Money, dates, and statuses formatted correctly
- [ ] Destructive actions confirmed
- [ ] Consistent with existing patterns
- [ ] No unnecessary fields or steps
- [ ] Performance impact considered

## 15. Related Documents

- [02-personas-and-user-journeys.md](02-personas-and-user-journeys.md)
- [10-mobile-application.md](10-mobile-application.md)
- [20-engineering-standards.md](20-engineering-standards.md)
- [modules/parent-app.md](modules/parent-app.md)
- [modules/teacher-app.md](modules/teacher-app.md)
