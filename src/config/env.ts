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
  if (DATA_SOURCE === 'http' && !/^https:\/\/.+/.test(API_BASE_URL)) {
    problems.push(
      'EXPO_PUBLIC_DATA_SOURCE=http requires a valid https EXPO_PUBLIC_API_BASE_URL.',
    );
  }
  if (__DEV__ && /api\.williamsvillek12\.org/.test(API_BASE_URL)) {
    problems.push('Development builds must not target the production API.');
  }
  return { ok: problems.length === 0, problems };
}
