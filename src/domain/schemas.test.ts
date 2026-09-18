import {
  assignmentStatusSchema,
  attendanceStatusSchema,
  eventSourceSchema,
  assignmentSchema,
  calendarEventSchema,
} from './schemas';

describe('attendanceStatusSchema', () => {
  it('accepts all four statuses', () => {
    for (const s of ['present', 'tardy', 'absent', 'early-dismissal']) {
      expect(attendanceStatusSchema.parse(s)).toBe(s);
    }
  });
  it('rejects unknown status', () => {
    expect(() => attendanceStatusSchema.parse('excused')).toThrow();
  });
});

describe('assignmentStatusSchema', () => {
  it('accepts every planned status', () => {
    for (const s of ['upcoming', 'missing', 'submitted', 'graded', 'no-due-date']) {
      expect(assignmentStatusSchema.parse(s)).toBe(s);
    }
  });
});

describe('eventSourceSchema', () => {
  it('accepts district, school, guidance, club, athletics, course', () => {
    for (const s of ['district', 'school', 'guidance', 'club', 'athletics', 'course']) {
      expect(eventSourceSchema.parse(s)).toBe(s);
    }
  });
});

describe('assignmentSchema', () => {
  it('defaults source to district', () => {
    const a = assignmentSchema.parse({
      id: 'a1',
      courseId: 'c1',
      courseName: 'AP Chemistry',
      title: 'Lab',
      description: '',
      dueDate: null,
      dueTime: null,
      type: 'Homework',
      category: 'Labs',
      points: 50,
      earnedPoints: null,
      status: 'upcoming',
      gradedDate: null,
    });
    expect(a.source).toBe('district');
    expect(a.attachments).toEqual([]);
  });
  it('rejects a missing required field', () => {
    expect(() =>
      assignmentSchema.parse({
        id: 'a2', courseId: 'c1', courseName: 'X', title: 'Y',
        dueDate: null, dueTime: null, type: 'T', category: 'C',
        points: 10, earnedPoints: null, status: 'upcoming',
      })
    ).toThrow();
  });
});

describe('calendarEventSchema', () => {
  it('requires source, audience, sourceLabel on every event', () => {
    const e = calendarEventSchema.parse({
      id: 'e1', title: 'College Fair', start: '2026-09-18T13:00:00', end: null,
      location: 'Main Gym', category: 'Guidance', source: 'guidance',
      audience: 'families', sourceLabel: 'Guidance Office',
    });
    expect(e.audience).toBe('families');
    expect(e.sourceLabel).toBe('Guidance Office');
  });
});
