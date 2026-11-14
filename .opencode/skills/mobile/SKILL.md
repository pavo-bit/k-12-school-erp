---
name: Mobile
description: Use when building or changing Expo/React Native screens, offline attendance sync, push notifications, or mobile payments.
---

# Mobile Skill

## Read first

- `documentation/10-mobile-application.md`
- `documentation/20-engineering-standards.md` section 11

## Rules

1. All API calls go through the typed client; no ad-hoc `fetch` in screens.
2. Offline writes only for attendance, behind the sync module.
3. Store tokens only in SecureStore; never AsyncStorage.
4. Encrypt local data; delete it on logout.
5. Every screen handles loading, empty, error, and offline states.
6. Prefer lists with stable keys and virtualization.
7. Do not block the UI thread with large computations.
8. Use NetInfo for connectivity, but treat the server as authoritative.
9. Request notification permission contextually.
10. Test on a low-end Android device, not only an emulator.
11. No PII in analytics or crash reports.
12. Deep links validate inputs and require auth where needed.
13. SQLCipher development builds are required; Expo Go is not sufficient.

## Checklist before merging mobile changes

- [ ] Tested on low-end Android device
- [ ] Offline sync and conflict handling verified
- [ ] Token storage uses SecureStore
- [ ] Local data purged on logout
- [ ] Push deep links validated