/**
 * Demo clock (items 184–186): all fixture-relative time derives from
 * DEMO_NOW so screenshots stay coherent regardless of the real date.
 * Production replaces this with the real clock via now().
 */
export const DEMO_NOW = new Date('2026-09-17T13:20:00');

export function now(): Date {
  return __DEV__ ? DEMO_NOW : new Date();
}
