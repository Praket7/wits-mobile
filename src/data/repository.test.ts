import { MockWitsRepository } from './mockRepository';

const repo = new MockWitsRepository();

describe('MockWitsRepository', () => {
  it('returns a validated user per role', async () => {
    const student = await repo.getMe('student');
    expect(student.role).toBe('student');
    const parent = await repo.getMe('parent');
    expect(parent.role).toBe('parent');
    const teacher = await repo.getMe('teacher');
    expect(teacher.role).toBe('teacher');
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
    const today = await repo.getToday('stu-praket');
    expect(today.schedule.length).toBe(6);
    expect(today.unreadMessagesCount).toBe(3);
    expect(today.dayLabel).toBe('B Day');
  });

  it('includes edge-case assignments: missing + no-due-date + graded', async () => {
    const assignments = await repo.getAssignments('stu-praket');
    expect(assignments.some((a) => a.status === 'missing')).toBe(true);
    expect(assignments.some((a) => a.status === 'no-due-date')).toBe(true);
    expect(assignments.some((a) => a.status === 'graded')).toBe(true);
  });

  it('includes a google-classroom sourced assignment', async () => {
    const assignments = await repo.getAssignments('stu-praket');
    expect(assignments.some((a) => a.source === 'google-classroom')).toBe(true);
  });

  it('includes tardy + absent attendance records', async () => {
    const records = await repo.getAttendance('stu-praket');
    expect(records.some((r) => r.status === 'tardy')).toBe(true);
    expect(records.some((r) => r.status === 'absent')).toBe(true);
  });

  it('includes unread and read message threads', async () => {
    const threads = await repo.getMessages();
    expect(threads.some((t) => t.unread)).toBe(true);
    expect(threads.some((t) => !t.unread)).toBe(true);
  });

  it('includes club and guidance calendar events', async () => {
    const events = await repo.getCalendar('stu-praket');
    expect(events.some((e) => e.source === 'club')).toBe(true);
    expect(events.some((e) => e.source === 'guidance')).toBe(true);
  });
});
