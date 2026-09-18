import { schoolDayInfo } from './abDay';

describe('schoolDayInfo (item 29 / test item 53)', () => {
  it('anchors Thursday Sep 17, 2026 as B Day', () => {
    expect(schoolDayInfo(new Date(2026, 8, 17)).label).toBe('B Day');
  });

  it('alternates across consecutive instructional days', () => {
    expect(schoolDayInfo(new Date(2026, 8, 18)).label).toBe('A Day'); // Fri
    expect(schoolDayInfo(new Date(2026, 8, 21)).label).toBe('B Day'); // Mon
  });

  it('marks weekends as no-school', () => {
    const sat = schoolDayInfo(new Date(2026, 8, 19));
    expect(sat.instructionalDay).toBe(false);
    expect(sat.label).toBe('No School');
    expect(sat.rotation).toBeNull();
  });

  it('skips holidays so the rotation does not drift', () => {
    // Labor Day (mock) is Monday Sep 7; the following Tuesday must continue
    // the rotation as if the holiday did not exist.
    const before = schoolDayInfo(new Date(2026, 8, 4)); // Fri Sep 4
    const after = schoolDayInfo(new Date(2026, 8, 8)); // Tue Sep 8
    expect(before.instructionalDay).toBe(true);
    expect(after.instructionalDay).toBe(true);
    // With exactly one instructional gap (Mon Sep 7 skipped), rotations match.
    expect(after.rotation).toBe(before.rotation);
  });
});
