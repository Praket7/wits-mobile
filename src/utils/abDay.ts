/**
 * A/B day rotation (item 29): accepts no-school days and explicit overrides so
 * the rotation survives holidays. Until WCSD supplies the authoritative
 * calendar, this is labeled mock/prototype logic — the fixture stays the
 * source of truth for screens.
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

function utcDay(y: number, m: number, d: number): number {
  return Date.UTC(y, m, d);
}

export function schoolDayInfo(date: Date): SchoolDayInfo {
  const dow = date.getDay();
  const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
  if (dow === 0 || dow === 6 || EXTRA_NO_SCHOOL.has(iso)) {
    return { instructionalDay: false, rotation: null, scheduleType: 'no-school', label: 'No School' };
  }
  const diffDays = Math.round(
    (utcDay(date.getFullYear(), date.getMonth(), date.getDate()) -
      utcDay(ANCHOR.y, ANCHOR.m, ANCHOR.d)) /
      86_400_000,
  );
  // Count only instructional days between the anchor and the target date.
  let instructional = 0;
  if (diffDays !== 0) {
    const step = diffDays > 0 ? 1 : -1;
    for (let off = step; off !== diffDays + step; off += step) {
      const d = new Date(utcDay(ANCHOR.y, ANCHOR.m, ANCHOR.d + off));
      if (schoolDayInfoShallow(d).instructionalDay) instructional += 1;
    }
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

function schoolDayInfoShallow(date: Date): { instructionalDay: boolean } {
  const dow = date.getDay();
  const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
  return { instructionalDay: dow !== 0 && dow !== 6 && !EXTRA_NO_SCHOOL.has(iso) };
}
