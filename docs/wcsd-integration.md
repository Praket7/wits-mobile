# WCSD Integration Guide

Everything the district needs to review the prototype and, if approved, move
to a pilot. Pair this with the demo script below.

## Plain language overview

This app is a sample school portal. It currently uses invented records. The
district connection described below is a plan, not an active WCSD service.
The app needs a secure district service to sign in each person, check which
school records they may see, then send only those records to the phone. This
guide calls that service the backend or BFF. That service is not included in
this repository.

An API is the set of requests the app makes to the district service. The API
description is a shared agreement about those requests and their data. It
does not create the service or grant access to student records.

## What we need from WCSD (item 298)

1. Technical sponsor + written authorization
2. WITS / eSchoolData API documentation and sandbox (GURU) access
3. Synthetic/test accounts for each role
4. SSO/OIDC registration (client ID, redirect URIs, Duo/MFA notes)
5. Parent–child relationship source of truth
6. WITSMail interface decision (read? reply? attachments?)
7. District + school calendar/event feeds
8. Official branding assets (logo SVG/PNG, photos with usage rights)
9. App store organization ownership (Apple/Google under WCSD, item 61)
10. Privacy/security review and data-retention policy

## API contract and environment

[`openapi/wits-mobile-v1.yaml`](../openapi/wits-mobile-v1.yaml) is the
authoritative draft contract. It is checked against the client routes and
Zod schemas by `pnpm contract`; generated TypeScript types are checked by
`pnpm api:check`. It describes the app-facing BFF, not a direct WITS or
eSchoolData vendor API. WCSD must approve and implement that adapter.

For a district sandbox build, set these public configuration values at build
time:

```dotenv
EXPO_PUBLIC_DATA_SOURCE=http
EXPO_PUBLIC_API_BASE_URL=https://<district-bff-origin>
EXPO_PUBLIC_OIDC_ISSUER=https://<district-identity-provider>
EXPO_PUBLIC_OIDC_CLIENT_ID=<registered-public-native-client-id>
EXPO_PUBLIC_OIDC_SCOPES=openid profile email <district-approved-api-scope>
```

`API_BASE_URL` must be the HTTPS origin only; the client appends `/v1`. The
app's registered redirect URI is derived from the static `witsmobile` scheme
in `app.json`; WCSD must register the exact URI emitted by a development
build. Client IDs and issuer URLs are public. Never put API keys, OIDC client
secrets, vendor credentials, or signing secrets in `EXPO_PUBLIC_*` variables;
keep them in the BFF's managed secret store. Do not configure these values
against live student data until WCSD has approved the sandbox and completed
its privacy and security review.

Every response is validated with Zod at the repository boundary; malformed
data fails before it reaches UI code.

## Authentication sequence (item 236)

```
App → system browser → WCSD IdP (Google SSO) → Duo/MFA
    → OAuth/OIDC Authorization Code + PKCE → app
    → WCSD Mobile API (Bearer token) → WITS / eSchoolData / WITSMail
```

The native client flow uses Expo AuthSession with authorization code + PKCE.
Native access/refresh tokens live only in SecureStore; a 401 can trigger one
refresh and one request retry, after which an unrecoverable session is
cleared. Writes carry an idempotency key that remains stable across that
authentication retry. Other transient GET failures can retry once; writes
are never automatically retried. WCSD must register the native
redirect URI and verify issuer/audience, MFA, and refresh/revocation policy
against its sandbox before a pilot. Browser OIDC is disabled until the BFF
supports a `Secure`, `HttpOnly`, `SameSite` cookie session. No token is stored
in browser local/session storage. The app never sees or stores district
passwords or vendor API keys.

Every write request carries the contract's `Idempotency-Key`. The BFF should
store each key with its result for at least 24 hours. Repeated requests with
the same key and same body should return the first result. Reusing a key with
a different body should return a conflict. The mobile app's short lived
in-memory retry record cannot replace this server behavior.

The server/BFF is not part of this repository. Routes remain a client
contract until WCSD supplies a backend and verifies authorization on every
student, guardian relationship, course, message, class, roster, form, and
write. The server must derive identity and role from the validated token,
enforce object-level authorization, return only fields needed by each role,
and avoid student PII in logs. The client cannot provide or prove those
server-side controls.

## Standards and implementation references

- [Expo AuthSession](https://docs.expo.dev/versions/latest/sdk/auth-session/)
  documents native authorization code + PKCE and warns that client secrets
  must remain server-side.
- [Expo authentication guide](https://docs.expo.dev/guides/authentication/)
  describes browser-based sign-in and redirect URI setup.
- [RFC 8252](https://datatracker.ietf.org/doc/rfc8252/) requires PKCE for
  public native OAuth clients.
- [RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html) gives current OAuth
  security guidance, including refresh-token rotation for public clients.

## Data-source architecture (item 237)

```
WITS (SIS)   eSchoolData   Finalsite   Guidance   Google Classroom
     \            |            |          |             /
      ---------- WCSD Mobile API (BFF) ----------
                        |  - authZ, caching, aggregation
                        |  - maps vendor DTOs → domain model
                        v
                   WITS Mobile app (Zod-validated)
```

## Pilot plan (items 246–249)

- **Prototype** (now): synthetic data, all roles, demo on any device.
- **Pilot**: approved sandbox/live data, limited user group (a few students,
  parents, teachers, Technology staff), **read-only** except notification
  preferences. No teacher grade writes, no attendance reporting, no forms.
- **Production**: district-wide rollout after pilot feedback + security review.

## Five-minute demo script (item 296)

1. **Login** — district SSO shape; note the mock notice and AUP link.
2. **Student Today** — hero, live glance counts, next class, timeline.
3. **Academics → AP Chemistry** — marking-period picker, grade tiles.
4. **Assignment detail** — Google Classroom source + "Open in Classroom".
5. **Calendar** — agenda, filter checkboxes, bell schedule.
6. **Attendance** — rate ring, by-class rates, monthly view.
7. **Parent role** — Needs Attention card, My Students child switcher.
8. **Teacher role** — Today's classes, action items, compose route.
9. Close on architecture: mock → HTTP repository swap, Zod boundaries, the
   integration checklist above.

## Security checklist for IT (item 297)

Mock/HTTP repository seam · Zod validation boundaries · SSO plan above ·
backend ownership and authorization · API mapping · privacy docs · CI gates
(typecheck, lint, tests, expo-doctor on every PR).
