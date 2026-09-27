import { dueLabel, formatGradeColor, isValidIsoDate, scoreLabel } from './format';

describe('formatGradeColor', () => {
  it('uses success color for 90+', () => {
    expect(formatGradeColor(92)).toBe('#137333');
  });
  it('uses warning color for 80-89', () => {
    expect(formatGradeColor(85)).toBe('#A15C00');
  });
  it('uses danger color below 80', () => {
    expect(formatGradeColor(70)).toBe('#B5121B');
  });
});

describe('dueLabel', () => {
  it('labels tomorrow', () => {
    expect(dueLabel('2026-09-18')).toBe('Due Tomorrow');
  });
  it('handles no due date', () => {
    expect(dueLabel(null)).toBe('No Due Date');
  });
});

describe('scoreLabel', () => {
  it('formats earned/total', () => {
    expect(scoreLabel(92, 100)).toBe('92 / 100');
  });
  it('returns null when ungraded', () => {
    expect(scoreLabel(null, 100)).toBeNull();
  });
});

describe('isValidIsoDate', () => {
  it.each(['2024-02-29', '2026-09-23'])('accepts real calendar date %s', (value) => {
    expect(isValidIsoDate(value)).toBe(true);
  });
  it.each(['2026-02-29', '2026-02-31', '2026-13-01', '26-09-23', ''])('rejects invalid date %s', (value) => {
    expect(isValidIsoDate(value)).toBe(false);
  });
});
