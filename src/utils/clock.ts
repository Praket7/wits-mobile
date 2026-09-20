/**
 * Demo clock (items 184–186): all fixture-relative time derives from
 * DEMO_NOW so screenshots stay coherent regardless of the real date.
 *
 * Demo semantics are env-configured (P0.20), never __DEV__-coupled: a
 * preview/release build running synthetic data must not suddenly render
 * September 2026 fixtures against the real clock.
 *  - EXPO_PUBLIC_DEMO_MODE=true (default)  → frozen demo clock
 *  - EXPO_PUBLIC_DEMO_MODE=false           → real clock (production)
 *  - EXPO_PUBLIC_DEMO_NOW=ISO              → overrides the frozen instant
 */
export const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE !== 'false';

export const DEMO_NOW = process.env.EXPO_PUBLIC_DEMO_NOW
  ? new Date(process.env.EXPO_PUBLIC_DEMO_NOW)
  : new Date('2026-09-17T13:20:00');

export function now(): Date {
  return DEMO_MODE ? DEMO_NOW : new Date();
}
