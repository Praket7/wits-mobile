import type { AuthProvider } from './types';

/**
 * Demo provider (security pass): preserves today's synthetic sign-in — no
 * credentials, no token, no network. Selected when no OIDC config is present
 * or in mock data mode, so the prototype walkthrough behavior is unchanged.
 */
export class DemoAuthProvider implements AuthProvider {
  async getAccessToken(): Promise<string | null> {
    // Mock repository and the read-only demo server need no bearer token.
    return null;
  }

  async signIn(): Promise<void> {
    // Synthetic sign-in: nothing to authenticate, nothing to store.
  }

  async signOut(): Promise<void> {
    // Nothing to revoke.
  }

  async refresh(): Promise<string | null> {
    return null;
  }
}
