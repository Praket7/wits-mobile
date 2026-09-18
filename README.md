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
Calendar (Agenda/Month/Schedules), Messages + Thread, Attendance + Class
Detail, Guidance, Resources, Search, Notification Preferences ·
Parent: Today (with Needs Attention), My Students switcher, Academics,
Calendar, Messages · Teacher: Today, Classes, Class Detail, Students,
Compose, Messages · Auth: district-SSO-shaped login (mock).

## What is intentionally NOT implemented

- Real SSO / OAuth (button is a mock; production = OIDC + PKCE via system
  browser)
- Push notifications (preferences are UI-only, persisted locally)
- Google Classroom turn-in / any write to district systems
- Teacher gradebook writes; attendance reporting writes
- Real WITS/eSchoolData/WITSMail connectivity (placeholder `/v1` contract)

## Run

```bash
pnpm install
pnpm start            # Expo Go on iOS or Android
pnpm typecheck        # tsc --noEmit
pnpm lint             # eslint
pnpm test             # jest (63 tests)
pnpm dlx expo-doctor
```

Environment: copy `.env.example` → `.env`. `EXPO_PUBLIC_DATA_SOURCE=mock`
(default) runs fully offline; `http` requires `EXPO_PUBLIC_API_BASE_URL`.

## For district reviewers

- [docs/improvement-plan.md](docs/improvement-plan.md) — 300-point audit ledger
- [docs/wcsd-integration.md](docs/wcsd-integration.md) — what we need from
  WCSD, API contract, auth sequence, pilot plan
- [docs/PRIVACY.md](docs/PRIVACY.md) — privacy architecture
- `docs/screenshots.html` — full-page screenshots of every screen (synthetic
  data; `fp-*` = full page, `st-*` = interaction states)
