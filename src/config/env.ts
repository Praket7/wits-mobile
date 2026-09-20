/**
 * Environment validation (items 68, 123): fail visibly instead of silently
 * fetching from an empty base URL, and guard against accidentally pointing a
 * development build at production.
 */
export type Environment = 'development' | 'demo' | 'district-sandbox' | 'production';

export const DATA_SOURCE = process.env.EXPO_PUBLIC_DATA_SOURCE ?? 'mock';
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

export function validateConfig(): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  // The local demo server (plan §12, `pnpm demo:server`) is plain http on
  // loopback — allowed explicitly; every other http target is rejected.
  const isLoopbackHttp = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(API_BASE_URL);
  if (DATA_SOURCE === 'http' && !isLoopbackHttp && !/^https:\/\/.+/.test(API_BASE_URL)) {
    problems.push(
      'EXPO_PUBLIC_DATA_SOURCE=http requires a valid https EXPO_PUBLIC_API_BASE_URL (http://localhost:<port> is allowed for the demo server).',
    );
  }
  if (__DEV__ && /api\.williamsvillek12\.org/.test(API_BASE_URL)) {
    problems.push('Development builds must not target the production API.');
  }
  return { ok: problems.length === 0, problems };
}
