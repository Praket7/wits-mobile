import { formatEventTimeRange, formatIsoDateLabel, formatIsoDateShort, formatTime } from './format';

describe('date grouping helpers', () => {
  it('formats ISO date labels for assignment due rows', () => {
    expect(formatIsoDateLabel('2026-09-18')).toContain('Sep 18, 2026');
  });

  it('formats short labels for attendance log rows', () => {
    expect(formatIsoDateShort('2026-09-16')).toContain('Sep 16');
  });

  it('formats message times as 12-hour clock', () => {
    const label = formatTime('2026-09-17T10:24:00');
    expect(label).toMatch(/10:24/);
  });

  it('formats event ranges with an end', () => {
    const range = formatEventTimeRange('2026-09-18T13:00:00', '2026-09-18T16:00:00');
    expect(range).toMatch(/1:00/);
    expect(range).toMatch(/4:00/);
  });

  it('formats event without end as single time', () => {
    const range = formatEventTimeRange('2026-09-25T19:00:00', null);
    expect(range).toMatch(/7:00/);
    expect(range).not.toMatch(/–/);
  });
});
