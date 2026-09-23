import type { AuthProvider } from './types';

/**
 * OIDC provider (security pass): the production seam for district Google SSO.
 *
 * Intentionally a compiled-in stub until WCSD issues credentials — installing
 * expo-auth-session/expo-secure-store happens in that phase. The class fixes
 * the FLOW now so integration later is a fill-in, not a redesign:
 *
 *   1. Authorization Code + PKCE through the system browser (never a webview)
 *      via expo-auth-session's AuthRequest.
 *   2. Token exchange server-side (BFF) or direct per district policy.
 *   3. Access + refresh tokens stored ONLY in expo-secure-store (encrypted
 *      device storage) — never AsyncStorage, never the Query cache.
 *   4. refresh() attempts exactly once; on failure callers sign out rather
 *      than retry (replay-limiting) — matches OWASP session guidance.
 *
 * Every method fails closed: without configuration it reports signed-out
 * rather than throwing, so a misconfigured production build cannot hang the
 * auth state machine.
 */
export class OidcAuthProvider implements AuthProvider {
  /** Guards double sign-in (two taps on the SSO button). */
  private inFlight: Promise<void> | null = null;

  constructor(
    private readonly config: {
      issuerUrl?: string;
      clientId?: string;
      redirectScheme?: string;
      scopes?: string[];
    } = {},
  ) {}

  private get configured(): boolean {
    return Boolean(this.config.issuerUrl && this.config.clientId && this.config.redirectScheme);
  }

  async getAccessToken(): Promise<string | null> {
    if (!this.configured) return null;
    // Real implementation (when credentials arrive):
    //   const token = await SecureStore.getItemAsync(TOKEN_KEY);
    //   if (expired) token = (await this.refresh()) ?? null;
    //   return token;
    return null;
  }

  async signIn(): Promise<void> {
    if (!this.configured) {
      // Fail closed, loudly: a configured-but-broken build should be obvious
      // during district integration, not silently signed-out forever.
      throw new Error('OidcAuthProvider is not configured (issuer/clientId/scheme missing)');
    }
    if (this.inFlight) return this.inFlight;
    this.inFlight = (async () => {
      // Real implementation:
      //   const request = new AuthRequest({ issuer, clientId, redirectUrl,
      //     scopes, usePKCE: true });
      //   const result = await request.promptAsync(null);
      //   exchange code → tokens → SecureStore.setItemAsync(...).
      throw new Error('OIDC sign-in arrives with district credentials');
    })().finally(() => {
      this.inFlight = null;
    });
    return this.inFlight;
  }

  async signOut(): Promise<void> {
    // Real implementation deletes SecureStore entries and (optionally) hits the
    // provider's end-session endpoint. Nothing persisted yet, so it's a no-op.
  }

  async refresh(): Promise<string | null> {
    // Exactly-one-attempt policy lives in the caller (AuthController):
    // null here means "unrecoverable — sign the user out".
    return null;
  }
}
