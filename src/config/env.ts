/**
 * Environment validation (items 68, 123): fail visibly instead of silently
 * fetching from an empty base URL, and guard against accidentally pointing a
 * development build at production.
 */
export type Environment = 'development' | 'demo' | 'district-sandbox' | 'production';

export const DATA_SOURCE = process.env.EXPO_PUBLIC_DATA_SOURCE ?? 'mock';
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').trim().replace(/\/+$/, '');
export const OIDC_ISSUER = (process.env.EXPO_PUBLIC_OIDC_ISSUER ?? '').trim();
export const OIDC_CLIENT_ID = (process.env.EXPO_PUBLIC_OIDC_CLIENT_ID ?? '').trim();
export const OIDC_SCOPES = (process.env.EXPO_PUBLIC_OIDC_SCOPES ?? 'openid profile email')
  .split(/[\s,]+/)
  .filter(Boolean);

export function validateConfig(
  env: Record<string, string | undefined> = process.env,
  dev = __DEV__,
): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const dataSource = env.EXPO_PUBLIC_DATA_SOURCE ?? 'mock';
  const apiBaseUrl = (env.EXPO_PUBLIC_API_BASE_URL ?? '').trim();
  const issuer = (env.EXPO_PUBLIC_OIDC_ISSUER ?? '').trim();
  const clientId = (env.EXPO_PUBLIC_OIDC_CLIENT_ID ?? '').trim();
  const scopes = (env.EXPO_PUBLIC_OIDC_SCOPES ?? 'openid profile email').split(/[\s,]+/).filter(Boolean);
  if (dataSource !== 'mock' && dataSource !== 'http') {
    problems.push('EXPO_PUBLIC_DATA_SOURCE must be mock or http.');
  }
  // The local demo server (plan §12, `pnpm demo:server`) is plain http on
  // loopback — allowed explicitly; every other http target is rejected.
  const isLoopbackHttp = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(apiBaseUrl);
  if (dataSource === 'http' && !isLoopbackHttp && !/^https:\/\/.+/.test(apiBaseUrl)) {
    problems.push(
      'EXPO_PUBLIC_DATA_SOURCE=http requires a valid https EXPO_PUBLIC_API_BASE_URL (http://localhost:<port> is allowed for the demo server).',
    );
  }
  if (apiBaseUrl) {
    try {
      const apiUrl = new URL(apiBaseUrl);
      if (apiUrl.username || apiUrl.password || apiUrl.search || apiUrl.hash) {
        problems.push('EXPO_PUBLIC_API_BASE_URL must not contain credentials, query parameters, or a fragment.');
      }
      if (apiUrl.pathname !== '/') {
        problems.push('EXPO_PUBLIC_API_BASE_URL must be the API origin only; the client adds the /v1 path prefix.');
      }
    } catch {
      problems.push('EXPO_PUBLIC_API_BASE_URL must be a valid URL.');
    }
  }
  if (dataSource === 'http' && !isLoopbackHttp && (!issuer || !clientId)) {
    problems.push('Remote HTTP mode requires district OIDC issuer and client ID configuration; demo sign-in is disabled for remote data.');
  }
  if (issuer) {
    try {
      const issuerUrl = new URL(issuer);
      if (issuerUrl.protocol !== 'https:' || issuerUrl.username || issuerUrl.password || issuerUrl.search || issuerUrl.hash) {
        problems.push('EXPO_PUBLIC_OIDC_ISSUER must be an HTTPS issuer URL without credentials, query parameters, or a fragment.');
      }
    } catch {
      problems.push('EXPO_PUBLIC_OIDC_ISSUER must be a valid HTTPS URL.');
    }
  }
  if (!scopes.includes('openid')) {
    problems.push('EXPO_PUBLIC_OIDC_SCOPES must include the required openid scope.');
  }
  if (dev && /api\.williamsvillek12\.org/i.test(apiBaseUrl)) {
    problems.push('Development builds must not target the production API.');
  }
  return { ok: problems.length === 0, problems };
}
