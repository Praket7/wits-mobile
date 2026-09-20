# Demo Scripts

All data shown is synthetic (Alex / Maya Williams personas). Every screen can
be driven from `pnpm start`; the dev-only role switcher and scenario picker
live under More → Prototype (dev).

## 1. Five-minute product walkthrough (district leadership)

1. **Login** — Sign in with District Account. Note: no WITS passwords are
   collected; this becomes Google SSO (OAuth/OIDC + PKCE).
2. **Student Today** — hero with A/B day, live Next Class card, Needs
   Attention (due-soon counts, unread WITSMail), upcoming events, schedule.
3. **Academics → AP Chemistry** — grades, marking periods, assignments with
   Google Classroom provenance; assignment detail with "Open in Google
   Classroom" (never a fake "Turn In").
4. **Calendar** — agenda/month/schedule views, event detail with source
   provenance ("Source · Guidance Office"), calendar filters.
5. **Attendance** — overview, month grid, per-class drilldown.
6. **Messages (WITSMail)** — inbox/unread/sent, teacher announcement fan-out,
   reply & forward.
7. **Parent** — switch role from More (dev), Needs Attention card, child
   switcher (Maya's data is genuinely different), report an absence, forms.
8. **Teacher** — Today from repository payload, classes with pending grading,
   take attendance (demo), post announcement to multiple classes.
9. Close on architecture/security one-pager (docs/architecture.md,
   docs/wcsd-integration.md).

## 2. Technical walkthrough (district IT)

1. **Mock repository** — relational demo DB (`src/data/demo/db.ts`), one
   dataset behind two transports; `resetDemo()` for deterministic demos.
2. **HTTP path** — `pnpm demo:server` serves the committed OpenAPI contract;
   run the app with `EXPO_PUBLIC_DATA_SOURCE=http
   EXPO_PUBLIC_API_BASE_URL=http://localhost:8790` and every screen now goes
   through the production client (fetch, timeout, correlation ID, Zod).
3. **Contract** — `openapi/wits-mobile-v1.yaml` is the API the district BFF
   must implement; DTO mapping (eSchoolData/WITS → domain) happens server-side.
4. **Security seams** — bearer-token provider (no tokens in AsyncStorage),
   typed error taxonomy, URL scheme allowlist, client viewer documented as
   prototype-only (real authorization is server-side).
5. **Capabilities** — `/v1/capabilities` declares what the backend supports;
   the UI hides everything else. Demo mode ships a synthetic set.
6. **CI/testing** — tsc + eslint + jest on every PR; Maestro E2E workflow
   (manual, requires a built binary); 84+ unit tests including scoping and
   permission-sensitive behaviors.
7. **What we need** — docs/wcsd-integration.md lists concrete asks (SSO
   registration, sandbox access, feed APIs, privacy review).
