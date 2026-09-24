import { AuthRequest, CodeChallengeMethod, ResponseType, TokenResponse, TokenTypeHint, exchangeCodeAsync, fetchDiscoveryAsync, makeRedirectUri, revokeAsync, type DiscoveryDocument } from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { AuthProvider } from './types';

const TOKEN_KEY = 'wits.oidc';
type SavedTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
};

/** District OIDC Authorization Code + PKCE. Browser builds require a WCSD BFF
 * session cookie; JavaScript-accessible browser storage is never used for tokens. */
export class OidcAuthProvider implements AuthProvider {
  private inFlight: Promise<void> | null = null;
  private tokens: SavedTokens | null = null;
  private discovery: DiscoveryDocument | null = null;
  private refreshInFlight: Promise<string | null> | null = null;
  private storageKey: Promise<string> | null = null;

  constructor(private readonly config: {
    issuerUrl?: string;
    clientId?: string;
    redirectScheme?: string;
    scopes?: string[];
  } = {}) {}

  private get configured(): boolean {
    return Boolean(this.config.issuerUrl && this.config.clientId && this.config.redirectScheme);
  }

  private assertConfigured(): void {
    if (!this.configured) throw new Error('District sign-in requires an OIDC issuer, client ID, and redirect scheme.');
    if (Platform.OS === 'web') {
      throw new Error('Browser sign-in requires the WCSD BFF to manage a Secure, HttpOnly session cookie.');
    }
  }

  private async getDiscovery(): Promise<DiscoveryDocument> {
    this.discovery ??= await fetchDiscoveryAsync(this.config.issuerUrl!);
    return this.discovery;
  }

  private getStorageKey(): Promise<string> {
    this.storageKey ??= Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${this.config.issuerUrl ?? ''}\u0000${this.config.clientId ?? ''}`,
    ).then((digest) => `${TOKEN_KEY}.${digest}`);
    return this.storageKey;
  }

  private async persist(tokens: TokenResponse): Promise<void> {
    const saved: SavedTokens = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      // Missing expiry cannot safely mean "valid forever"; next use will
      // require a refresh token or fail closed.
      expiresAt: tokens.expiresIn && tokens.expiresIn > 0
        ? tokens.issuedAt * 1000 + tokens.expiresIn * 1000
        : Date.now(),
    };
    this.tokens = saved;
    await SecureStore.setItemAsync(await this.getStorageKey(), JSON.stringify(saved));
  }

  async getAccessToken(): Promise<string | null> {
    if (!this.configured || Platform.OS === 'web') return null;
    if (!this.tokens) this.tokens = await this.readSavedTokens();
    if (!this.tokens) return null;
    const expiresAt = this.tokens.expiresAt;
    if (!expiresAt || expiresAt <= Date.now() + 60_000) return this.refresh();
    return this.tokens.accessToken;
  }

  async signIn(): Promise<void> {
    this.assertConfigured();
    if (this.inFlight) return this.inFlight;
    this.inFlight = (async () => {
      const discovery = await this.getDiscovery();
      const redirectUri = makeRedirectUri({ scheme: this.config.redirectScheme, path: 'oauth' });
      const request = new AuthRequest({
        clientId: this.config.clientId!,
        redirectUri,
        responseType: ResponseType.Code,
        scopes: this.config.scopes ?? ['openid', 'profile'],
        usePKCE: true,
        codeChallengeMethod: CodeChallengeMethod.S256,
      });
      const result = await request.promptAsync(discovery);
      if (result.type !== 'success' || !result.params.code || !request.codeVerifier) {
        throw new Error(result.type === 'error' ? 'District sign-in was rejected.' : 'District sign-in was cancelled.');
      }
      if (result.params.state !== request.state) throw new Error('District sign-in state validation failed.');
      const token = await exchangeCodeAsync({
        clientId: this.config.clientId!,
        code: result.params.code,
        redirectUri,
        extraParams: { code_verifier: request.codeVerifier },
      }, discovery);
      if (!token.accessToken || token.tokenType.toLowerCase() !== 'bearer') {
        throw new Error('District identity provider returned an unsupported token response.');
      }
      await this.persist(token);
    })().finally(() => { this.inFlight = null; });
    return this.inFlight;
  }

  async signOut(): Promise<void> {
    if (Platform.OS === 'web') {
      this.tokens = null;
      return;
    }
    const tokens = this.tokens ?? await this.readSavedTokens();
    this.tokens = null;
    await SecureStore.deleteItemAsync(await this.getStorageKey());
    if (tokens?.refreshToken && this.configured) {
      const discovery = await this.getDiscovery().catch(() => null);
      if (discovery?.revocationEndpoint) {
        let timer: ReturnType<typeof setTimeout>;
        await Promise.race([
          revokeAsync({ clientId: this.config.clientId!, token: tokens.refreshToken, tokenTypeHint: TokenTypeHint.RefreshToken }, discovery).catch(() => {}),
          new Promise<void>((resolve) => { timer = setTimeout(resolve, 1_500); }),
        ]);
        clearTimeout(timer!);
      }
    }
  }

  async refresh(): Promise<string | null> {
    if (this.refreshInFlight) return this.refreshInFlight;
    this.refreshInFlight = (async () => {
      const tokens = this.tokens ?? await this.readSavedTokens();
      if (!tokens?.refreshToken || !this.configured || Platform.OS === 'web') {
        await this.clearTokens();
        return null;
      }
      try {
        const refreshed = await new TokenResponse({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresAt ? Math.max(0, Math.floor((tokens.expiresAt - Date.now()) / 1000)) : 0,
          issuedAt: Math.floor(Date.now() / 1000),
        }).refreshAsync({ clientId: this.config.clientId! }, await this.getDiscovery());
        if (!refreshed.accessToken) throw new Error('Refresh returned no access token.');
        await this.persist(refreshed);
        return refreshed.accessToken;
      } catch {
        await this.clearTokens();
        return null;
      }
    })().finally(() => { this.refreshInFlight = null; });
    return this.refreshInFlight;
  }

  private async readSavedTokens(): Promise<SavedTokens | null> {
    const key = await this.getStorageKey();
    const raw = await SecureStore.getItemAsync(key);
    if (!raw) return null;
    try {
      const value: unknown = JSON.parse(raw);
      if (!value || typeof value !== 'object') throw new Error('invalid stored tokens');
      const saved = value as Partial<SavedTokens>;
      if (
        typeof saved.accessToken !== 'string' || !saved.accessToken ||
        (saved.refreshToken !== undefined && typeof saved.refreshToken !== 'string') ||
        (saved.expiresAt !== undefined && (typeof saved.expiresAt !== 'number' || !Number.isFinite(saved.expiresAt)))
      ) throw new Error('invalid stored tokens');
      return { ...saved, expiresAt: saved.expiresAt ?? Date.now() } as SavedTokens;
    } catch {
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  }

  private async clearTokens(): Promise<void> {
    this.tokens = null;
    await SecureStore.deleteItemAsync(await this.getStorageKey());
  }
}
