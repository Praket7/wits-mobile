# Implementation Status

Last updated: September 21, 2026

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
  demo script, security policy- CI: typecheck, lint, unit tests, expo-doctor; contract check, screenshot regression diff, and an HTTP smoke test of the hardened client against a live demo server; Maestro E2E workflow (manual, binary-based)
- Dependency refresh: zod 4.6.5, actions/checkout v7, actions/setup-node v7, action-maestro-cloud v3 — all dependabot PRs resolved (2026-09-21)
- Security pass (2026-09-22): `pnpm audit` gate in CI + overrides for the two
  transitive expo-CLI advisories (uuid, decode-uri-component); AuthProvider
  seam (`src/auth/`: demo + OIDC stub) with post-sign-in authenticated
  capability bootstrap and fail-closed sign-out; extended error taxonomy
  (timeout / rate-limited / conflict / maintenance) with code-only friendly
  copy; per-request `X-Request-ID` + session `X-Client-Session-ID`;
  `Idempotency-Key` on writes; actor fields removed from messaging bodies and
  the OpenAPI `ForwardInput` (`replyToThread`/`sendAnnouncement`/
  `markThreadRead` now session-derived); `DemoControls` separated from the
  production `WitsRepository` contract

## ⬜ Pending district approval

- ⬜ WCSD SSO (OAuth/OIDC + PKCE) and client registration
- ⬜ eSchoolData sandbox access + BFF adapters
- ⬜ WITSMail API access
- ⬜ District calendar / event feeds
- ⬜ Google Classroom API approval (app stays useful without it)
- ⬜ Finalsite / school-news integration (degrades gracefully)
- ⬜ Privacy review (NYSED Ed Law 2-d / PPRA)
- ⬜ Pilot build under district-owned developer accounts and bundle ID
- ✅ Fail-closed capability system: HTTP builds start with all mutations
  disabled and adopt only what the authenticated `/v1/capabilities` declares;
  demo baseline applies in mock mode only
- ⬜ District backend to actually serve `/v1/capabilities` with its real policy

## Notes

- All data in the repo and screenshots is synthetic (Alex/Maya Williams
  personas). No real student or staff records exist anywhere in the project.
- Version is intentionally 0.1.0 — do not present as production-complete.
