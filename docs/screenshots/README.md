# Screenshots

38 captures of every screen (24 full pages + 14 interaction states), generated
from the web build with headless Chrome at iPhone 15 Pro size (390×844 @2x).
RN-Web lays out to the viewport, so full-page shots resize the viewport to the
content height before capturing — every pixel of every screen, including all
content below the fold.

Browse `docs/screenshots.html` (self-contained gallery, opens in any browser).

**All content is synthetic demo data.** Names, grades, attendance, and
messages are fictional fixtures (`src/data/fixtures/`) — no real WCSD records.

## Naming

| Prefix | Meaning |
| --- | --- |
| `fp-` | Full page — the entire scrolled screen (viewport grown to content height) |
| `st-` | Interaction state — a modal, filter, segment, draft, or delivered message visible after a tap |

## Interaction-state coverage

The `st-` set exercises the real WITSMail pipeline end to end in one session:
a teacher sends a multi-class announcement (`st-12`), the student inbox shows
it as a real unread thread (`st-09`), the parent inbox gets its own copy for
the selected child (`st-11`), and the detail view exposes Reply (`st-13`) and
Forward with staff/class addressing and quoted provenance (`st-14`).

## Provenance

- Viewport/device: iPhone 15 Pro, 390×844 @2x
- Fixture version: `src/data/fixtures/data.ts` at capture time
- Demo clock: `src/utils/clock.ts` anchors relative dates to 2026-09-17
- Commit: see the git log entry that last touched `docs/screenshots/`

The gallery page `docs/screenshots.html` renders these in labeled sections
(Student / Parent / Teacher / interaction states).
