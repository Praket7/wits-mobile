export function formatGradeColor(percent: number | null): string {
  if (percent == null) return '#5D6673';
  if (percent >= 90) return '#137333';
  if (percent >= 80) return '#A15C00';
  return '#B5121B';
}

export function formatGradeBg(percent: number | null): string {
  if (percent == null) return '#E2E5E9';
  if (percent >= 90) return '#E6F4EA';
  if (percent >= 80) return '#FEF7E0';
  return '#FCE8E6';
}

export function formatIsoDateLabel(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? 'T12:00:00' : ''));
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Long date with weekday — "Thursday, September 17, 2026" (item 72). */
export function formatDateLong(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Medium date — "Sep 17, 2026". */
export function formatDateMedium(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Short date with weekday — "Thu, Sep 17". */
export function formatDateShortWeekday(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/** Time of day — "3:00 PM" (item 72). */
export function formatClock(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/** Date + time — "Thu, Sep 17 · 3:00 PM". */
export function formatDateTime(date: Date): string {
  return `${formatDateShortWeekday(date)} · ${formatClock(date)}`;
}

/** Formal date label — "September 17, 2026". */
export function formatDateFormal(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function formatIsoDateShort(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? 'T12:00:00' : ''));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function formatEventTimeRange(start: string, end: string | null): string {
  const s = formatTime(start);
  if (!end) return s;
  return `${s} – ${formatTime(end)}`;
}

// Deterministic A/B day rotation for the prototype (anchored to a known B Day).
const AB_ANCHOR = new Date('2026-09-17T12:00:00'); // Thursday Sep 17, 2026 = B Day
export function aOrBDay(date: Date): 'A Day' | 'B Day' {
  const d0 = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const a0 = Date.UTC(AB_ANCHOR.getFullYear(), AB_ANCHOR.getMonth(), AB_ANCHOR.getDate());
  const diffDays = Math.round((d0 - a0) / 86_400_000);
  return diffDays % 2 === 0 ? 'B Day' : 'A Day';
}

export function dueLabel(dueDate: string | null): string {
  if (!dueDate) return 'No Due Date';
  const d = new Date(dueDate + 'T12:00:00');
  const today = new Date('2026-09-17T12:00:00');
  const diff = Math.round(
    (d.getTime() - today.getTime()) / 86_400_000
  );
  if (diff === 0) return 'Due Today';
  if (diff === 1) return 'Due Tomorrow';
  return `Due ${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`;
}

export function scoreLabel(
  earned: number | null,
  total: number | null
): string | null {
  if (earned == null || total == null) return null;
  return `${earned} / ${total}`;
}
