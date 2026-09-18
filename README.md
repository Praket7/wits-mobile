# WITS Mobile — Williamsville CSD Prototype

Expo SDK 57 + React Native + TypeScript prototype with synthetic data only.

## Run

```bash
pnpm install
pnpm start
```

Open in **Expo Go** on iOS or Android.

## Scripts

- `pnpm typecheck` — TypeScript strict check
- `pnpm lint` — ESLint via expo
- `pnpm test` — Jest + RNTL
- `pnpm expo-doctor` — environment validation

## Architecture

- `app/` — Expo Router screens grouped by role: `(student)`, `(parent)`, `(teacher)`, `(auth)`
- `src/domain/schemas.ts` — Zod schemas (validated at the repository boundary)
- `src/data/mockRepository.ts` — mock repository implementing the `WitsRepository` contract; swap for `HttpWitsRepository` later without touching screens
- `src/queries/useWits.ts` — TanStack Query hooks
- `src/components/ui.tsx` — design-system primitives
- `src/design/tokens.ts` — colors/spacing/typography tokens

## Data policy

Synthetic fixtures only (`src/data/fixtures/data.ts`). No real student PII, grades, or credentials are committed.
