# WITS Mobile — Architecture

## Layers

```
app/            Expo Router screens (student / parent / teacher / auth route groups)
src/components  UI kit (ui.tsx primitives, icons, gauges, patterns)
src/design      Design tokens (colors, spacing, radii, type)
src/domain      Zod schemas → inferred TypeScript types
src/data        WitsRepository contract + synthetic mock + validated HTTP client
src/queries     TanStack Query hooks (per-entity files; canonical impl in useWits.ts)
src/state       Session provider (role, selected child, login persistence)
src/search      Local in-memory search index + scoring
src/utils       Formatting helpers (dates, A/B day, grade colors)
```

## Data flow

```
Screens → useXxx() hooks (TanStack Query) → WitsRepository → fixtures (mock) | WCSD API (http)
```

- Repository responses are **Zod-validated at the boundary** before reaching UI.
- `EXPO_PUBLIC_DATA_SOURCE=mock|http` selects the implementation; screens never import fixtures.
- Query keys: `['today', studentId]`, `['courses', studentId]`, `['messages']`, etc.
- Changing the selected child cancels requests and clears the query cache.

## Role model

- Prototype: role switch (`student | parent | teacher`) persisted in AsyncStorage, exposed in More.
- Production: role derived from SSO claims; the switch is removed.

## Swapping in the district API

1. WCSD provides an approved HTTPS service, OIDC registration, scopes, test accounts.
2. Set `EXPO_PUBLIC_DATA_SOURCE=http`, the API origin, the issuer, the public client ID.
3. `HttpWitsRepository` already validates responses against the shared schemas.
4. WCSD must implement the server, object access rules, vendor adapters, write deduplication.
5. Verify the full flow in the district sandbox before enabling real records.

## Testing

- Unit: `src/utils/format.test.ts`, `src/search/searchIndex.test.ts`, `src/domain/*.test.ts`, `src/state/*.test.ts`
- Component (RNTL): `src/components/__tests__/*`, `src/screens/__tests__/*`

## Conventions

- StyleSheet + design tokens only (no UI frameworks).
- Ionicons via @expo/vector-icons for icons (renders in Expo Go on both platforms).
- All pressables ≥44×44; no color-only status; accessibilityLabel on icon-only controls.
