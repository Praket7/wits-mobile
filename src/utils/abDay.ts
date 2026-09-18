/**
 * A/B day rotation (item 29): accepts no-school days and explicit overrides so
 * the rotation survives holidays. Until WCSD supplies the authoritative
 * calendar, this is labeled mock/prototype logic — the fixture stays the
 * source of truth for screens.
 *
 * Timezone note: all arithmetic runs on UTC day numbers derived from the
 * input's LOCAL calendar date (Y/M/D), and intermediate days are inspected
 * with getUTCDay()/ISO formatting — never mixing local reads with UTC
 * midnights. This keeps results identical in every timezone (a previous
 * version mixed the two and returned different rotations in UTC vs local).
 */
export type SchoolDayInfo = {
  instructionalDay: boolean;
  rotation: 'A' | 'B' | null;
  scheduleType: 'regular' | 'early-dismissal' | 'exam' | 'special' | 'no-school';
  label: string;
};

// Thursday Sep 17, 2026 is the fixture's B Day anchor.
const ANCHOR: { y: number; m: number; d: number; rotation: 'A' | 'B' } = {
  y: 2026,
  m: 8,
  d: 17,
  rotation: 'B',
};

/** Prototype no-school days (weekends always; holidays extend this set). */
const EXTRA_NO_SCHOOL = new Set(['2026-09-07']); // Labor Day (mock)

const DAY_MS = 86_400_000;

/** UTC day number for a date's local calendar day. */
function utcDayNumber(y: number, m: number, d: number): number {
  return Date.UTC(y, m, d);
}

/** Weekday + ISO date for a UTC day number (pure UTC reads — TZ-safe). */
function inspect(dayMs: number): { dow: number; iso: string } {
  const dt = new Date(dayMs);
  return { dow: dt.getUTCDay(), iso: dt.toISOString().slice(0, 10) };
}

function isInstructionalDay(dayMs: number): boolean {
  const { dow, iso } = inspect(dayMs);
  return dow !== 0 && dow !== 6 && !EXTRA_NO_SCHOOL.has(iso);
}

export function schoolDayInfo(date: Date): SchoolDayInfo {
  const targetMs = utcDayNumber(date.getFullYear(), date.getMonth(), date.getDate());
  const anchorMs = utcDayNumber(ANCHOR.y, ANCHOR.m, ANCHOR.d);

  if (!isInstructionalDay(targetMs)) {
    return { instructionalDay: false, rotation: null, scheduleType: 'no-school', label: 'No School' };
  }

  // Count instructional days in [min, max] between anchor and target, minus
  // the anchor itself: each such day after the anchor flips the rotation.
  const diffDays = Math.round((targetMs - anchorMs) / DAY_MS);
  const step = diffDays >= 0 ? 1 : -1;
  let instructional = 0;
  for (let off = step; off !== diffDays + step; off += step) {
    if (isInstructionalDay(anchorMs + off * DAY_MS)) instructional += 1;
  }

  const anchorRotation: 'A' | 'B' = ANCHOR.rotation;
  const flip = instructional % 2 === 1;
  const rotation: 'A' | 'B' = flip ? (anchorRotation === 'A' ? 'B' : 'A') : anchorRotation;
  return {
    instructionalDay: true,
    rotation,
    scheduleType: 'regular',
    label: `${rotation} Day`,
  };
}

/** Convenience wrapper for headers that only need the label. */
export function schoolDayLabel(date: Date): string {
  return schoolDayInfo(date).label;
}
