/**
 * Demo/real clock seam (audit P1): format helpers and due labels share the
 * clock abstraction instead of freezing a literal fixture date.
 */
import { now } from './clock';

export const courseTeacherLabel = (teachers: string[]): string => teachers.join(', ') || 'Teacher unavailable';
export const courseRoomLabel = (rooms: string[]): string => rooms.join(', ') || 'Room unavailable';

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

/** True only for a real Gregorian date written as YYYY-MM-DD. */
export function isValidIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return date.getUTCFullYear() === Number(year)
    && date.getUTCMonth() === Number(month) - 1
    && date.getUTCDate() === Number(day);
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

export function dueLabel(dueDate: string | null): string {
  if (!dueDate) return 'No Due Date';
  const d = new Date(dueDate + 'T12:00:00');
  // Demo-clock seam (audit P1): labels derive from the app clock so HTTP mode
  // with EXPO_PUBLIC_DEMO_MODE=false reflects the real date, not the fixture date.
  const today = now();
  const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  const diff = Math.round((d.getTime() - todayMid.getTime()) / 86_400_000);
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
