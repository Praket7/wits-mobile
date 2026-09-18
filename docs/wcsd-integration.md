# WCSD Integration Guide

Everything the district needs to review the prototype and, if approved, move
to a pilot. Pair this with the demo script below.

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

## Conceptual API contract (item 235)

The `HttpWitsRepository` targets these endpoints. The real backend (a BFF in
front of WITS/eSchoolData) maps them — the app's routes are placeholders, not
assumptions (item 44).

```
GET /v1/me                       GET /v1/students
GET /v1/students/{id}/today      GET /v1/students/{id}/courses
GET /v1/courses/{id}             GET /v1/students/{id}/assignments
GET /v1/assignments/{id}         GET /v1/students/{id}/grades
GET /v1/students/{id}/attendance GET /v1/students/{id}/calendar
GET /v1/messages                 POST /v1/messages/{id}/reply
POST /v1/messages/{id}/read      GET /v1/students/{id}/guidance
GET /v1/resources                GET /v1/teacher/classes
GET /v1/teacher/classes/{id}/roster
GET /v1/schedules/bell           GET /v1/reminders
GET /v1/attendance/monthly
```

Every response is validated with Zod at the repository boundary; malformed
data fails before it reaches UI code.

## Authentication sequence (item 236)

```
App → system browser → WCSD IdP (Google SSO) → Duo/MFA
    → OAuth/OIDC Authorization Code + PKCE → app
    → WCSD Mobile API (Bearer token) → WITS / eSchoolData / WITSMail
```

Tokens live in SecureStore; expired sessions return the user to SSO. The app
never sees or stores district passwords.

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
