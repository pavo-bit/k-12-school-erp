# ADR-0005: Use Better Auth for Authentication

- **Status:** Accepted
- **Date:** 14 November 2026
- **Owner:** Founder 1
- **Related:** [../07-multi-tenancy-and-authorization.md](../07-multi-tenancy-and-authorization.md), [../09-api-contracts.md](../09-api-contracts.md)

---

## Context

The platform needs:

- Email/password staff login with invitations
- Web sessions with secure cookies
- Phone OTP for parents and teachers
- TOTP MFA for privileged roles
- Mobile access and refresh tokens
- Postgres-backed data and the ability to join auth identities to school memberships
- In-house control, low recurring cost, and no vendor lock-in

Auth0/Clerk and Firebase Auth provide these features but add recurring cost, external identity stores, and integration friction with tenant roles.

## Decision

Use **Better Auth** with the PostgreSQL adapter. Auth tables live in the same database. The application owns:

- Membership and role resolution
- Invitations
- OTP delivery and rate limits
- Mobile access/refresh token issuance
- Session revocation and device management
- MFA enforcement policy

Better Auth handles credential verification, session storage, and core auth flows. Sensitive auth events are logged and audited.

## Consequences

**Easier**

- No per-user auth vendor fee.
- Identity data stays in the same database, simplifying joins and deletion requests.
- One TypeScript codebase for auth configuration.
- Control over OTP, MFA, and session policy.
- Straightforward local development.

**Harder**

- The team owns auth security, upgrades, and incident response.
- Custom flows (OTP, refresh rotation) need careful implementation and tests.
- Better Auth’s API may change; upgrades need regression tests.
- No vendor-provided anomaly detection or bot defense beyond our own controls.

**New requirements**

- Argon2id hashing and breached-password checks.
- Rate limits and lockouts for login and OTP.
- Session fixation and CSRF protections.
- Refresh token rotation with reuse detection.
- MFA enrollment and recovery codes.
- Auth-specific test suite and security review.
- Monitoring for failed logins and anomalous sessions.

## Alternatives Considered

| Alternative              | Why not                                                             |
| ------------------------ | ------------------------------------------------------------------- |
| Auth0                    | Recurring cost, external user store, role mapping complexity        |
| Clerk                    | Strong DX but vendor lock-in and per-user pricing at scale          |
| Firebase Auth            | Weak fit for Postgres-backed school roles and phone OTP control     |
| NextAuth/Auth.js         | Less complete session/OTP/MFA surface; more custom work             |
| Custom auth from scratch | Highest security burden; unnecessary when a maintained library fits |

## References

- [07-multi-tenancy-and-authorization.md](../07-multi-tenancy-and-authorization.md)
- [09-api-contracts.md](../09-api-contracts.md)
- [11-security-and-compliance.md](../11-security-and-compliance.md)
