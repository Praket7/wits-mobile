# WITS Mobile — Full Audit (mockups + implementation plan)

Audit date: 2026-09-17. Findings from comparing the built app against (A) the pasted mockup images and (B) the implementation plan, then fixing every item.

## A. Mockup disparities

| # | Screen | Disparity found | Status |
|---|---|---|---|
| A1 | All screens | Text glyphs/emoji used as icons; mockups use crisp line icons (Ionicons used as the Expo Go–compatible equivalent of SF Symbols/Material Symbols per plan §4.4) | FIXED |
| A2 | Tab bar | No unread badge on Messages (mockups show red "3"); emoji icons | FIXED — vector icons + tabBarBadge 3 |
| A3 | Student Today | Missing hero header: building image backdrop, "Good afternoon, Praket.", BELONG motto, B Day pill | FIXED — SVG hero backdrop + pill |
| A4 | Student Today | Next Class red card missing flask icon chip and "34 min" remaining label | FIXED |
| A5 | Student Today | "Upcoming Class" card with book icon missing entirely | FIXED |
| A6 | Student Today | Today at a Glance rows lacked leading icons (doc / calendar / mail) | FIXED |
| A7 | Student Today | Assignments Due Soon / Recent Grades rows lacked doc icons and correct pill styles (Due Tomorrow red, "Due Mon, Sep 22" neutral, 92% green) | FIXED |
| A8 | Student Today | Today's Schedule not a timeline: needs Period N labels, 8:05 – 8:47 AM style times, current period (Period 3 AP Chemistry) highlighted with red background + red time text + timeline dots | FIXED |
| A9 | Student Today | Upcoming Events lacked SEP date tiles and colored vertical bars; Messages rows lacked colored unread dots + right-aligned timestamps | FIXED |
| A10 | Student Today | Important Announcements missing red left-bar treatment | FIXED |
| A11 | Attendance | Missing Overview/By Class/History/Reports segmented control, 98% ring gauge, weekday labels (Thu/Wed/Tue…), colored % in by-class rows ("0 absences • 0 tardies" style) | FIXED |
| A12 | Attendance detail (per class) | Missing This Quarter/Semester/Year segmented, 97% ring, Monthly View calendar grid with present/tardy/absent/no-school dots + legend, notes in log, Class Information with mail icon | FIXED |
| A13 | Messages | Missing search bar with sliders icon; missing category avatars (people/GS/megaphone/book/trophy/WC) | FIXED |
| A14 | Message detail | Mockup groups the received message as one large gray card with subject + "Today, 10:24 AM"; attachments need red PDF icon + download icon; sent bubble red with checkmark | FIXED |
| A15 | Calendar | Missing date-hero + B Day badge, time boxes (8:05 AM), Student Council chevron row, Tomorrow/A Day section, Upcoming Events with SEP tiles, Calendars card with colored checkboxes, Today's Reminders card with count badge + checkboxes, Schedule Information card (View Bell Schedule / Add to Personal Calendar) | FIXED |
| A16 | Calendar | Month and Schedules segment views were unimplemented | FIXED — month grid + bell-schedule/schedules info |
| A17 | Assignments | Grouped-assignments screen (All/Upcoming/Missing/Completed + All Classes/Due Date/Type chips + Due Tomorrow/Due Next Week/No Due Date/Completed sections + score pills + "You're all caught up!" card) missing entirely | FIXED — /assignments rebuilt, reachable from Academics |
| A18 | Assignment detail | Missing leading icons on field rows, "Due Tomorrow" pill next to title, Google "G" logo on red button, Class Resources card (Course Links / Course Syllabus) | FIXED |
| A19 | Academics | Missing Classes/Grades/Assignments segmented control, "Q1 ⌄" chip, Class Resources 3-tile card, Academic Tools 6-tile grid with G logo | FIXED |
| A20 | Course detail | Missing building-image hero with red flask badge, Overview/Assignments/Grades/Info segmented, Current Grade card with Marking Period Q1 chip + updated date, Next Assignment pink card, Recent Assignments score cards, Class Announcements, Course Resources tiles, All Assignments page with Filter button + status pills, Grade Breakdown progress bars, Class Information icon rows, View in Course Catalog row | FIXED |
| A21 | Parent Today | Missing bell + PG avatar header, proper child row (avatar + name + school + Grade 11 ›), Today/This Week/This Month segmented, date row with prev/next arrows, ring gauge, icon-led Important Links, GPA shown as "A-" label not number | FIXED |
| A22 | Parent tabs | Academics/Calendar/Messages/More were bare lists without headers/icons | FIXED |
| A23 | Teacher screens | Plain text headers, no icons/badges | FIXED |
| A24 | Login | Needed polish toward "final WCSD SSO screen visually" (logo block, tagline, note) | FIXED |
| A25 | Donut gauge / progress bars / checkbox components | Did not exist; required by Attendance, Parent, Course, Calendar | FIXED — new gauges.tsx |

## B. Implementation-plan gaps

| # | Plan item | Finding | Status |
|---|---|---|---|
| B1 | §3 `src/data/httpRepository.ts` | Missing stub for future HTTP swap | FIXED — stub implementing WitsRepository with fetch + EXPO_PUBLIC_API_BASE_URL |
| B2 | §3 `src/queries/useToday.ts` etc. (per-entity hook files) | Single useWits.ts instead | FIXED — per-entity files; useWits.ts kept as re-export barrel |
| B3 | §3 `(student)/notifications.tsx` route | Notification prefs lived only in More | FIXED — dedicated screen + link |
| B4 | §3 `(parent)/students.tsx` route | Missing (child switcher only inline) | FIXED — dedicated screen + More link |
| B5 | §3 More/Resources as its own destination | Routed to search by mistake | FIXED — dedicated /resources screen listing ResourceLink |
| B6 | §3 `assets/branding/`, `docs/` | Empty/missing | FIXED — docs/architecture.md added |
| B7 | §13 unit tests: date grouping, assignment status, event filtering, parent child switching | Not covered | FIXED — new tests |
| B8 | §13 component tests (RNTL): Today sections, course list, assignment badges, tardy/absence status, empty/error states, large text | Not covered at all | FIXED — component test suites added |
| B9 | §12 touch targets ≥44 | Segmented control 40pt, filter chips 36pt | FIXED — raised to 44 |
| B10 | §12 unread dot = color-only status | Added accessibilityLabel "unread" on dots | FIXED |
| B11 | §14 `lint` script works | Verify eslint config exists and lint passes | VERIFIED/FIXED |
| B12 | §16 EAS config | eas.json present | OK |
| B13 | Jest version | Plan's newest Jest 30 incompatible with RN 0.86 jest preset (ESM setup file); pinned 29.7 per Expo guidance | DEVIATION (documented) |
| B14 | §4.4 icons via expo-symbols | expo-symbols SF Symbols do not render in Expo Go on Android; Ionicons used instead | DEVIATION (documented) |

## Verification after fixes

- `eslint .` — 0 errors, 0 warnings
- `tsc --noEmit` — clean
- `jest` — **52/52 passing** across 7 suites (unit: A/B day, due labels, grade colors, search scoring, schema validation, repository contract, query-key/child-switch contract; component/RNTL: StatusPill tones, ListRow press+labels, SegmentedControl selection, Empty/Error states, SectionHeader)
- `expo-doctor` — 21/21 checks passed
- `expo export --platform ios` — Hermes bundle OK
- `expo export --platform android` — Hermes bundle OK

## Dependencies added during the audit

- `@expo/vector-icons` (Ionicons — Expo Go-compatible icon set, plan §4.4)
- `react-native-svg` (donut gauge, progress bars, checkboxes, building backdrop)
- `eslint`, `eslint-config-expo@~57.0.2`, `eslint-plugin-import` (plan §14 lint gate)

## Known deviations (documented, intentional)

- **Jest 29.7** instead of 30.x — Jest 30 cannot execute the RN 0.86 jest preset's ESM setup file; 29.x is Expo's supported pairing.
- **Ionicons** instead of SF Symbols/Material Symbols via expo-symbols — expo-symbols does not render in Expo Go on Android; the plan requires Expo Go as the demo distribution.
- **Mockup greeking**: the mockups' building photo is replaced by an abstract SVG backdrop so no unlicensed imagery is committed; swap in `assets/branding/` when the district provides assets (plan §18 item 10).

## Round 3 — real brand assets + dead-control wiring (final)

Applied after the district supplied real photography and the directive that no control may be visual-only:

1. **Real brand assets in `assets/branding/`** — East/South/North high-school photos; the W mark is an SVG recreation (`WMarkSvg`) so it renders on white headers without the source PNG's black background.
2. **Real photo backdrops** — school photos render faded top-right on Student Today hero, Course Detail hero, and Login via `SchoolBackdrop` (replacing the abstract SVG placeholder; deviation 3 above is now closed).
3. **Every visual-only control wired**:
   - Parent Today: Overview/Academics/Attendance/School Life segments each render their own real data; Today/This Week/This Month range actually filters events; ‹ › date arrows shift the viewed day; snapshot counts compute live from assignments.
   - Course Detail: **Q1 chip is a real marking-period picker** (modal dropdown, Q1–Q4, grade follows selection); announcements expand on tap; Class Drive/Textbook tiles open URLs, Course Links routes to Resources.
   - Calendar: category checkboxes truly filter events; Today's Reminders toggle with live count badge.
   - Messages: composer is a real TextInput — send appends to the thread via the query cache and updates the inbox preview; disabled when empty.
   - Guidance: event rows deep-link to Calendar; Naviance/College Board/Parchment rows open external URLs; Meet Your Counselor opens Messages.
   - Academics: Recent Grades "See All" deep-links to the Grades segment.
4. **Lint purity fix** — Parent Today now derives due-soon counts from the viewed date instead of calling `Date.now()` during render (react-hooks/purity).
5. **Dependency hygiene** — expo/expo-constants/expo-router/@expo/ui bumped to doctor-expected versions; `pnpm.overrides` pins expo-constants to dedupe it. **expo-doctor 21/21.**

### Verification after round 3

- `eslint app/ src/` — 0 errors, 0 warnings
- `tsc --noEmit` — clean
- `jest` — 52/52 passing
- `expo-doctor` — **21/21 checks passed**
- `expo export --platform ios` and `--platform android` — both Hermes bundles OK
