---
name: UI
description: Use when building or changing web UI, components, layouts, accessibility, localization, or design-system usage in apps/web or packages/ui.
---

# UI Skill

## Read first

- `documentation/20-engineering-standards.md` sections 10 and 18
- `documentation/21-ui-ux-guidelines.md`
- `documentation/05-tech-stack.md` sections 2 and 7

## Rules

1. Server Components by default; `"use client"` only for interactivity.
2. Use the design system in `packages/ui`; no one-off buttons or colors.
3. Every data view has loading, empty, error, and unauthorized states.
4. Forms use React Hook Form + Zod; server validation is authoritative.
5. Tables use server-side pagination, sorting, and filtering.
6. Destructive actions require confirmation and explain consequences.
7. Optimistic UI only for low-risk actions; financial actions wait for the server.
8. Use semantic HTML and accessible labels; test keyboard navigation and focus.
9. Keep client bundles small; lazy-load heavy charts and editors.
10. No `dangerouslySetInnerHTML` without sanitization.
11. Use `next/image` with explicit dimensions.
12. Support 360px to 1920px; admin optimized for 1280px+.
13. Localize all user-facing strings via next-intl; never hardcode English in components.
14. Follow the performance budgets in `documentation/20-engineering-standards.md` section 18.

## Checklist before merging UI changes

- [ ] Component or E2E test for the primary flow
- [ ] Accessibility labels and keyboard navigation
- [ ] Loading/empty/error/unauthorized states
- [ ] No bundle size regression
- [ ] Screenshots in the PR for visual changes
