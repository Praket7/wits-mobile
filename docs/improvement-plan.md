# WITS Mobile — 300-Point Improvement Plan Ledger

Status date: 2026-09-18 (second pass). Items 1–14 were completed in the first
round; the second round (this one) implemented the remaining client-side
items. Items marked **future** are explicitly deferred until the WCSD backend
exists — they cannot be built client-side today, and building them early would
violate the plan's own "do not imply unsupported capabilities" rule.

Legend: ✅ done · 🟡 partially done / follow-up exists · ⬜ not started · 🔮 future (backend-dependent)

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

## Items 15–278 (second round)

Implemented in this round (highlights; the full list drove the changes):

| # | Item | Status | Where / notes |
|---|---|---|---|
| 15 | Parent Today Needs Attention | ✅ | New top card aggregating missing work, attendance issues, new grades, forms; empty state says "All caught up". |
| 16 | Teacher Today upgrade | ✅ | Date + A/B day, phase label (passing period/in class/finished), class timeline with rooms+counts, planning periods, action items, quick actions (Message a Class → teacher compose, Rosters, My Classes, Post Announcement), unread messages card. |
| 17 | Teacher Classes | ✅ | Period, room, enrollment, next meeting, pending-grading pill per row. |
| 18 | Teacher Students | ✅ | Search, class filter chips, grade pill, absences + missing-work counts, "Needs support" text (not color-only). Production access control remains backend (item 47 🔮). |
| 19/20 | Guidance destination | ✅ | Counselor card (mock, labeled), college visits with provenance detail (source, registration, grades), College Planning/Testing/Graduation/Service/Scholarships sections. |
| 21/22 | Notification prefs | ✅ | Full categories incl. always-on Emergency Alerts (locked switch), master toggle, digest/quiet-hours/lock-screen rows behind a feature flag; More now links only (duplicate controls removed). |
| 23 | More grouping | 🟡 | School Life rows, prefs link, dev-only role section; full grouped taxonomy (Transportation/Lunch/Activities) waits on data sources (items 199/200 🔮). |
| 24–26 | Search | ✅ | Assignments + guidance + alias keywords indexed; Pressable chips with `accessibilityState`, clear button, keyboard return; zero-query state; rows without routes show no chevron. |
| 27/100 | Event detail + reminders | ✅ | Event tap shows full detail incl. `Source · sourceLabel` and audience; Remind me / 1 hour / 1 day actions persist reminder state on the row. |
| 28 | Calendar filter persistence | ✅ | Checkbox state persists via AsyncStorage; Select All / Clear added. |
| 29/75/79 | A/B day + schedule model | ✅ | `src/utils/abDay.ts` (no-school aware rotation, `SchoolDayInfo`), `src/utils/schedule.ts` (phase classification). Split-course `meetingDays` and real bell-schedule variants are schema-ready (item 76 🟡). |
| 30 | Assignment statuses | ✅ | Graded/Submitted/Missing/Not Turned In pills + `Source · Google Classroom / District` on detail; no fake Turn In. Personal Mark-as-Done not added (correct per plan). |
| 31 | Safe external links | ✅ | `openExternalUrl()` — https-only, graceful failure — used by Guidance and Assignment Detail. |
| 32/96 | WITSMail semantics | ✅ | Sent view added (threads whose last message is mine); inbox/subject/sender semantics preserved; no chat framing. |
| 33 | Teacher message routing | ✅ | "Message a Class" now opens `(teacher)/compose` — no cross-role route leakage. |
| 35/25 | Accessibility | 🟡 | Search chips, date arrows, message composer, child switcher all Pressable ≥44pt with labels/states; checklist doc added; 200% font + screen-reader device passes remain manual. |
| 38/39 | Loading/error states | ✅ | ErrorState gained Try Again (wired on Today/Attendance/Parent Today); skeletons deferred (item 38 🟡 for animated versions). |
| 43/119 | HTTP plumbing | 🔮 | Bearer auth, timeout, correlation IDs land with the district backend; `codeFromStatus()` already maps statuses. |
| 46/47/266 | Backend authorization | 🔮 | Object-level authZ is backend work by design; called out in SECURITY.md. |
| 52/53 | Navigation + schedule tests | ✅ | 11 new unit tests: schedule phases (before school, in class, passing period, finished), block minutes, A/B day incl. holiday skip. |
| 55 | CI visibility | ✅ | CI verified green on main; gates enforced; manual Maestro workflow added. (A real CI-only failure was caught and fixed: the A/B day rotation in `src/utils/abDay.ts` mixed UTC midnights with local day reads, so tests passed locally but failed under TZ=UTC on runners — commit `b9fa766` made the arithmetic timezone-stable and added a regression test. Also removed the holiday-blind `aOrBDay` duplicate.) |
| 56/57 | Screenshot regression | 🟡 | Gallery + `docs/screenshots/README.md` naming/provenance doc; automated visual diff not yet scheduled. |
| 58/59/292–294 | Synthetic identities | 🟡 | Fixtures are synthetic; dedicated demo identity + dev-only "Demo Data" indicator pending before public screenshots. |
| 62/12 | Asset optimization | ✅ | W marks 817KB→55KB / 717KB→49KB; unused assets removed; school photos are already ≤1.5MP. |
| 63 | Icon standardization | ✅ | Parent date nav uses icon chevrons, not text ‹ ›; Ionicons used consistently. |
| 64 | Unused deps | ✅ | `@expo/ui`, `expo-symbols`, `expo-glass-effect` removed. |
| 65–67 | README/SECURITY/PRIVACY | ✅ | All three written for district review. |
| 68/123 | Config validation | ✅ | `src/config/env.ts` — http mode requires https base URL; dev builds refuse production API; runs at startup. |
| 71 | Error boundary | ✅ | Global boundary in root layout: "Something went wrong" / Try Again / Return to Today; logs non-sensitive info only. |
| 72/73 | Format centralization | ✅ | `formatDateLong/Medium/ShortWeekday/Clock/DateTime/Formal` added to format.ts; grade colors already centralized. |
| 77/78 | Schedule service | ✅ | `classifySchedule` returns before-school / passing-period / in-class / day-finished; Teacher Today uses it. Student Today's next-class copy upgraded next. |
| 85/86/87 | Assignment grouping/filters | ✅ | Working class filter (real dropdown, session-persistent) over grouped views. |
| 88 | Pull-to-refresh | ✅ | Screen component supports RefreshControl; wired on Student Today + Attendance. |
| 90–92 | Mutations/unread | ✅ | `sendMessage`/`markThreadRead` in repository layer; thread open marks read; `useUnreadCount` feeds tab badges + glance rows from one source. |
| 93 | Tab badges | ✅ | Hard-coded `tabBarBadge: 3` removed everywhere; live unread count, hidden at zero. |
| 98 | Attachments | ✅ | Tapping shows a clear "not available in prototype" dialog — no dead rows. |
| 101 | Event dedup | ✅ | `dedupeEvents` on title+start+location applied to the agenda. |
| 104/105 | Semantic colors | ✅ | `semantic` roles incl. reserved `emergency` in `src/config/features.ts`. |
| 118 | Error model | ✅ | `AppErrorCode` taxonomy + friendly copy + HTTP status mapping. |
| 121/122 | Flags/env profiles | 🟡 | `features` flags (SSO, push, digest, transportation…) + environment names defined; full profile plumbing lands with the backend. |
| 130/131 | Dependency scanning | ✅ | Dependabot (npm weekly grouped for expo-native, actions monthly). |
| 136/137 | Guides | ✅ | CONTRIBUTING.md + AGENTS.md with PII/scraping/abstraction rules. |
| 139 | .env safeguards | ✅ | `.env` and `.env.production` gitignored; only `.env.example` committed. |
| 141/142 | Licensing/assets | 🟡 | Prototype assets documented as such; formal license review deferred to WCSD adoption. |
| 145/146 | Platform decisions | 🟡 | Tablet/web explicitly undecided → documented as phone-first, web dev-only, in README (formal config flags when EAS profiles land). |
| 223/222 | Hydration state | ✅ | SessionProvider shows a branded loading screen instead of null during startup. |
| 227 | Not-found route | ✅ | `app/not-found.tsx` with role-aware "Return to Today". |
| 256 | Version 0.1.0 | ✅ | package.json + app.json no longer claim 1.0.0. |
| 295 | Fixture disclaimer | ✅ | In screenshot README + gallery header note. |
| 296–298 | Demo scripts + needs doc | ✅ | `docs/wcsd-integration.md` — five-minute demo script, IT security walkthrough, and the "what we need from WCSD" list. |
| 299 | Status document | ✅ | This ledger + README status section. |
| 300 | Final cleanup criterion | 🟡 | Cleared: dead buttons, fake chevrons, hard-coded counts, role leakage, stale E2E, fake password flow, invalid touch targets, visible artificial calc (rate derived), real PII (none), secrets (none). Remaining: final on-device pass (item 70) before the WCSD demo. |

Deferred-by-design (backend-dependent, items 40, 44, 45, 49–51, 54, 82–84, 89, 94–97b, 102, 103, 106–113b, 115–117, 124–129, 132–133, 140, 148, 149–163, 166, 169–177, 179–180, 183–189, 190–208, 209–215, 216–220, 232–234, 239–245, 250–263, 264–270, 271–283, 286–289): these require the WCSD Mobile API, district security review, or store presence to exist first. The app's capability flags and error model are the hooks they will plug into.

## Verification for this round

- `tsc --noEmit` — clean
- `eslint app/ src/` — 0 problems
- `jest` — 52/52 passing
- Full-page screenshot gallery (`docs/screenshots.html`) and side-by-side
  mockup comparisons remain valid; re-capture only needed if visuals change.
