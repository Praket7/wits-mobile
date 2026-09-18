import { blockMinutes, classifySchedule } from './schedule';

// Bell schedule mirroring the fixture (items 53, 77–78).
const BLOCKS = [
  { period: 1, startTime: '8:05 AM', endTime: '8:47 AM', attended: null },
  { period: 2, startTime: '8:52 AM', endTime: '9:34 AM', attended: null },
  { period: 3, startTime: '10:05 AM', endTime: '10:47 AM', attended: null },
];

describe('blockMinutes', () => {
  it('computes duration from clock labels', () => {
    expect(blockMinutes('8:05 AM', '8:47 AM')).toBe(42);
    expect(blockMinutes('12:18 PM', '1:00 PM')).toBe(42);
  });

  it('returns null for unparseable or inverted ranges', () => {
    expect(blockMinutes('9:00 AM', '8:00 AM')).toBeNull();
    expect(blockMinutes('garbage', '8:47 AM')).toBeNull();
  });
});

describe('classifySchedule (item 78)', () => {
  it('detects before school with minutes until first block', () => {
    const phase = classifySchedule(BLOCKS, 7 * 60 + 30);
    expect(phase.kind).toBe('before-school');
    if (phase.kind === 'before-school') expect(phase.minutesUntil).toBe(35);
  });

  it('detects in-class with minutes left', () => {
    const phase = classifySchedule(BLOCKS, 8 * 60 + 20);
    expect(phase.kind).toBe('in-class');
    if (phase.kind === 'in-class') {
      expect(phase.currentBlock.period).toBe(1);
      expect(phase.minutesLeft).toBe(27);
      expect(phase.nextBlock?.period).toBe(2);
    }
  });

  it('detects passing period between blocks', () => {
    const phase = classifySchedule(BLOCKS, 8 * 60 + 50); // 5 min before P2
    expect(phase.kind).toBe('passing-period');
    if (phase.kind === 'passing-period') {
      expect(phase.nextBlock.period).toBe(2);
      expect(phase.minutesUntil).toBe(2);
    }
  });

  it('detects day finished after last block', () => {
    expect(classifySchedule(BLOCKS, 15 * 60).kind).toBe('day-finished');
    expect(classifySchedule([], 10 * 60).kind).toBe('day-finished');
  });

  it('falls back to attended marker when clock is unparseable', () => {
    const blocks = [
      { period: 1, startTime: 'X', endTime: 'Y', attended: 'attended' as const },
      { period: 2, startTime: 'X', endTime: 'Y', attended: 'upcoming' as const },
    ];
    const phase = classifySchedule(blocks, null);
    expect(phase.kind).toBe('in-class');
    if (phase.kind === 'in-class') expect(phase.currentBlock.period).toBe(2);
  });
});
