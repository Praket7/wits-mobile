# Screenshots

Full-page captures of every screen, generated from the web build with
headless Chrome at iPhone 15 Pro size (390×844 @2x). Rebuild with the
side-by-side comparison at `wits-mobile/compare.html`.

**All content is synthetic demo data.** Names, grades, attendance, and
messages are fictional fixtures (`src/data/fixtures/`) — no real WCSD records.

## Naming

| Prefix | Meaning |
| --- | --- |
| `fp-` | Full page — the entire scrolled screen (viewport grown to content height) |
| `st-` | Interaction state — a modal, filter, segment, or draft visible after a tap |

## Provenance

- Viewport/device: iPhone 15 Pro, 390×844 @2x
- Fixture version: `src/data/fixtures/data.ts` at capture time
- Demo clock: `src/utils/clock.ts` anchors relative dates to 2026-09-17
- Commit: see the git log entry that last touched `docs/screenshots/`

The gallery page `docs/screenshots.html` renders these in labeled sections
(Student / Parent / Teacher / interaction states).
