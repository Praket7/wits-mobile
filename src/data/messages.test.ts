import { MockWitsRepository } from './mockRepository';

const repo = new MockWitsRepository();

// The prototype student's enrolled classes (mirrors fixtures.courses).
const STUDENT_VIEWER = {
  role: 'student' as const,
  userId: 'stu-alex',
  courseIds: ['c-chem', 'c-ushist', 'c-lang', 'c-precalc', 'c-physics', 'c-psych'],
};

const ANNOUNCEMENT = {
  courseIds: ['c-chem', 'c-forensic'],
  subject: 'Safety Goggles Required',
  body: 'Bring your own safety goggles to every lab starting Monday. No goggles, no lab.',
  authorId: 'tea-morgan',
  authorName: 'Mr. Morgan',
};

describe('Multi-class announcement fan-out', () => {
  it('creates one unread thread per targeted class', async () => {
    const created = await repo.sendAnnouncement(ANNOUNCEMENT);
    expect(created).toBe(2);

    const teacher = { role: 'teacher' as const, userId: 'tea-morgan' };
    const sent = await repo.getMessages(teacher);
    const chem = sent.find((t) => t.subject === 'Safety Goggles Required' && t.courseIds[0] === 'c-chem');
    const forensic = sent.find((t) => t.subject === 'Safety Goggles Required' && t.courseIds[0] === 'c-forensic');
    expect(chem).toBeDefined();
    expect(forensic).toBeDefined();
    // The teacher's own sent mail is never unread to them (by design); the
    // recipients' unread badges are asserted in the next test.
    expect(chem!.unread).toBe(false);
    expect(chem!.authorId).toBe('tea-morgan');
  });

  it('delivers the announcement to an enrolled student as real unread mail', async () => {
    const inbox = await repo.getMessages(STUDENT_VIEWER);
    const chem = inbox.find((t) => t.subject === 'Safety Goggles Required' && t.courseIds[0] === 'c-chem');
    expect(chem).toBeDefined();
    expect(chem!.unread).toBe(true);
    expect(chem!.messages[0].body).toContain('safety goggles');
    expect(chem!.messages[0].sentByMe).toBe(false);
  });

  it('delivers to a parent of an enrolled child', async () => {
    const parentViewer = {
      role: 'parent' as const,
      userId: 'par-williams',
      studentId: 'stu-alex',
      courseIds: STUDENT_VIEWER.courseIds,
    };
    const inbox = await repo.getMessages(parentViewer);
    expect(inbox.some((t) => t.subject === 'Safety Goggles Required')).toBe(true);
  });

  it('never delivers a class-targeted thread to students outside that class', async () => {
    const outsider = { role: 'student' as const, userId: 'stu-other', courseIds: ['c-band'] };
    const inbox = await repo.getMessages(outsider);
    expect(inbox.some((t) => t.subject === 'Safety Goggles Required')).toBe(false);
    // School-wide threads (no courseIds) still reach them.
    expect(inbox.some((t) => t.subject === 'College Fair Next Week')).toBe(true);
  });

  it('teacher mailbox contains only threads they authored', async () => {
    const teacher = { role: 'teacher' as const, userId: 'tea-morgan' };
    const sent = await repo.getMessages(teacher);
    expect(sent.length).toBeGreaterThan(0);
    expect(sent.every((t) => t.authorId === 'tea-morgan')).toBe(true);
  });

  it('read state is per viewer: parent reading never clears the student badge', async () => {
    const parentViewer = {
      role: 'parent' as const,
      userId: 'par-williams',
      studentId: 'stu-alex',
      courseIds: STUDENT_VIEWER.courseIds,
    };
    await repo.markThreadRead('t1', 'par-williams');
    const parentInbox = await repo.getMessages(parentViewer);
    const studentInbox = await repo.getMessages(STUDENT_VIEWER);
    expect(parentInbox.find((t) => t.id === 't1')!.unread).toBe(false);
    expect(studentInbox.find((t) => t.id === 't1')!.unread).toBe(true);
  });

  it('rejects announcements with no classes selected', async () => {
    await expect(
      repo.sendAnnouncement({ ...ANNOUNCEMENT, courseIds: [] }),
    ).rejects.toThrow('at least one class');
  });
});

describe('WITSMail forward', () => {
  const base = {
    sourceThreadId: 't1',
    quotedFrom: 'Mr. Morgan',
    quotedDateLabel: 'Thu, Sep 17, 2026',
    quotedSubject: 'Lab Reminder',
    quotedBody: 'Bring your lab notebook and safety goggles.',
    note: 'FYI — see the goggles line.',
    from: { senderId: 'stu-alex', senderName: 'Alex Williams' },
  };

  it('creates real unread mail for a staff recipient with quoted provenance', async () => {
    const created = await repo.forwardMessage({
      ...base,
      to: [{ kind: 'user', userId: 'cou-ramirez', label: 'Ms. Ramirez' }],
    });
    expect(created).toBe(1);

    // The recipient (guidance counselor) sees their own unread copy.
    const counselor = { role: 'teacher' as const, userId: 'cou-ramirez' };
    // Non-authoring teachers only see threads they authored, so the forward
    // addressed to them must carry their id as author.
    const inbox = await repo.getMessages(counselor);
    const fwd = inbox.find((t) => t.subject.startsWith('Fwd:'));
    expect(fwd).toBeDefined();
    expect(fwd!.unread).toBe(true);
    expect(fwd!.messages[0].body).toContain('— Forwarded message —');
    expect(fwd!.messages[0].body).toContain('From: Mr. Morgan');
    expect(fwd!.messages[0].body).toContain('> Bring your lab notebook');
    expect(fwd!.messages[0].body).toContain('FYI — see the goggles line.');
  });

  it('shows each recipient only themselves as the addressee (no list leakage)', async () => {
    await repo.forwardMessage({
      ...base,
      quotedSubject: 'Privacy Check',
      to: [{ kind: 'user', userId: 'cou-ramirez', label: 'Ms. Ramirez' }],
    });
    const counselor = await repo.getMessages({ role: 'teacher', userId: 'cou-ramirez' });
    const fwd = counselor.find((t) => t.subject === 'Fwd: Privacy Check');
    expect(fwd?.participants).toBe('Ms. Ramirez');
  });

  it('teacher forwarding to a class reaches an enrolled student as unread mail', async () => {
    const created = await repo.forwardMessage({
      ...base,
      quotedSubject: 'Class Forward',
      note: '',
      from: { senderId: 'tea-morgan', senderName: 'Mr. Morgan' },
      to: [{ kind: 'class', courseId: 'c-chem', label: 'AP Chemistry – Period 3' }],
    });
    expect(created).toBe(1);

    const inbox = await repo.getMessages(STUDENT_VIEWER);
    // Mail semantics: the forward joins the class's existing conversation, so
    // it arrives as the latest message in that thread.
    const fwd = inbox.find((t) => t.id.startsWith('t-an-') || t.messages.some((m) => m.body.includes('> Bring your lab notebook')));
    expect(fwd).toBeDefined();
    expect(fwd!.unread).toBe(true);
    const latest = fwd!.messages[fwd!.messages.length - 1];
    expect(latest.body).toContain('> Bring your lab notebook');
  });

  it('rejects forwards with no recipients', async () => {
    await expect(repo.forwardMessage({ ...base, to: [] })).rejects.toThrow('at least one recipient');
  });

  it('staff directory backs the forward picker', async () => {
    const dir = await repo.getStaffDirectory();
    expect(dir.length).toBeGreaterThan(0);
    expect(dir.every((s) => s.id && s.name && s.title)).toBe(true);
  });
});
