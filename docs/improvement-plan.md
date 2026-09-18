# WITS Mobile — 300-Point Improvement Plan Ledger

Status date: 2026-09-18. This file is the durable record of the improvement plan
(the earlier attempt at it was lost with a failed session — items **15–278 are
not recovered**; re-paste that range to have it catalogued and scheduled).

Legend: ✅ done · 🟡 partially done / follow-up exists · ⬜ not started

## Items 1–14 (this round) — all implemented

| # | Item | Status | Where / notes |
|---|---|---|---|
| 1 | Role-based routing | ✅ | `app/index.tsx` redirects by role; guards added to **all three** tab layouts (student had none before); role switch does `router.replace` to the new role's home and purges all cached queries. Acceptance: relaunch lands on the right role's Today; a role can never sit inside another role's routes. |
| 2 | Maestro E2E rewritten | ✅ | `maestro/student-flow.yaml` (login → Today → Academics → AP Chemistry → assignment → Calendar → Messages → Attendance → More), `parent-flow.yaml` (role switch → Parent Today → My Students → switch child → Academics → Calendar → Messages), `teacher-flow.yaml` (role switch → Today's Classes → Classes → Class Detail → Students → Messages). All taps/asserts use verified on-screen labels — incl. the corrected `Sign in with District Account` CTA. Hardware execution + separate CI workflow still pending (needs simulator runners). |
| 3 | Login architecture & copy | ✅ | Primary CTA is now **"Sign in with District Account"** with supporting text "Continue with Williamsville Google SSO". The fake username/password link is **removed** — no path implies collecting WITS credentials. Added **Help signing in**, **Acceptable Use Policy**, and **Privacy** links (prototype URLs point at williamsvillek12.org). Mock sign-in kept under a visible "Prototype: sign-in is simulated." note. |
| 4 | Role-aware post-login identity | ✅ | `src/state/appState.tsx` exposes a full identity: `{ loggedIn, userId, role, selectedStudentId }`. Dev role switcher now rendered only when `__DEV__` — hidden from preview builds for WCSD. Production note in code: role must derive from SSO/API. |
| 5 | Replace `z.custom<T>()` | ✅ | Real schemas added in `src/domain/schemas.ts`: `teacherClassSchema` (with `studentCount: int ≥ 0`), `teacherRosterEntrySchema`, `bellPeriodSchema`, `reminderSchema`, `monthlyAttendanceSchema`. `httpRepository.ts` validates every endpoint with them; canonical types re-exported via `repository.ts` (single source of truth). Malformed server data now fails at the boundary. |
| 6 | Student Today hard-codes | ✅ | "2 Assignments Due / 2 School Events / 3 Unread Messages" replaced by counts derived from live assignment/calendar/message queries; "34 min" replaced by `blockMinutes()` computed from the block's own times (omitted when unparseable); "Praket" and header initials now come from `useMe()`. Editing fixtures updates the UI with no screen edits. |
| 7 | Upcoming-event time bug | ✅ | New `eventTimeLabel(start, end, allDay)` helper: `start` was formatted twice before; now renders "3:00 PM – 4:00 PM" only when an end exists, "3:00 PM" otherwise, "All Day" for all-day events (`allDay` added to `calendarEventSchema`). |
| 8 | Attendance navigation | ✅ | Recent Attendance rows navigate by the record's **own** `courseId` via `router.push({ pathname, params })` (was hard-wired to the chemistry route). Rows without a course are non-clickable and labelled "School-wide". |
| 9 | Attendance data model | ✅ | `attendanceRecordSchema` extended with `excused`, `reason`, `reportedBy`, `period`, `departureTime` (all defaulted so current data passes). History/class-detail subtitles surface arrival time: **"Tardy · Arrived 8:12 AM"**, plus "Excused · Illness" when present. Fixtures carry the new fields. |
| 10 | Header controls interactive | ✅ | Bell and avatar in `BrandBand.tsx` are real `Pressable`s (were ignored `onPress` props on `View`s): ≥44×44 targets, `accessibilityRole="button"`, explicit labels ("Notifications, N unread" / "Account, signed in as …"), pressed states. Bell → Notification Preferences; avatar → More — wired at every call site. |
| 11 | WCSD header consistency | ✅ | Pattern enforced: root tab screens use the full district lockup; every detail/nested screen uses the compact `AppHeader` back header. No screen repeats the full lockup on nested pages. |
| 12 | W-logo cleanup | ✅ | Canonical assets: `w-mark-white.png` (light surfaces) + `w-mark-trans.png` (dark band watermark). Hand-drawn `WMarkSvg` removed (was unreferenced). Unused `w-mark.png`, `lockup.png`, `north.png` deleted. W PNGs optimized 817 KB → 55 KB and 717 KB → 49 KB (256 px, 3× render size). `assets/branding/README.md` documents that these are prototype assets until WCSD supplies official artwork. |
| 13 | Parent My Students redesign | ✅ | `app/(parent)/students.tsx` rebuilt: district lockup, large "My Students" title, **"CURRENTLY VIEWING"** selected-child card with live snapshots (missing work, due soon, absences, tardies, next class today) and a View Academics shortcut, clear ✓ selected treatment in the switcher, and a deliberately disabled "Add Student" row reserved for the approved parent-linking API (not implemented, per plan). |
| 14 | Atomic child selection | ✅ | `setSelectedStudentId` now removes (not just invalidates) every child-scoped query (`today`, `courses`, `course`, `assignments`, `assignment`, `grades`, `attendance`, `calendar`, `guidance`) so the previous child's data never renders and never stays in memory. Sign-out also purges the whole cache. Screens read ids through `useSelectedStudentId()` so the default lives in one place. |

## Items 279–300 (recovered tail of the list) — catalogued, mostly future work

| # | Item | Status |
|---|---|---|
| 279 | Consistent request identifier for IT support (no sensitive payloads) | ⬜ future P2 |
| 280 | Operational health endpoints (`/health`, `/version`) | ⬜ future P2 |
| 281 | Backend uptime/error monitoring (district-approved tooling) | ⬜ future P1 |
| 282 | Separate public-content APIs from protected student APIs | ⬜ future P2 |
| 283 | Audit every external service dependency (owner, data, retention, privacy) | ⬜ future P1 |
| 284 | Keep Google Classroom optional | ✅ by design — "Open in Google Classroom" is the only Classroom touchpoint; core flows never require it |
| 285 | Don't make Finalsite required for core academics | ✅ by design — no Finalsite dependency exists |
| 286 | Handle source outage gracefully | 🟡 per-query `ErrorState` exists on screens; partial-data Today still pending backend |
| 287 | Partial-data states (schedule without messages, etc.) | 🟡 same as 286 — needs backend source-health signals |
| 288 | Source-health metadata in backend aggregation | ⬜ backend concern, future P2 |
| 289 | Never expose upstream errors directly; friendly messages | 🟡 screens use friendly `ErrorState` copy; repository error mapping pending |
| 290 | Internal demo mode never touching real APIs | ✅ — `EXPO_PUBLIC_DATA_SOURCE=mock` + `MockWitsRepository` is exactly this |
| 291 | Screenshot/demo accounts synthetic forever | ✅ — fixtures only; enforced by mock-data policy |
| 292 | Dedicated demo fixture identity (e.g. "Alex Williams") | 🟡 fixtures use synthetic names; a single named demo identity for screenshots not yet created |
| 293 | Replace personal name in public screenshot set | 🟡 current fixtures use a synthetic student name ("Praket Gauri") — fine for dev; swap to obviously-fictional identity before public/demo artifacts |
| 294 | Plausible fictional teacher names in demo | 🟡 synthetic today; audit before public use |
| 295 | Fixture disclaimer in screenshot gallery | ⬜ add caption to `docs/screenshots.html` |
| 296 | Final WCSD demo script (5-minute walkthrough) | ⬜ |
| 297 | Technical demo script for IT | ⬜ |
| 298 | "What we need from WCSD" document in repo | ⬜ (contents live in the original plan §18; needs its own doc) |
| 299 | Implementation status document | ✅ partially — this ledger + plan checkboxes serve that role |
| 300 | Final cleanup criterion (no dead buttons, no fake chevrons, no hard-coded counts, no role leakage, no stale E2E, no fake password flow, no invalid touch targets, no artificial calculations, no real PII, no secrets, no unsupported-capability UI) | 🟡 this round cleared the major offenders (1, 3, 6, 8, 10); a final sweep against every criterion should be the last step before the WCSD demo |

## Gap

Items **15–278** of the original 300-point list were not preserved when the
session that produced them failed. Nothing from that range has been
implemented or verified in this ledger. To complete the plan, re-paste that
range; it will be triaged (P0/P1/P2), merged with the acceptance criteria
above, and scheduled without redoing finished work.

## Verification for this round

- `tsc --noEmit` — clean
- `eslint app/ src/` — 0 problems
- `jest` — 52/52 passing
- Full-page screenshot gallery (`docs/screenshots.html`) and side-by-side
  mockup comparisons remain valid; re-capture only needed if visuals change.
