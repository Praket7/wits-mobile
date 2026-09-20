# Implementation Status

Last updated: September 20, 2026

## ✅ Prototype complete

- Student / Parent / Teacher flows, all three role homes, role-based routing
  with cache purging and route-leak prevention
- Relational demo database (two children with genuinely different datasets),
  per-instance state, `resetDemo()`
- Demo scenarios (§6.3) with dev switcher: normal day, all caught up, heavy
  workload, missing work, attendance concern, no events, empty inbox, long
  names, large roster, stale data, partial outage
- Teacher writes demo: multi-class announcements, class attendance, grading
  complete, message reply/forward — capability-gated
- Parent writes demo: absence reports, form signing — capability-gated
- WITSMail semantics: inbox/unread/sent filters, fan-out announcements,
  reply/forward, per-viewer read state
- Event detail screen with provenance; guidance topic details
- Attendance month navigation + scoped monthly grids
- Notification preferences: 10 categories, master toggle, digest, quiet hours,
  lock-screen privacy (v1→v2 migrated storage)
- OpenAPI contract (`openapi/wits-mobile-v1.yaml`) + synthetic demo HTTP
  server (`pnpm demo:server`) exercising the production client path
- Hardened HTTP client: timeout, correlation ID, bearer seam, typed errors,
  transient-only retry
- Capability system driving feature visibility (demo vs production)
- Docs: architecture, WCSD integration, privacy, accessibility checklist,
  demo script, security policy
- CI: typecheck, lint, unit tests, expo-doctor; Maestro E2E workflow (manual,
  binary-based)

## ⬜ Pending district approval

- ⬜ WCSD SSO (OAuth/OIDC + PKCE) and client registration
- ⬜ eSchoolData sandbox access + BFF adapters
- ⬜ WITSMail API access
- ⬜ District calendar / event feeds
- ⬜ Google Classroom API approval (app stays useful without it)
- ⬜ Finalsite / school-news integration (degrades gracefully)
- ⬜ Privacy review (NYSED Ed Law 2-d / PPRA)
- ⬜ Pilot build under district-owned developer accounts and bundle ID
- ⬜ Production capabilities endpoint (`/v1/capabilities`) to replace demo set

## Notes

- All data in the repo and screenshots is synthetic (Alex/Maya Williams
  personas). No real student or staff records exist anywhere in the project.
- Version is intentionally 0.1.0 — do not present as production-complete.
