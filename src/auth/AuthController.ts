import { repository } from '@/data/mockRepository';
import { fetchServerCapabilities } from '@/data/httpRepository';
import { setCapabilities, resetCapabilities } from '@/config/capabilities';
import { DemoAuthProvider } from './demoAuthProvider';
import { OidcAuthProvider } from './oidcAuthProvider';
import type { AuthState, AuthProvider } from './types';

/**
 * Provider selection (security pass): the OIDC provider activates only when
 * the district's SSO configuration is present. Until WCSD issues credentials,
 * demo mode — including the local HTTP demo server, which requires no token —
 * uses the demo provider, preserving today's walkthrough behavior exactly.
 */
function selectProvider(): AuthProvider {
  const issuer = process.env.EXPO_PUBLIC_OIDC_ISSUER;
  const clientId = process.env.EXPO_PUBLIC_OIDC_CLIENT_ID;
  if (issuer && clientId) {
    return new OidcAuthProvider({
      issuerUrl: issuer,
      clientId,
      // app.json declares scheme "witsmobile".
      redirectScheme: process.env.EXPO_PUBLIC_OIDC_REDIRECT_SCHEME ?? 'witsmobile',
      scopes: ['openid', 'profile', 'email'],
    });
  }
  return new DemoAuthProvider();
}

/**
 * AuthController (security pass): owns the real-data boot sequence the audit
 * called for. Capability bootstrap no longer happens at module import — that
 * fetched /v1/capabilities with no bearer token, a guaranteed 401 that left
 * every write feature hidden for the whole session.
 *
 *   app starts  → restore() → token? (SecureStore-backed provider later)
 *   sign in     → provider.signIn()
 *               → GET /me            (identity + role, server-derived)
 *               → GET /capabilities  (authenticated; fail-closed on failure)
 *               → session established
 *   sign out    → provider.signOut() → resetCapabilities() → signed-out
 */
class AuthController {
  private state: AuthState = { status: 'loading' };
  private listeners = new Set<(s: AuthState) => void>();
  private inFlight: Promise<void> | null = null;
  private provider: AuthProvider = selectProvider();

  getState(): AuthState {
    return this.state;
  }

  subscribe(fn: (s: AuthState) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private setState(next: AuthState): void {
    this.state = next;
    for (const fn of this.listeners) fn(next);
  }

  /**
   * Apply the capability baseline appropriate to the data source.
   *  • mock       → demo baseline (local, no network, by design).
   *  • http       → fetch /v1/capabilities through the authenticated request
   *                 path (token attached by the bearer seam when a provider
   *                 holds one — i.e. post-sign-in). Failure ⇒ fail closed.
   */
  private async applyCapabilities(): Promise<void> {
    if (process.env.EXPO_PUBLIC_DATA_SOURCE !== 'http') {
      setCapabilities({}, 'demo');
      return;
    }
    try {
      const decl = await fetchServerCapabilities();
      // Merges over the fail-closed production baseline; never the demo one.
      setCapabilities(decl, 'production');
    } catch {
      // Fail closed: writes stay hidden, reads continue server-permitting.
      resetCapabilities();
    }
  }

  /**
   * Startup restore. Demo: no token exists, so this resolves signed-out and
   * the prototype's AsyncStorage session gate keeps governing the UI. OIDC
   * (later): reads SecureStore, refreshes once if expired, then bootstraps.
   */
  async restore(): Promise<void> {
    try {
      const token = await this.provider.getAccessToken();
      if (!token) {
        this.setState({ status: 'signed-out' });
        return;
      }
      await this.applyCapabilities();
      const user = await repository.getMe();
      this.setState({ status: 'signed-in', user });
    } catch {
      this.setState({ status: 'signed-out' });
    }
  }

  /** Sign in; concurrent calls share one flow. */
  async signIn(): Promise<void> {
    if (this.inFlight) return this.inFlight;
    const flow = (async () => {
      await this.provider.signIn();
      await this.applyCapabilities();
      const user = await repository.getMe();
      this.setState({ status: 'signed-in', user });
    })();
    this.inFlight = flow
      .catch((e) => {
        this.setState({ status: 'signed-out' });
        throw e;
      })
      .finally(() => {
        this.inFlight = null;
      });
    return this.inFlight;
  }

  /** Sign out: provider cleanup, fail-closed capabilities, cleared state. */
  async signOut(): Promise<void> {
    await this.provider.signOut();
    resetCapabilities();
    this.setState({ status: 'signed-out' });
  }

  /**
   * Exactly one refresh attempt (OWASP session policy): a null result means
   * unrecoverable — callers sign the user out rather than retry.
   */
  async refreshOnce(): Promise<string | null> {
    return this.provider.refresh();
  }
}

export const authController = new AuthController();
