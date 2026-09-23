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
  (`src/utils/errors.ts`); friendly copy is keyed by code only (offline,
  timeout, unauthorized, forbidden, not-found, rate-limited, conflict,
  maintenance, validation, server, config, unknown). Exception messages are
  never echoed to the user.
- **URL scheme allowlist** — external links go through `openExternalUrl`
  (https only), `openMailto`, `openTel` (`src/utils/openUrl.ts`).
- **Object-level authorization is a backend responsibility** — the client
  viewer concept in `src/data/repository.ts` is a prototype convenience only.
  Production must enforce per-student/per-class access server-side
  (BOLA/IDOR; see OWASP API Top 10 / WSTG 4.12.2).
- **AuthProvider seam** — `src/auth/` defines `AuthState`/`AuthProvider` with
  a demo implementation (synthetic sign-in, no token) and an OIDC
  implementation stub (Authorization Code + PKCE via the system browser,
  tokens only in `expo-secure-store`, exactly one refresh attempt then sign
  out). The OIDC provider activates only when district SSO config is present.
- **Authenticated capability bootstrap** — `/v1/capabilities` is fetched
  post-sign-in by the AuthController (it requires a bearer token); on failure
  the app stays fail-closed. Sign-out resets capabilities to the deny-all
  production baseline and purges the Query cache.
- **Per-request tracing without leakage** — every request carries a unique
  `X-Request-ID` plus a launch-stable `X-Client-Session-ID`; writes carry an
  `Idempotency-Key`. None of these contain user data.
- **No analytics, no ads, no third-party trackers.**
- **Demo/production separation** — the demo clock, demo data, and demo
  capabilities are env-gated (`EXPO_PUBLIC_*`); development builds refuse to
  target the production API (see `src/config/env.ts`).

## Production requirements (before real data)

A WCSD security review must cover, at minimum:

1. OAuth/OIDC + PKCE through the system browser (no embedded webview); the
   `OidcAuthProvider` stub in `src/auth/` fixes the flow shape in advance.
2. Backend object-level authorization on every protected route
   (`/v1/students/{id}/...`, `/v1/teacher/classes/{id}/...`).
3. Independent backend schema validation (client Zod is not a boundary).
4. Logging that never contains student names, grades, message bodies, or IDs.
5. Transport security (TLS only), certificate pinning where district policy
   requires.
6. Session expiration/revocation handling that clears sensitive caches.
