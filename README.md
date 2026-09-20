# WITS Mobile

A working iOS + Android prototype of a Williamsville Central School District
mobile app, built with **Expo SDK 57 / React Native 0.86 / TypeScript**. It
demonstrates the full student, parent, and teacher experience using **synthetic
data only**, and is architected so the district later swaps one repository
class to go live — no UI rewrite.

## Status: Prototype (v0.1.0)

> All names, grades, attendance records, messages, and events in this app are
> **synthetic demo data**. No real student information exists in this
> repository, and the app never collects WITS credentials. See
> [PRIVACY.md](docs/PRIVACY.md) and [SECURITY.md](SECURITY.md).

## Architecture

```
Screens (Expo Router)
      ↓  hooks only — screens never touch fixtures or fetch
TanStack Query hooks (src/queries)
      ↓
WitsRepository interface (src/data/repository.ts)
      ↓                          ↓
MockWitsRepository          HttpWitsRepository
(local synthetic fixtures)  (validated /v1 API — future)
      ↑ Zod validation at every boundary (src/domain/schemas.ts)
```

Key decisions:

- **Repository abstraction** — `EXPO_PUBLIC_DATA_SOURCE=http` switches to the
  district-backed implementation with zero screen changes.
- **Expo Router only** — file-based routing, role-guarded tab groups for
  student / parent / teacher.
- **Design tokens, no UI framework** — `src/design/tokens.ts` (colors,
  spacing, type scale) implement the district mockups directly.
- **Server state = TanStack Query, Redux-free**; role and child selection are
  session state that purge cached queries on change.

## Screens implemented

Student: Today, Academics, Course Detail, Assignments, Assignment Detail,
Calendar (Agenda/Month/Schedules), Event Detail, Messages + Thread, Attendance
+ Class Detail, Guidance + Topic Details, Resources, Search, Notification
Preferences ·
Parent: Today (with Needs Attention), My Students switcher, Academics,
Calendar, Messages, Report an Absence, Forms & Signatures · Teacher: Today,
Classes, Class Detail (attendance + grading writes, demo), Student Detail,
Students, Compose (multi-class), Messages · Auth: district-SSO-shaped login
(mock).

## What is intentionally NOT implemented

- Real SSO / OAuth (button is a mock; production = OIDC + PKCE via system
  browser)
- Push notifications (preferences are UI-only, persisted locally)
- Real WITS/eSchoolData/WITSMail connectivity (the `/v1` OpenAPI contract in
  `openapi/wits-mobile-v1.yaml` defines the future surface; a synthetic demo
  server implements it — see below)
- Real district writes: absence reports, form signing, attendance, and grading
  writes are **demo-only** and capability-gated (they hide automatically when
  production `/v1/capabilities` withholds them)

## Demo over HTTP (production code path)

The prototype can run its demo data over real HTTP so the production client
(fetch, timeout, correlation ID, Zod boundary, typed errors) is exercised
every day, not just in tests:

```bash
pnpm demo:server                                        # localhost:8790
EXPO_PUBLIC_DATA_SOURCE=http \
EXPO_PUBLIC_API_BASE_URL=http://localhost:8790 pnpm start
```

The server (`scripts/demo-server.mjs`) serves the same relational demo
database the in-app mock uses — one dataset, two transports.

## Demo scenarios (dev builds)

More → **Demo Scenario (dev)** switches between 11 deterministic datasets
(normal day, all caught up, heavy workload, missing work, attendance concern,
no upcoming events, empty inbox, long names, large roster, stale data,
partial outage) for screenshots, E2E, and degraded-state review.

## Run

```bash
pnpm install
pnpm start            # Expo Go on iOS or Android
pnpm typecheck        # tsc --noEmit
pnpm lint             # eslint
pnpm test             # jest (see CI for the current count)
pnpm dlx expo-doctor
```

Environment: copy `.env.example` → `.env`. `EXPO_PUBLIC_DATA_SOURCE=mock`
(default) runs fully offline; `http` requires `EXPO_PUBLIC_API_BASE_URL`.

## For district reviewers

- [docs/implementation-status.md](docs/implementation-status.md) — what is
  complete vs pending district approval
- [docs/demo-script.md](docs/demo-script.md) — five-minute leadership
  walkthrough + technical script for IT
- [docs/improvement-plan.md](docs/improvement-plan.md) — 300-point audit ledger
- [docs/wcsd-integration.md](docs/wcsd-integration.md) — what we need from
  WCSD, API contract, auth sequence, pilot plan
- [docs/PRIVACY.md](docs/PRIVACY.md) — privacy architecture
- [docs/accessibility-checklist.md](docs/accessibility-checklist.md) — a11y
  verification pass
- `docs/screenshots.html` — full-page screenshots of every screen (synthetic
  data; `fp-*` = full page, `st-*` = interaction states)
