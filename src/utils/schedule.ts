/**
 * Schedule service (items 77–78): school-day logic lives here, not in UI.
 * Student Today renders results; this module computes them. Also the seam for
 * A/B split courses and real district schedules later (items 29, 75, 76, 79).
 */
export type ScheduleBlockLike = {
  period: number;
  startTime: string; // "8:05 AM"
  endTime: string; // "8:47 AM"
  attended?: 'attended' | 'late' | 'upcoming' | null;
};

export type SchedulePhase =
  | { kind: 'before-school'; nextBlock: ScheduleBlockLike | null; minutesUntil: number | null }
  | { kind: 'passing-period'; nextBlock: ScheduleBlockLike; minutesUntil: number }
  | { kind: 'in-class'; currentBlock: ScheduleBlockLike; nextBlock: ScheduleBlockLike | null; minutesLeft: number }
  | { kind: 'day-finished' };

function toMinutes(t: string): number | null {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(t.trim());
  if (!m) return null;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === 'PM') h += 12;
  return h * 60 + Number(m[2]);
}

/** Minutes between two clock labels, or null if unparseable (item 6). */
export function blockMinutes(start: string, end: string): number | null {
  const a = toMinutes(start);
  const b = toMinutes(end);
  if (a == null || b == null || b <= a) return null;
  return b - a;
}

/**
 * Classify "now" against the day's blocks. Passing periods (the gap between
 * one block's end and the next block's start) are distinct from "in class"
 * so the UI can say "Passing period — next class in 5 min" (item 78).
 */
export function classifySchedule(
  blocks: ScheduleBlockLike[],
  nowMinutes: number | null,
): SchedulePhase {
  if (blocks.length === 0) return { kind: 'day-finished' };
  if (nowMinutes == null) {
    // Unparseable clock: fall back to the fixture's attended marker.
    const upcoming = blocks.find((b) => b.attended === 'upcoming');
    if (upcoming) {
      const idx = blocks.indexOf(upcoming);
      return { kind: 'in-class', currentBlock: upcoming, nextBlock: blocks[idx + 1] ?? null, minutesLeft: 0 };
    }
    return { kind: 'day-finished' };
  }

  const first = toMinutes(blocks[0].startTime);
  const last = toMinutes(blocks[blocks.length - 1].endTime);
  if (first != null && nowMinutes < first) {
    return { kind: 'before-school', nextBlock: blocks[0], minutesUntil: first - nowMinutes };
  }
  if (last != null && nowMinutes >= last) return { kind: 'day-finished' };

  for (let i = 0; i < blocks.length; i++) {
    const s = toMinutes(blocks[i].startTime);
    const e = toMinutes(blocks[i].endTime);
    if (s == null || e == null) continue;
    if (nowMinutes >= s && nowMinutes < e) {
      return {
        kind: 'in-class',
        currentBlock: blocks[i],
        nextBlock: blocks[i + 1] ?? null,
        minutesLeft: e - nowMinutes,
      };
    }
    if (nowMinutes < s) {
      // In the gap after the previous block: passing period.
      return { kind: 'passing-period', nextBlock: blocks[i], minutesUntil: s - nowMinutes };
    }
  }
  return { kind: 'day-finished' };
}
