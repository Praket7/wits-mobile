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
    // the rotation as if the holiday did not exist — i.e. Sep 4 and Sep 8 are
    // CONSECUTIVE instructional days and must ALTERNATE (item 29 semantics).
    const before = schoolDayInfo(new Date(2026, 8, 4)); // Fri Sep 4
    const after = schoolDayInfo(new Date(2026, 8, 8)); // Tue Sep 8
    expect(before.instructionalDay).toBe(true);
    expect(after.instructionalDay).toBe(true);
    expect(before.rotation).toBe('B'); // one flip after the anchor (B) going back
    expect(after.rotation).toBe('A'); // one flip from Fri Sep 4 (B)
  });

  it('is timezone-stable: same rotation for the same calendar day in any TZ', () => {
    // Regression: the previous implementation mixed UTC midnights with local
    // day reads and returned different rotations under TZ=UTC vs local.
    const d = new Date(2026, 8, 8); // Tue Sep 8 — the day that drifted
    expect(schoolDayInfo(d).rotation).toBe('A');
  });
});
