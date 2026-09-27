# WITS Mobile — handoff improvements and status

Updated September 23, 2026. This status reflects changes in the current working copy. It is an engineering readiness review, not a security certification or district approval. Continue to use synthetic data only.

## Implemented in this pass

- **Native authentication:** replaced the OIDC stub with Authorization Code + PKCE through the system browser, SecureStore token persistence, refresh-on-expiry, sign-out/revocation, startup session restore, and server-derived role/identity. The HTTP client now refuses protected calls before fetch when no bearer token is available. The browser does not persist tokens; browser sign-in reports that WCSD's secure-cookie BFF is required. Files: `src/auth/oidcAuthProvider.ts`, `src/auth/AuthController.ts`, `src/data/httpRepository.ts`, `src/state/appState.tsx`.
- **Prototype identity isolation:** HTTP mode ignores locally persisted role/login state and does not store the selected child in AsyncStorage. Parent child selection is initialized from the authorized `/v1/me/students` response. Demo role and selection persistence remains mock-only. Server authorization is still required.
- **UI actions:** wired the course assignment filter, attendance Full History action, academic resource tiles, and external Classroom/Naviance links. Removed nonfunctional “See All” and “Q1” labels where the app has no corresponding action; renamed the teacher row to match its messages destination.
- **Calendar resilience:** errors now have retry actions, calendar errors appear with events rather than as a false empty state, and loading events no longer looks like “no events.”
- **Absence date validation:** rejects impossible calendar dates and fixes the default date across month/year boundaries. Server-side date policy is still required.
- **Session cleanup:** logout now clears the visible session, capabilities, active query cache before remote token cleanup. A session generation check prevents delayed sign-in or restore work from reopening a closed session. Changing the selected child cancels requests then clears the query cache. Device level acceptance still needs a WCSD test build.
- **Write retry protection:** a write keeps the same idempotency key after an ambiguous network result or a one time authentication retry. The key is held in memory for up to a day. WCSD must enforce idempotency on the server and define how the app can check an unknown result after restart.
- **Teacher permissions:** grading completion now has its own `teacherGradingWrite` permission. Announcement permission no longer unlocks grading.
- **Sign in links:** the login screen now opens the district privacy page, acceptable use policy, and family alert help page. WCSD should approve these destinations before a pilot.
- **Readability:** raised remaining small metadata and attendance text to 12 pt or more. Student Today's wrapped “See All” action was removed; the schedule remains a three-item glance with a full-calendar route.

## Still required before WCSD real-data handoff

1. **Build the WCSD backend/BFF.** This repo contains the client contract and a local synthetic demo server, not a district backend. WCSD must implement authentication, object-level authorization on every student/class route, server-side validation, rate limiting, privacy-safe logs, audit events, and idempotency enforcement. Verify with negative access tests across students, parents, teachers, classes, and messages.
2. **Validate SSO in the WCSD sandbox.** Native client code is implemented but unverified against WCSD issuer/client registration, redirect URI, MFA, token audience, refresh rotation, revocation, and operational policies. Browser use additionally needs the BFF `Secure`, `HttpOnly`, `SameSite` cookie flow. Until both are tested, do not supply real credentials or enable real records.
3. **Complete school privacy and operational review.** Approve fields, parent-child linkage, retention/deletion, device-loss and incident response, vendor terms, support ownership, monitoring, and source outage behavior. Query data remains memory-only; do not add offline persistence until those approvals and storage controls exist.
4. **Map actual WCSD sandbox DTOs.** OpenAPI generation and Zod boundary validation are in place, but the endpoint contract is conceptual and there is no sandbox response set. Validate nullable/multi-valued fields, dates/timezones, enum evolution, partial source data, and every route against synthetic district responses; keep explicit source-to-domain mapping.
5. **Finish route typing.** Expo typed routes are enabled, but legacy `as never` casts remain in navigation calls and bypass route checking. Convert static paths to typed route literals and dynamic destinations to `{ pathname, params }`, then make typecheck enforce them.
6. **Complete visual and native review.** The web screenshot review identified and fixed the long wrapped announcement action. The Student Today page still has substantial vertical scroll because it contains many sections; review whether lower-priority sections should collapse. Run the full screenshot suite at phone/tablet widths and large text, then manually verify VoiceOver/TalkBack, keyboard, external links, native fonts, safe areas, and supported iOS/Android devices.
7. **Keep writes gated.** Teacher grades/attendance/announcements, parent absence reports/forms, and message operations currently mutate only the synthetic in-memory repository. Keep production capabilities disabled until each WCSD endpoint, authorization policy, confirmation/error UX, and replay/idempotency behavior is implemented and tested.

## Handoff decision

- **Ready:** synthetic-data demo and WCSD requirements review.
- **Not ready:** browser-based WCSD sign-in, real student records, pilot, or production deployment.
- **Credentials:** only public API URL and public OIDC client configuration belong in app build configuration. API keys, client secrets, vendor passwords, and service-account credentials must stay in the district backend.

## Research used

- Expo's [authentication guidance](https://docs.expo.dev/develop/authentication/) supports using AuthSession for OAuth and documents native token/session handling.
- Expo's [SecureStore documentation](https://docs.expo.dev/versions/latest/sdk/securestore/) describes native secure storage behavior and platform limits; it is not a browser token vault.
- [RFC 8252](https://www.rfc-editor.org/rfc/rfc8252) requires PKCE for public native OAuth clients.
- [OWASP MASVS](https://mas.owasp.org/MASVS) provides broader mobile checks for storage, sign in, and network behavior.
- SciSpace surfaced a [review of usable mobile privacy controls](https://doi.org/10.59200/iconic.2024.014). It informs clear privacy choices, not WCSD policy.
- alphaXiv surfaced [privacy research in data driven education](https://www.alphaxiv.org/abs/2503.13550). It gives student privacy context, not proof of this app's security.
- Parallel Search verified the current [district privacy page](https://www.williamsvillek12.org/departments/technology/data-privacy-and-security), [acceptable use policy](https://north.williamsvillek12.org/parents-students/acceptable-use-policy), and [family alert help page](https://www.williamsvillek12.org/departments/communications/ealerts).
- GitHub connector confirmed the target is the public `Praket7/wits-mobile` repository on `main`; these local changes are not yet present on GitHub.
