# Contributing

## Setup

```bash
corepack enable && corepack prepare pnpm@11.26.0 --activate
pnpm install
pnpm start
```

## Before every PR

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm dlx expo-doctor
```

CI runs the same gates on every push/PR — keep `main` green (item 55).

## Project constraints (non-negotiable)

- **Synthetic data only.** Never commit real student records, names, grades,
  attendance, messages, or credentials (see SECURITY.md).
- **Never scrape WITS.** District integration happens through the approved
  backend contract in docs/wcsd-integration.md.
- **Preserve the repository abstraction.** Screens use TanStack Query hooks;
  fixtures are imported only by `MockWitsRepository`. Never fetch or touch
  query caches from screen code (item 91).
- **Follow the design tokens** in `src/design/tokens.ts`; no per-screen
  one-off colors, spacing, or type sizes.
- **No new heavyweight dependencies** (no UI frameworks, no analytics/ads
  SDKs — item 261). Expo-native packages update via `pnpm expo install --fix`.
- **Accessibility**: run through docs/accessibility-checklist.md.
- Run the full test suite; add tests for any new school-logic utility
  (schedule, A/B day, formatting) — keep that logic in `src/utils`, not UI.

## Branches & screenshots

Feature branches off `main`; squash-merge. If a PR changes what a screen
looks like, regenerate the screenshot gallery (`docs/screenshots.html`) so the
comparison pages stay honest.
