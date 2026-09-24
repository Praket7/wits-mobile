import { repository } from '@/data/mockRepository';
import { fetchServerCapabilities, setAuthRefreshProvider, setAuthTokenProvider } from '@/data/httpRepository';
import Constants from 'expo-constants';
import { setCapabilities, resetCapabilities } from '@/config/capabilities';
import { DATA_SOURCE, OIDC_CLIENT_ID, OIDC_ISSUER, OIDC_SCOPES } from '@/config/env';
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
  if (DATA_SOURCE === 'http' && OIDC_ISSUER && OIDC_CLIENT_ID) {
    const configuredScheme = Constants.expoConfig?.scheme;
    return new OidcAuthProvider({
      issuerUrl: OIDC_ISSUER,
      clientId: OIDC_CLIENT_ID,
      // Must match the native scheme compiled from app.json; this is build
      // configuration, not an independently overridable runtime setting.
      redirectScheme: Array.isArray(configuredScheme) ? configuredScheme[0] : configuredScheme,
      scopes: OIDC_SCOPES,
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
 *   app starts  → restore() → token? (native tokens restore from SecureStore)
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
  private generation = 0;
  private provider: AuthProvider = selectProvider();

  constructor() {
    setAuthTokenProvider(async () => {
      const token = await this.provider.getAccessToken();
      if (!token && this.state.status === 'signed-in') this.invalidateSession();
      return token;
    });
    setAuthRefreshProvider(async () => {
      const token = await this.provider.refresh();
      if (!token && this.state.status === 'signed-in') this.invalidateSession();
      return token;
    });
  }

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

  private invalidateSession(): void {
    this.generation += 1;
    void this.provider.signOut().catch(() => {});
    resetCapabilities();
    this.setState({ status: 'signed-out' });
  }

  /**
   * Apply the capability baseline appropriate to the data source.
   *  • mock       → demo baseline (local, no network, by design).
   *  • http       → fetch /v1/capabilities through the authenticated request
   *                 path (token attached by the bearer seam when a provider
   *                 holds one — i.e. post-sign-in). Failure ⇒ fail closed.
   */
  private async applyCapabilities(generation = this.generation): Promise<void> {
    if (DATA_SOURCE !== 'http') {
      if (generation !== this.generation) return;
      setCapabilities({}, 'demo');
      return;
    }
    try {
      const decl = await fetchServerCapabilities();
      if (generation !== this.generation) return;
      // Merges over the fail-closed production baseline; never the demo one.
      setCapabilities(decl, 'production');
    } catch {
      // Fail closed: writes stay hidden, reads continue server-permitting.
      resetCapabilities();
    }
  }

  /**
   * Startup restore. Demo mode keeps its synthetic session behavior. Native
   * OIDC restores a SecureStore token, refreshes if expired, then bootstraps.
   */
  async restore(): Promise<void> {
    const generation = this.generation;
    try {
      const token = await this.provider.getAccessToken();
      if (generation !== this.generation) {
        await this.provider.signOut().catch(() => {});
        return;
      }
      if (!token) {
        resetCapabilities();
        this.setState({ status: 'signed-out' });
        return;
      }
      await this.applyCapabilities(generation);
      const user = await repository.getMe();
      if (generation !== this.generation) return;
      this.setState({ status: 'signed-in', user });
    } catch {
      if (generation !== this.generation) return;
      await this.provider.signOut().catch(() => {});
      resetCapabilities();
      this.setState({ status: 'signed-out' });
    }
  }

  /** Sign in; concurrent calls share one flow. */
  async signIn(): Promise<void> {
    if (this.inFlight) return this.inFlight;
    const generation = this.generation;
    const flow = (async () => {
      await this.provider.signIn();
      if (generation !== this.generation) {
        await this.provider.signOut().catch(() => {});
        throw new Error('Sign-in was cancelled.');
      }
      await this.applyCapabilities(generation);
      const user = await repository.getMe();
      if (generation !== this.generation) throw new Error('Sign-in was cancelled.');
      this.setState({ status: 'signed-in', user });
    })();
    this.inFlight = flow
      .catch((e) => {
        if (generation !== this.generation) void this.provider.signOut().catch(() => {});
        if (generation === this.generation) {
          void this.provider.signOut().catch(() => {});
          resetCapabilities();
          this.setState({ status: 'signed-out' });
        }
        throw e;
      })
      .finally(() => {
        this.inFlight = null;
      });
    return this.inFlight;
  }

  /** Sign out: provider cleanup, fail-closed capabilities, cleared state. */
  async signOut(): Promise<void> {
    this.generation += 1;
    resetCapabilities();
    this.setState({ status: 'signed-out' });
    await this.provider.signOut();
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
