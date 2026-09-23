import { MockWitsRepository } from './mockRepository';

const repo = new MockWitsRepository();

// The prototype student's enrolled classes (mirrors fixtures.courses).
const STUDENT_VIEWER = {
  role: 'student' as const,
  userId: 'stu-alex',
  courseIds: ['c-chem', 'c-ushist', 'c-lang', 'c-precalc', 'c-physics', 'c-psych'],
};

describe('MockWitsRepository', () => {
  it('returns a validated user per session actor (server-derived identity)', async () => {
    // setActor is the prototype stand-in for the bearer session (security pass).
    repo.setActor({ userId: 'stu-alex', role: 'student' });
    const student = await repo.getMe();
    expect(student.role).toBe('student');
    repo.setActor({ userId: 'par-williams', role: 'parent' });
    const parent = await repo.getMe();
    expect(parent.role).toBe('parent');
    repo.setActor({ userId: 'tea-morgan', role: 'teacher' });
    const teacher = await repo.getMe();
    expect(teacher.role).toBe('teacher');
    repo.setActor({ userId: 'stu-alex', role: 'student' });
  });

  it('returns multiple students for the parent child switcher', async () => {
    const students = await repo.getStudents();
    expect(students.length).toBeGreaterThanOrEqual(2);
  });

  it('throws on unknown course (error state path)', async () => {
    await expect(repo.getCourse('nope')).rejects.toThrow('Course not found');
  });

  it('throws on unknown assignment', async () => {
    await expect(repo.getAssignment('nope')).rejects.toThrow('Assignment not found');
  });

  it('serves a Today payload with schedule and counts', async () => {
    const today = await repo.getToday('stu-alex');
    expect(today.schedule.length).toBe(6);
    expect(today.unreadMessagesCount).toBe(3);
    expect(today.dayLabel).toBe('B Day');
  });

  it('includes edge-case assignments: missing + no-due-date + graded', async () => {
    const assignments = await repo.getAssignments('stu-alex');
    expect(assignments.some((a) => a.status === 'missing')).toBe(true);
    expect(assignments.some((a) => a.status === 'no-due-date')).toBe(true);
    expect(assignments.some((a) => a.status === 'graded')).toBe(true);
  });

  it('includes a google-classroom sourced assignment', async () => {
    const assignments = await repo.getAssignments('stu-alex');
    expect(assignments.some((a) => a.source === 'google-classroom')).toBe(true);
  });

  it('includes tardy + absent attendance records', async () => {
    const records = await repo.getAttendance('stu-alex');
    expect(records.some((r) => r.status === 'tardy')).toBe(true);
    expect(records.some((r) => r.status === 'absent')).toBe(true);
  });

  // Audit interaction pass: per-class stats come from the repository, so the
  // Attendance screen has no CLASS_STATS table and no fabricated fallbacks.
  it('serves an attendance summary with overall + per-class stats', async () => {
    const summary = await repo.getAttendanceSummary('stu-alex');
    expect(summary.overall.attendanceRate).toBe(98);
    expect(summary.overall.absences).toBe(2);
    expect(summary.byClass.length).toBeGreaterThan(0);
    const chem = summary.byClass.find((row) => row.courseId === 'c-chem');
    expect(chem?.absences).toBe(0);
    expect(chem?.attendanceRate).toBe(100);
  });

  it('returns an all-null summary for an unknown student (no fake metrics)', async () => {
    const summary = await repo.getAttendanceSummary('stu-unknown');
    expect(summary.overall.attendanceRate).toBeNull();
    expect(summary.overall.absences).toBeNull();
    expect(summary.byClass).toEqual([]);
  });

  it('serves per-class attendance rows scoped to the course', async () => {
    const physics = await repo.getClassAttendance('c-physics');
    expect(physics.length).toBeGreaterThan(0);
    expect(physics.every((r) => r.courseId === 'c-physics')).toBe(true);
    // A class with no incidents returns rows, not fabricated data.
    const chem = await repo.getClassAttendance('c-chem');
    expect(chem).toEqual([]);
  });

  it('serves course announcements from the repository (no screen-local copy)', async () => {
    const announcements = await repo.getCourseAnnouncements('c-chem');
    expect(announcements.length).toBeGreaterThan(0);
    expect(announcements[0].author).toBe('Mr. Morgan');
    // Courses without posts return an empty list, not synthetic filler.
    expect(await repo.getCourseAnnouncements('c-psych')).toEqual([]);
  });

  it('includes unread and read message threads', async () => {
    const threads = await repo.getMessages(STUDENT_VIEWER);
    expect(threads.some((t) => t.unread)).toBe(true);
    expect(threads.some((t) => !t.unread)).toBe(true);
  });

  it('includes club and guidance calendar events', async () => {
    const events = await repo.getCalendar('stu-alex');
    expect(events.some((e) => e.source === 'club')).toBe(true);
    expect(events.some((e) => e.source === 'guidance')).toBe(true);
  });
});
