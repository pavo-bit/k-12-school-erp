---
name: Security
description: Use when changing authentication, authorization, RLS, secrets, file uploads, webhooks, or DPDP/compliance behavior.
---

# Security Skill

## Read first

- `documentation/11-security-and-compliance.md`
- `documentation/07-multi-tenancy-and-authorization.md`
- `documentation/20-engineering-standards.md` section 13

## Rules

1. Validate and authorize every request server-side.
2. Never trust `school_id` from the client.
3. RLS is the final backstop; missing context fails closed.
4. Secrets live in Secret Manager; never commit them.
5. Rotate any accidentally exposed secret immediately.
6. OTPs and tokens are stored hashed; recovery codes are shown once.
7. Admin roles require TOTP; sessions can be listed and revoked.
8. Impersonation is time-bound, audited, and blocks sensitive actions.
9. Webhooks verify signatures in constant time over the raw body.
10. Escape CSV formula characters; limit file types and sizes.
11. Use signed URLs with short expiry for private files.
12. Keep dependencies patched; review advisories.
13. No PII in logs, analytics, or crash reports.
14. Follow DPDP consent, retention, and deletion workflows.

## Checklist before merging security changes

- [ ] Cross-tenant access tests pass
- [ ] No secrets in code or logs
- [ ] Auth and permission checks at service layer
- [ ] Audit events recorded for sensitive actions
- [ ] Security review for new integrations
