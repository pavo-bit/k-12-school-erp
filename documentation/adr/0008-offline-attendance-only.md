# ADR-0008: Offline Attendance Only

- **Status:** Accepted
- **Date:** 14 November 2026
- **Owner:** Founder 2
- **Related:** [../modules/attendance-and-timetable.md](../modules/attendance-and-timetable.md), [../10-mobile-application.md](../10-mobile-application.md)

---

## Context

School connectivity is unreliable, especially in classrooms. Teachers need to mark attendance quickly without waiting for the network. At the same time, fees, marks, and payroll have strict integrity requirements: duplicate payments, conflicting marks, and payroll errors are costly and hard to reconcile.

## Decision

Support **offline writes for daily attendance only**, on the teacher app:

- SQLCipher-encrypted local SQLite database.
- Client-generated operation IDs for idempotency.
- Outbox with retry and conflict handling.
- Roster prefetch while online.
- Server validation of teacher assignment, date, cutoff, and enrollment.
- Conflict UI for admin edits and transferred students.

Fees, marks, payroll, admissions, and profile changes require connectivity and server validation.

## Consequences

**Easier**

- Teachers can work in poor connectivity.
- Attendance adoption improves.
- Financial and exam integrity remains server-authoritative.
- Smaller offline surface to test and secure.

**Harder**

- Offline sync and conflict handling are complex.
- Local data must be encrypted, purged, and protected on lost devices.
- Teachers need clear pending/synced/conflict states.
- Support must diagnose device-specific issues.
- The device clock cannot be trusted.

**New requirements**

- SQLCipher key management via SecureStore.
- Per-operation idempotency and server deduplication.
- Conflict resolution UI.
- Cutoff and holiday validation.
- Offline test matrix on physical devices.
- Data purge on logout and remote revocation.
- Clear user messaging and training.

## Alternatives Considered

| Alternative                | Why not                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| No offline support         | Attendance fails in classrooms with poor connectivity; adoption suffers                     |
| Full offline app           | Fees, marks, and payroll conflicts are too risky and expensive to reconcile                 |
| Offline attendance + marks | Marks require teacher assignment, moderation, and publish integrity; conflict risk too high |
| Paper fallback only        | Double entry and delayed parent alerts; does not solve the teacher experience               |

## References

- [modules/attendance-and-timetable.md](../modules/attendance-and-timetable.md)
- [10-mobile-application.md](../10-mobile-application.md)
- [12-testing-and-quality.md](../12-testing-and-quality.md)
