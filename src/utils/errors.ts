/**
 * Typed error model (item 118, security pass): repository/UI failures map onto
 * a small taxonomy so screens show friendly, specific copy — and so district
 * integration later can distinguish every failure class that matters.
 *
 * Security property: user-facing copy is keyed by CODE only. Raw upstream
 * messages, paths, and IDs never reach the UI (previously `friendlyError`
 * echoed the exception message — future adapters might not sanitize it).
 */
export type AppErrorCode =
  | 'offline'
  | 'timeout'
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'rate-limited'
  | 'conflict'
  | 'maintenance'
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
  /** Server-advised retry delay in ms (Retry-After), when present. */
  retryAfterMs?: number;
};

/**
 * Error class so repositories can `throw new AppError(...)` and callers can
 * `instanceof`-check without losing the taxonomy code.
 */
export class AppError extends Error implements AppErrorShape {
  code: AppErrorCode;
  status?: number;
  hint?: string;
  retryAfterMs?: number;

  constructor(
    code: AppErrorCode,
    message?: string,
    extra?: { status?: number; hint?: string; retryAfterMs?: number },
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = extra?.status;
    this.hint = extra?.hint;
    this.retryAfterMs = extra?.retryAfterMs;
  }
}

/** Presentation copy is per-code, never per-exception (security pass). */
const COPY: Record<AppErrorCode, { title: string; body: string }> = {
  offline: {
    title: "You're offline",
    body: 'Showing the last available information. Check your connection and try again.',
  },
  timeout: {
    title: 'This is taking too long',
    body: 'The district system did not respond in time. Please try again.',
  },
  unauthorized: {
    title: 'Session expired',
    body: 'Please sign in again to continue.',
  },
  forbidden: {
    title: "You don't have access",
    body: 'This information is not available for your account.',
  },
  'not-found': {
    title: 'Not available',
    body: 'This item is no longer available.',
  },
  'rate-limited': {
    title: 'Too many requests',
    body: 'The district system is busy. Please wait a moment and try again.',
  },
  conflict: {
    title: 'Out of date',
    body: 'This information changed while you were viewing it. Please refresh and try again.',
  },
  maintenance: {
    title: 'Under maintenance',
    body: 'The district system is temporarily down for maintenance. Please try again later.',
  },
  validation: {
    title: 'Some information could not be loaded',
    body: 'Part of this page is unavailable right now.',
  },
  server: {
    title: 'District system unavailable',
    body: 'The district system is temporarily unavailable. Please try again.',
  },
  config: {
    title: 'Configuration problem',
    body: 'The app is not configured for this data source.',
  },
  unknown: {
    title: 'Something went wrong',
    body: 'Please try again.',
  },
};

export function errorCode(e: unknown): AppErrorCode {
  if (typeof e === 'object' && e !== null && 'code' in e) {
    const c = (e as AppErrorShape).code;
    if (c && c in COPY) return c;
  }
  return 'unknown';
}

/** Code-based copy only — raw exception text is never surfaced (security pass). */
export function friendlyError(e: unknown): { title: string; body: string } {
  const { title, body } = COPY[errorCode(e)];
  return { title, body };
}

/**
 * Map HTTP status to the error taxonomy (fetch client, item 43 + security
 * pass): 408/abort → timeout, 409 → conflict, 429 → rate-limited,
 * 503 → maintenance.
 */
export function codeFromStatus(status: number): AppErrorCode {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not-found';
  if (status === 408) return 'timeout';
  if (status === 409) return 'conflict';
  if (status === 429) return 'rate-limited';
  if (status === 503) return 'maintenance';
  if (status >= 500) return 'server';
  if (status >= 400) return 'validation';
  return 'unknown';
}
