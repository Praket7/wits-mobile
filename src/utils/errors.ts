/**
 * Typed error model (item 118): repository/UI failures map onto a small
 * taxonomy so screens show friendly, specific copy — and so district
 * integration later can distinguish offline vs unauthorized vs forbidden.
 */
export type AppErrorCode =
  | 'offline'
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'validation'
  | 'server'
  | 'unknown';

export type AppError = {
  code: AppErrorCode;
  message?: string;
};

const COPY: Record<AppErrorCode, string> = {
  offline: "You're offline. Showing the last available information.",
  unauthorized: 'Your session has expired. Please sign in again.',
  forbidden: "You don't have access to this information.",
  'not-found': 'This item is no longer available.',
  validation: 'Some information could not be loaded right now.',
  server: 'The district system is temporarily unavailable. Please try again.',
  unknown: 'Something went wrong. Please try again.',
};

export function errorCode(e: unknown): AppErrorCode {
  if (typeof e === 'object' && e !== null && 'code' in e) {
    const c = (e as AppError).code;
    if (c && c in COPY) return c;
  }
  return 'unknown';
}

/** Never exposes internal IDs or raw API errors (item 229). */
export function friendlyError(e: unknown): { title: string; body: string } {
  const code = errorCode(e);
  const detail =
    typeof e === 'object' && e !== null && 'message' in e && (e as AppError).message
      ? String((e as AppError).message)
      : undefined;
  return { title: COPY[code], body: detail ?? COPY[code] };
}

/** Map HTTP status to the error taxonomy (used by the fetch client, item 43). */
export function codeFromStatus(status: number): AppErrorCode {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not-found';
  if (status === 422) return 'validation';
  if (status >= 500) return 'server';
  return 'unknown';
}
