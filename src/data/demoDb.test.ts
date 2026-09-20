import { MockWitsRepository } from './mockRepository';
import { rotationForDate } from './demo/db';

/**
 * Relational demo database (plan §6, P0.2): per-student scoping, per-class
 * rosters, scoped monthly attendance, absence reports, and resetDemo.
 */
describe('demo database scoping', () => {
  it('returns different courses per student', async () => {
    const repo = new MockWitsRepository();
    const praket = await repo.getCourses('stu-praket');
    const anika = await repo.getCourses('stu-anika');
    expect(praket.length).toBeGreaterThan(0);
    expect(anika.length).toBeGreaterThan(0);
    expect(praket.map((c) => c.id).sort()).not.toEqual(anika.map((c) => c.id).sort());
    expect(anika.map((c) => c.name)).toContain('Math 8');
  });

  it('returns different assignments per student', async () => {
    const repo = new MockWitsRepository();
    const praket = await repo.getAssignments('stu-praket');
    const anika = await repo.getAssignments('stu-anika');
    expect(praket.map((a) => a.id).sort()).not.toEqual(anika.map((a) => a.id).sort());
  });

  it('returns different attendance per student', async () => {
    const repo = new MockWitsRepository();
    const praket = await repo.getAttendance('stu-praket');
    const anika = await repo.getAttendance('stu-anika');
    expect(praket.map((r) => r.id).sort()).not.toEqual(anika.map((r) => r.id).sort());
  });

  it('returns unknown-student data as empty, never another student\'s data', async () => {
    const repo = new MockWitsRepository();
    expect(await repo.getCourses('stu-unknown')).toEqual([]);
    expect(await repo.getAssignments('stu-unknown')).toEqual([]);
    expect(await repo.getAttendance('stu-unknown')).toEqual([]);
  });

  it('throws for unknown teacher class rosters instead of returning a shared roster', async () => {
    const repo = new MockWitsRepository();
    await expect(repo.getTeacherRoster('c-nope')).rejects.toThrow('Unknown class');
    const chem = await repo.getTeacherRoster('c-chem');
    const chem2 = await repo.getTeacherRoster('c-chem2');
    expect(chem.map((s) => s.id).sort()).not.toEqual(chem2.map((s) => s.id).sort());
    // Repository-derived missing counts exist on every entry.
    for (const s of [...chem, ...chem2]) {
      expect(typeof s.missingCount).toBe('number');
      expect(s.missingCount).toBeGreaterThanOrEqual(0);
    }
  });

  it('scopes monthly attendance by student and month', async () => {
    const repo = new MockWitsRepository();
    const sept = await repo.getMonthlyAttendance({ studentId: 'stu-praket', year: 2026, month: 9 });
    const anikaSept = await repo.getMonthlyAttendance({ studentId: 'stu-anika', year: 2026, month: 9 });
    expect(sept['16']).toBe('tardy'); // primary student's seeded tardy
    expect(anikaSept['14']).toBe('absent'); // anika's medical absence
    expect(anikaSept['16']).toBeUndefined(); // anika was present that day
    // An unseeded month derives from records (empty here) without throwing.
    const october = await repo.getMonthlyAttendance({ studentId: 'stu-praket', year: 2026, month: 10 });
    expect(typeof october).toBe('object');
  });

  it('stores and lists absence reports per student', async () => {
    const repo = new MockWitsRepository();
    await repo.submitAbsenceReport({
      studentId: 'stu-praket',
      date: '2026-09-21',
      type: 'full-day',
      reason: 'Illness',
      note: 'Fever since Sunday',
    });
    const reports = await repo.getAbsenceReports('stu-praket');
    expect(reports).toHaveLength(1);
    expect(reports[0].status).toBe('submitted');
    expect(reports[0].note).toBe('Fever since Sunday');
    expect(await repo.getAbsenceReports('stu-anika')).toEqual([]);
  });

  it('resetDemo restores pristine seed state', async () => {
    const repo = new MockWitsRepository();
    await repo.submitAbsenceReport({ studentId: 'stu-praket', date: '2026-09-22', type: 'full-day', reason: 'Illness' });
    expect(await repo.getAbsenceReports('stu-praket')).toHaveLength(1);
    await repo.resetDemo();
    expect(await repo.getAbsenceReports('stu-praket')).toEqual([]);
  });

  it('composes per-student Today payloads with live counts', async () => {
    const repo = new MockWitsRepository();
    const praket = await repo.getToday('stu-praket');
    const anika = await repo.getToday('stu-anika');
    expect(praket.schedule.length).toBeGreaterThan(0);
    expect(anika.schedule.length).toBeGreaterThan(0);
    // Counts derive from the relational data, not shared constants.
    expect(praket.assignmentsDueCount).toBeGreaterThan(0);
    expect(anika.unreadMessagesCount).toBeGreaterThanOrEqual(0);
  });

  it('computes the mock A/B rotation excluding weekends and no-school days', () => {
    // Sep 1 2026 (Tuesday) is the first school day → A.
    expect(rotationForDate('2026-09-01')).toBe('A Day');
    // Sep 2 alternates to B.
    expect(rotationForDate('2026-09-02')).toBe('B Day');
    // Labor Day (Sep 7) is a no-school day.
    expect(rotationForDate('2026-09-07')).toBeNull();
    // Weekends are not school days.
    expect(rotationForDate('2026-09-06')).toBeNull();
    // Days before the term start are null.
    expect(rotationForDate('2026-08-31')).toBeNull();
  });
});
