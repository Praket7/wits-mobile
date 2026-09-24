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
  a demo implementation (synthetic sign-in, no token) and a native OIDC
  Authorization Code + PKCE flow through the system browser. Native tokens
  are stored only in `expo-secure-store`; an expired token gets one refresh
  attempt, then the session is cleared. HTTP requests fail before fetch if no
  bearer token is available. Browser OIDC is intentionally disabled until
  WCSD provides a BFF that sets a `Secure`, `HttpOnly`, `SameSite` session
  cookie; the browser never stores bearer or refresh tokens in JavaScript
  storage. Native sign-in still requires validation against WCSD's registered
  client, redirect URI, MFA policy, and sandbox.
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
- **No client API keys** — `EXPO_PUBLIC_*` values are compiled into the app
  bundle and are public. Vendor/WITS credentials belong in the WCSD backend;
  the app uses an API base URL and short-lived user tokens only.

## Production requirements (before real data)

A WCSD security review must cover, at minimum:

1. Validate the implemented native OAuth/OIDC + PKCE flow against the WCSD
   sandbox and independently review it. Browser sign-in remains blocked until
   the WCSD BFF provides secure cookie sessions.
2. Implement and independently review backend object-level authorization on every protected route
   (`/v1/students/{id}/...`, `/v1/teacher/classes/{id}/...`).
3. Independent backend schema validation (client Zod is not a boundary).
4. Logging that never contains student names, grades, message bodies, or IDs.
5. Transport security (TLS only), certificate pinning where district policy
   requires.
6. Validate session expiration/revocation handling with the WCSD identity
   provider; the native client clears local tokens and sensitive query cache
   on failure/sign-out.
7. WCSD approval of the exact fields retained on device. The current app does
   not persist query data; do not enable a general AsyncStorage query persister
   for grades, attendance, messages, or student identity.

## API configuration handoff

The app accepts `EXPO_PUBLIC_API_BASE_URL` and non-secret OIDC issuer/client
configuration in `.env` for local integration work. `EXPO_PUBLIC_*` values are
public build configuration, never secrets. Do not put API keys, client
secrets, vendor passwords, or service-account credentials in the app or its
environment file. WCSD should keep those credentials in its backend/BFF and
give the app only the HTTPS API URL. Remote HTTP mode refuses the demo-auth
fallback when OIDC issuer/client configuration is missing; localhost demo
HTTP remains available. Real SSO remains
unvalidated until the district provides its registration details and approves
the provider configuration. Browser sign-in requires the BFF cookie flow.
