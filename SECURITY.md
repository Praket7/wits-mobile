# Security Policy

## Scope

This repository is a **prototype containing only synthetic data**:

- No production student data (records, names, grades, attendance)
- No credentials, API keys, or tokens of any kind
- No scraping of WITS or any district system
- No secrets in git history (`.env*` is gitignored)

## Reporting a vulnerability

Open a private GitHub security advisory (Repository → Security → Report a
vulnerability). Do **not** open a public issue for anything that could describe
an exploitable path.

## Security principles baked into the code

- **Zod validation at the repository boundary** — malformed server data fails
  loudly, never reaches UI state (`src/domain/schemas.ts`).
- **Typed error taxonomy** — raw upstream errors never reach screens
  (`src/utils/errors.ts`); friendly copy is mapped per code.
- **URL scheme allowlist** — external links go through `openExternalUrl`
  (https only), `openMailto`, `openTel` (`src/utils/openUrl.ts`).
- **Object-level authorization is a backend responsibility** — the client
  viewer concept in `src/data/repository.ts` is a prototype convenience only.
  Production must enforce per-student/per-class access server-side
  (BOLA/IDOR; see OWASP API Top 10 / WSTG 4.12.2).
- **No tokens in AsyncStorage** — the HTTP client exposes a bearer-token seam
  (`setAuthTokenProvider`); real tokens belong in `expo-secure-store` and are
  only added when real auth arrives.
- **No analytics, no ads, no third-party trackers.**
- **Demo/production separation** — the demo clock, demo data, and demo
  capabilities are env-gated (`EXPO_PUBLIC_*`); development builds refuse to
  target the production API (see `src/config/env.ts`).

## Production requirements (before real data)

A WCSD security review must cover, at minimum:

1. OAuth/OIDC + PKCE through the system browser (no embedded webview).
2. Backend object-level authorization on every protected route
   (`/v1/students/{id}/...`, `/v1/teacher/classes/{id}/...`).
3. Independent backend schema validation (client Zod is not a boundary).
4. Logging that never contains student names, grades, message bodies, or IDs.
5. Transport security (TLS only), certificate pinning where district policy
   requires.
6. Session expiration/revocation handling that clears sensitive caches.
