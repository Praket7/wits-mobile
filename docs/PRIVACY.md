# Privacy Architecture

## Prototype (current)

- **Data is 100% synthetic.** Fixtures in `src/data/fixtures/` describe
  fictional students, staff, and events. Nothing in the app or repo derives
  from a real person, and demo identities are deliberately fictional.
- **No ads, no analytics, no behavioral tracking.** No third-party SDKs beyond
  Expo/React Native essentials.
- **No data sale or sharing** — there is no WCSD service connection. A local
  synthetic demo server exists for development only.
- Mock mode stores demo role and selected child preferences in AsyncStorage.
  HTTP mode does not restore those values. Notification preferences remain
  local app settings. Switching children or signing out cancels requests then
  clears the Query cache from memory (`queryClient.clear`).
- The login screen never collects a username or password. The mock sign-in is
  clearly labelled "Prototype: sign-in is simulated."

## Production (requires district approval and backend)

- All student data stays under WCSD control: the district backend authorizes
  every request (parent→child links, teacher→section rosters) and the app
  displays only what the authorized backend returns.
- Transport is encrypted (HTTPS only; the app refuses non-https external
  links).
- Authentication uses OAuth/OIDC + PKCE in the system browser; tokens are kept
  in `expo-secure-store`, never AsyncStorage, and are wiped on sign-out.
- Push notifications carry no sensitive content by default ("You have a new
  grade", never a grade value) unless the user opts in.
- Minimal on-device caching with per-domain freshness; no grades/messages
  persisted across sessions.
- Data retention, deletion, and parent-rights handling follow WCSD policy.
