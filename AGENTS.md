# Agent Guidelines

Rules for AI coding agents (and humans) working in this repo:

- **Synthetic data only.** Never introduce real student records, names,
  grades, attendance, messages, or any credentials into fixtures, code, or
  screenshots.
- **Never scrape WITS** or any district system. All integration is via the
  documented backend contract (`docs/wcsd-integration.md`).
- **No real credentials anywhere** — no WITS usernames/passwords, no API
  keys, no tokens. `.env*` is gitignored.
- **Preserve the repository abstraction.** Screens read data through TanStack
  Query hooks; fixtures are only imported by `MockWitsRepository`; validate
  with Zod schemas in `src/domain/schemas.ts`. Keep school logic (schedules,
  A/B day, formatting) in `src/utils` with unit tests — not in UI files.
- **Respect the design tokens** in `src/design/tokens.ts`. Match the district
  mockups; don't invent spacing, colors, or type sizes.
- **Run the full gate suite before finishing any change:**
  `pnpm typecheck && pnpm lint && pnpm test && pnpm dlx expo-doctor`.
  All four must pass.
- Follow `CONTRIBUTING.md` for the complete constraints list.
