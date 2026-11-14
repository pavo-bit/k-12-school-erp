# ADR-0007: One Expo Codebase, Two App Variants

- **Status:** Accepted
- **Date:** 14 November 2026
- **Owner:** Founder 1 / Mobile engineer
- **Related:** [../10-mobile-application.md](../10-mobile-application.md), [../modules/parent-app.md](../modules/parent-app.md), [../modules/teacher-app.md](../modules/teacher-app.md)

---

## Context

Parents and teachers need mobile apps. The team has one mobile engineer and wants to share authentication, API clients, design tokens, localization, offline infrastructure, and release tooling. Separate native Kotlin and Swift apps would double the codebase and require skills the team does not have. A single app with role-based navigation would blur privacy boundaries and produce confusing store listings.

Android is the launch platform; iOS follows post-GA.

## Decision

Use **one Expo/React Native TypeScript codebase** to build **two Android applications**:

- Parent app: `com.schoolerp.parent`
- Teacher app: `com.schoolerp.teacher`

Variants are selected at build time via `APP_VARIANT`, with distinct names, icons, package IDs, schemes, and navigation. Shared packages provide API client, auth, design system, localization, offline database, and sync. Variant-specific code is isolated under `features/parent` and `features/teacher`.

Builds use Expo prebuild + local Gradle in GitHub Actions. EAS Build is optional, not required.

## Consequences

**Easier**

- One team, one codebase, shared fixes.
- Consistent auth, API, and design across apps.
- Faster feature delivery for both audiences.
- Shared offline and notification infrastructure.
- Easier testing and dependency upgrades.

**Harder**

- Variant leakage must be prevented by build-time boundaries and tests.
- Shared code changes can affect both apps.
- Native modules (SQLCipher, Razorpay, FCM) require a development build and prebuild discipline.
- App store metadata and privacy forms must be maintained twice.
- iOS still requires macOS build infrastructure later.

**New requirements**

- Separate app IDs, icons, splash screens, and store listings.
- Build-time feature flags and variant tests.
- No parent-only data in teacher bundles, and vice versa.
- Shared contract versioning with the API.
- Device matrix testing for both variants.
- Store review process for each app.

## Alternatives Considered

| Alternative                        | Why not                                                                                  |
| ---------------------------------- | ---------------------------------------------------------------------------------------- |
| Separate native Android apps       | Two codebases, double maintenance, skills gap                                            |
| One app with role-based navigation | Confusing store listing, privacy concerns, larger install, parent/teacher feature mixing |
| Flutter                            | Viable, but the team’s TypeScript/React skills favor Expo                                |
| Web-only PWA                       | Poor offline, push, and payment experience on Android                                    |
| React Native CLI without Expo      | More native setup and maintenance for the same outcome                                   |

## References

- [10-mobile-application.md](../10-mobile-application.md)
- [modules/parent-app.md](../modules/parent-app.md)
- [modules/teacher-app.md](../modules/teacher-app.md)
