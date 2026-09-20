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
  | 'config'
  | 'unknown';

export type AppErrorShape = {
  code: AppErrorCode;
  message?: string;
  /** Optional diagnostic fields — never logged with payloads (§48). */
  status?: number;
  hint?: string;
};

/**
 * Error class so repositories can `throw new AppError(...)` and callers can
 * `instanceof`-check without losing the taxonomy code.
 */
export class AppError extends Error implements AppErrorShape {
  code: AppErrorCode;
  status?: number;
  hint?: string;

  constructor(code: AppErrorCode, message?: string, extra?: { status?: number; hint?: string }) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = extra?.status;
    this.hint = extra?.hint;
  }
}

const COPY: Record<AppErrorCode, string> = {
  offline: "You're offline. Showing the last available information.",
  unauthorized: 'Your session has expired. Please sign in again.',
  forbidden: "You don't have access to this information.",
  'not-found': 'This item is no longer available.',
  validation: 'Some information could not be loaded right now.',
  server: 'The district system is temporarily unavailable. Please try again.',
  config: 'The app is not configured for this data source.',
  unknown: 'Something went wrong. Please try again.',
};

export function errorCode(e: unknown): AppErrorCode {
  if (typeof e === 'object' && e !== null && 'code' in e) {
    const c = (e as AppErrorShape).code;
    if (c && c in COPY) return c;
  }
  return 'unknown';
}

/** Never exposes internal IDs or raw API errors (item 229). */
export function friendlyError(e: unknown): { title: string; body: string } {
  const code = errorCode(e);
  const detail =
    typeof e === 'object' && e !== null && 'message' in e && (e as AppErrorShape).message
      ? String((e as AppErrorShape).message)
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
