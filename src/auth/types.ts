import type { User } from '@/domain/schemas';

/**
 * Auth state machine (security pass, real-data transition):
 *
 *   app starts → loading
 *   no restored session → signed-out
 *   token restored / sign-in completes → signed-in(user)
 *
 * `user` is the server-derived identity from GET /v1/me — the client never
 * tells the server who it is, so the state carries no locally-chosen role.
 */
export type AuthState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; user: User };

/**
 * Provider seam for district SSO. Two implementations ship:
 *
 *  • DemoAuthProvider — today's synthetic sign-in (no token, instant).
 *  • OidcAuthProvider — Authorization Code + PKCE through the system browser
 *    (expo-auth-session) with tokens in expo-secure-store. Selected
 *    automatically once EXPO_PUBLIC_OIDC_ISSUER / _CLIENT_ID are configured.
 *
 * Security invariants (OWASP mobile guidance):
 *  • Tokens NEVER live in AsyncStorage or the TanStack Query cache.
 *  • Exactly one refresh attempt on expiry; a failed refresh signs out.
 *  • The access token is only exposed through getAccessToken() to the HTTP
 *    client's bearer seam — never logged, never persisted by callers.
 */
export interface AuthProvider {
  /** Current access token for the HTTP bearer seam, or null when signed out. */
  getAccessToken(): Promise<string | null>;
  /** Run the sign-in flow; resolves when the app may bootstrap capabilities. */
  signIn(): Promise<void>;
  /** Revoke/clear the session (device-side + provider-side where possible). */
  signOut(): Promise<void>;
  /** One refresh attempt; returns null (do NOT throw) when unrecoverable. */
  refresh(): Promise<string | null>;
}
