import { z } from 'zod';
import type {
  AnnouncementInput,
  BellPeriod,
  ForwardInput,
  MessageViewer,
  Reminder,
  StaffContact,
  TeacherClass,
  TeacherRosterEntry,
  TeacherTodayPayload,
  WitsRepository,
  AbsenceReportInput,
} from './repository';
import { HttpWitsRepository } from './httpRepository';
import {
  assignmentSchema,
  attendanceRecordSchema,
  calendarEventSchema,
  courseSchema,
  gradeEntrySchema,
  guidanceItemSchema,
  messageThreadSchema,
  resourceLinkSchema,
  studentSchema,
  teacherRosterEntrySchema,
  todayPayloadSchema,
  userSchema,
  type AbsenceReport,
  type Assignment,
  type AttendanceRecord,
  type CalendarEvent,
  type Course,
  type GradeEntry,
  type GuidanceItem,
  type MessageThread,
  type MonthlyAttendance,
  type MonthlyAttendanceQuery,
  type ResourceLink,
  type Student,
  type TodayPayload,
  type User,
} from '@/domain/schemas';
import * as fixtures from './fixtures/data';
import {
  createDemoDatabase,
  monthlyAttendanceFor,
  scheduleFor,
  todayPayloadFor,
  type DemoDatabase,
} from './demo/db';
import { now } from '@/utils/clock';

const parse = <T>(schema: z.ZodType<T>, value: unknown): T => schema.parse(value);

const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms));

const viewerKey = (viewerId: string, threadId: string) => `${viewerId}::${threadId}`;

/**
 * Project a stored thread for one viewer: visibility filtering, per-viewer
 * unread state, and per-viewer sentByMe on each message. Threads without
 * course targeting are school-wide and visible to every viewer.
 */
function projectThread(
  t: MessageThread,
  db: DemoDatabase,
  viewer: MessageViewer,
): MessageThread | null {
  const courseTargeted = t.courseIds.length > 0;
  if (courseTargeted && 'courseIds' in viewer) {
    if (!t.courseIds.some((c) => viewer.courseIds.includes(c))) return null;
  }
  if (viewer.role === 'teacher') {
    // A teacher's mailbox is mail they authored OR mail addressed to them
    // (WITSMail forward lands in the recipient's inbox).
    const addressed = t.recipientIds.includes(viewer.userId);
    if (t.authorId !== viewer.userId && !addressed) return null;
  }
  const isRead =
    !t.unread ||
    // Your own sent mail is never unread to you.
    (viewer.role === 'teacher' && t.authorId === viewer.userId) ||
    db.readByViewer.has(viewerKey(viewer.userId, t.id));
  return {
    ...t,
    unread: !isRead,
    messages: t.messages.map((m) => ({
      ...m,
      sentByMe: m.senderId === viewer.userId || (!m.senderId && m.sentByMe && viewer.role === 'student'),
    })),
  };
}

export class MockWitsRepository implements WitsRepository {
  private db: DemoDatabase;

  constructor() {
    this.db = createDemoDatabase();
  }

  /** Restore the pristine seed (tests, demo walkthroughs). */
  async resetDemo(): Promise<void> {
    this.db = createDemoDatabase();
  }

  async getMe(role: string): Promise<User> {
    await delay(80);
    const user =
      role === 'parent'
        ? fixtures.mockParentUser
        : role === 'teacher'
          ? fixtures.mockTeacherUser
          : fixtures.mockStudentUser;
    return parse(userSchema, user);
  }

  async getStudents(): Promise<Student[]> {
    await delay();
    return parse(z.array(studentSchema), this.db.students);
  }

  async getCourses(studentId: string): Promise<Course[]> {
    await delay();
    return parse(z.array(courseSchema), this.db.coursesByStudent[studentId] ?? []);
  }

  async getCourse(courseId: string): Promise<Course> {
    await delay(80);
    for (const list of Object.values(this.db.coursesByStudent)) {
      const course = list.find((c) => c.id === courseId);
      if (course) return parse(courseSchema, course);
    }
    throw new Error(`Course not found: ${courseId}`);
  }

  async getAssignments(studentId: string): Promise<Assignment[]> {
    await delay();
    return parse(z.array(assignmentSchema), this.db.assignmentsByStudent[studentId] ?? []);
  }

  async getAssignment(id: string): Promise<Assignment> {
    await delay(80);
    for (const list of Object.values(this.db.assignmentsByStudent)) {
      const a = list.find((x) => x.id === id);
      if (a) return parse(assignmentSchema, a);
    }
    throw new Error(`Assignment not found: ${id}`);
  }

  async getGrades(studentId: string): Promise<GradeEntry[]> {
    await delay();
    return parse(z.array(gradeEntrySchema), this.db.gradesByStudent[studentId] ?? []);
  }

  async getAttendance(studentId: string): Promise<AttendanceRecord[]> {
    await delay();
    return parse(z.array(attendanceRecordSchema), this.db.attendanceByStudent[studentId] ?? []);
  }

  async getCalendar(studentId: string): Promise<CalendarEvent[]> {
    await delay();
    const isPrimary = studentId === 'stu-praket';
    const events = isPrimary
      ? this.db.events.filter((e) => !e.id.startsWith('me'))
      : this.db.events.filter((e) => e.id.startsWith('me') || e.audience === 'families');
    return parse(z.array(calendarEventSchema), events);
  }

  async getMessages(viewer: MessageViewer): Promise<MessageThread[]> {
    await delay();
    const projected = this.db.threads
      .map((t) => projectThread(t, this.db, viewer))
      .filter((t): t is MessageThread => t !== null);
    return parse(z.array(messageThreadSchema), projected);
  }

  async getGuidance(studentId: string): Promise<GuidanceItem[]> {
    await delay();
    return parse(z.array(guidanceItemSchema), this.db.guidanceByStudent[studentId] ?? []);
  }

  async getResources(): Promise<ResourceLink[]> {
    await delay();
    return parse(z.array(resourceLinkSchema), this.db.resources);
  }

  async getToday(studentId: string): Promise<TodayPayload> {
    await delay();
    const base = todayPayloadFor(this.db, studentId);
    return parse(
      todayPayloadSchema,
      { ...base, schedule: scheduleFor(this.db, studentId) },
    );
  }

  async getTeacherClasses(): Promise<TeacherClass[]> {
    await delay(80);
    return this.db.teacherClasses.map((c) => ({ ...c }));
  }

  async getTeacherRoster(classId: string): Promise<TeacherRosterEntry[]> {
    await delay(80);
    const roster = this.db.rostersByClass[classId];
    if (!roster) throw new Error(`Unknown class: ${classId}`);
    return parse(z.array(teacherRosterEntrySchema), roster.map((r) => ({ ...r })));
  }

  async getTeacherToday(): Promise<TeacherTodayPayload> {
    await delay(80);
    return JSON.parse(JSON.stringify(this.db.teacherToday)) as TeacherTodayPayload;
  }

  async getBellSchedule(): Promise<BellPeriod[]> {
    await delay(80);
    return this.db.bellSchedule.map((b) => ({ ...b }));
  }

  async getReminders(): Promise<Reminder[]> {
    await delay(80);
    return this.db.reminders.map((text, i) => ({ id: `rem-${i + 1}`, text }));
  }

  async getMonthlyAttendance(query: MonthlyAttendanceQuery): Promise<MonthlyAttendance> {
    await delay(80);
    return monthlyAttendanceFor(this.db, query.studentId, query.year, query.month);
  }

  async getAbsenceReports(studentId: string): Promise<AbsenceReport[]> {
    await delay(80);
    return this.db.absenceReports.filter((r) => r.studentId === studentId).map((r) => ({ ...r }));
  }

  async submitAbsenceReport(input: AbsenceReportInput): Promise<AbsenceReport> {
    await delay(120);
    const report: AbsenceReport = {
      id: `abs-${Date.now()}`,
      studentId: input.studentId,
      date: input.date,
      type: input.type,
      reason: input.reason,
      note: input.note?.trim() ? input.note.trim() : null,
      submittedAt: now().toISOString(),
      status: 'submitted',
    };
    this.db.absenceReports.unshift(report);
    return { ...report };
  }

  /** Synthetic staff directory backing the forward sheet's To picker. */
  async getStaffDirectory(): Promise<StaffContact[]> {
    await delay(80);
    return [
      { id: 'tea-bernard', name: 'Mr. Bernard', title: 'Science — AP Chemistry' },
      { id: 'tea-okafor', name: 'Ms. Okafor', title: 'History — AP US History' },
      { id: 'tea-lin', name: 'Mr. Lin', title: 'Mathematics — Pre-Calculus' },
      { id: 'cou-ramirez', name: 'Ms. Ramirez', title: 'Guidance Counselor (A–L)' },
      { id: 'cou-shaw', name: 'Mr. Shaw', title: 'Guidance Counselor (M–Z)' },
      { id: 'nur-adeyemi', name: 'Ms. Adeyemi', title: 'School Nurse' },
      { id: 'off-front', name: 'Front Office', title: 'Attendance & Main Office' },
    ];
  }

  /**
   * WITSMail forward: creates a real, individually addressed unread thread
   * per recipient. Students/parents target staff; teachers target whole
   * classes via the same fan-out as announcements. Recipients see the mail
   * addressed only to themselves — never the full recipient list.
   */
  async forwardMessage(input: ForwardInput): Promise<number> {
    await delay(120);
    if (input.to.length === 0) throw new Error('forward requires at least one recipient');
    const nowIso = now().toISOString();
    const quote = [
      `— Forwarded message —`,
      `From: ${input.quotedFrom}`,
      `Date: ${input.quotedDateLabel}`,
      `Subject: ${input.quotedSubject}`,
      ``,
      ...input.quotedBody.split('\n').map((l) => `> ${l}`),
    ].join('\n');
    const body = input.note.trim() ? `${input.note.trim()}\n\n${quote}` : quote;
    let created = 0;
    for (const r of input.to) {
      if (r.kind === 'class') {
        created += await this.sendAnnouncement({
          courseIds: [r.courseId],
          subject: input.quotedSubject.startsWith('Fwd:')
            ? input.quotedSubject
            : `Fwd: ${input.quotedSubject}`,
          body,
          authorId: input.from.senderId,
          authorName: input.from.senderName,
        });
        continue;
      }
      // Individual staff recipient: their own single-recipient thread. For
      // staff who have an existing conversation thread with the sender, the
      // forward joins that thread (mail semantics); otherwise a new one.
      const existing = this.db.threads.find(
        (t) =>
          t.courseIds.length === 0 &&
          t.recipientIds.length === 0 &&
          ((t.authorId === r.userId &&
            t.messages.some((m) => m.senderId === input.from.senderId)) ||
            t.participants === input.from.senderName),
      );
      if (existing) {
        existing.messages.push({
          id: `m-fwd-${Date.now()}-${r.userId}`,
          sender: input.from.senderName,
          senderId: input.from.senderId,
          body,
          time: nowIso,
          sentByMe: false,
          read: false,
        });
        existing.preview = body.length > 72 ? `${body.slice(0, 72)}…` : body;
        existing.timeLabel = 'Now';
        existing.unread = true;
        this.clearReadState(existing.id);
      } else {
        this.db.threads.unshift({
          id: `t-fwd-${Date.now()}-${r.userId}`,
          courseIds: [],
          authorId: input.from.senderId,
          recipientIds: [r.userId],
          participants: r.label,
          subject: input.quotedSubject.startsWith('Fwd:')
            ? input.quotedSubject
            : `Fwd: ${input.quotedSubject}`,
          category: 'School',
          unread: true,
          preview: body.length > 72 ? `${body.slice(0, 72)}…` : body,
          timeLabel: 'Now',
          attachments: [],
          messages: [
            {
              id: `m-fwd-${Date.now()}-${r.userId}`,
              sender: input.from.senderName,
              senderId: input.from.senderId,
              body,
              time: nowIso,
              sentByMe: false,
              read: false,
            },
          ],
        });
      }
      created += 1;
    }
    return created;
  }

  async sendMessage(
    threadId: string,
    body: string,
    from: { senderId: string; senderName: string },
  ): Promise<void> {
    await delay(120);
    const thread = this.db.threads.find((t) => t.id === threadId);
    if (!thread) throw new Error('Thread not found');
    thread.messages.push({
      id: `m-${Date.now()}`,
      sender: from.senderName,
      senderId: from.senderId,
      body,
      time: now().toISOString(),
      sentByMe: true,
      read: true,
    });
    thread.preview = body;
    thread.timeLabel = 'Now';
  }

  /**
   * Teacher multi-class announcement: one real unread thread per targeted
   * class, author-attributed, addressed to exactly one class so each enrolled
   * student and their parents receive it. The shared per-class thread also
   * means replies from that class land in one place for the teacher.
   */
  async sendAnnouncement(input: AnnouncementInput): Promise<number> {
    await delay(120);
    if (input.courseIds.length === 0) throw new Error('sendAnnouncement requires at least one class');
    const nowIso = now().toISOString();
    for (const courseId of input.courseIds) {
      // Reuse the existing per-class thread when one exists (e.g. t1 for
      // c-chem), so the announcement joins that class's conversation.
      const existing = this.db.threads.find(
        (t) => t.authorId === input.authorId && t.courseIds.length === 1 && t.courseIds[0] === courseId,
      );
      if (existing) {
        existing.messages.push({
          id: `m-${Date.now()}-${courseId}`,
          sender: input.authorName,
          senderId: input.authorId,
          body: input.body,
          time: nowIso,
          sentByMe: false,
          read: false,
        });
        existing.preview = input.body;
        existing.timeLabel = 'Now';
        existing.unread = true;
        existing.subject = input.subject;
        // Everyone who already read this thread now has a new unread message.
        this.clearReadState(existing.id);
        continue;
      }
      this.db.threads.unshift({
        id: `t-an-${Date.now()}-${courseId}`,
        courseIds: [courseId],
        authorId: input.authorId,
        recipientIds: [],
        participants: input.authorName,
        subject: input.subject,
        category: 'Classes',
        unread: true,
        preview: input.body.length > 72 ? `${input.body.slice(0, 72)}…` : input.body,
        timeLabel: 'Now',
        attachments: [],
        messages: [
          {
            id: `m-${Date.now()}-${courseId}`,
            sender: input.authorName,
            senderId: input.authorId,
            body: input.body,
            time: nowIso,
            sentByMe: false,
            read: false,
          },
        ],
      });
    }
    return input.courseIds.length;
  }

  async markThreadRead(threadId: string, viewerId: string): Promise<void> {
    this.db.readByViewer.add(viewerKey(viewerId, threadId));
  }

  /** New mail makes the thread unread again for every viewer who read it. */
  private clearReadState(threadId: string): void {
    for (const key of [...this.db.readByViewer]) {
      if (key.endsWith(`::${threadId}`)) this.db.readByViewer.delete(key);
    }
  }
}

// EXPO_PUBLIC_DATA_SOURCE=http switches to the district-backed implementation
// with zero screen changes (plan §17).
export const repository: WitsRepository =
  process.env.EXPO_PUBLIC_DATA_SOURCE === 'http'
    ? new HttpWitsRepository()
    : new MockWitsRepository();
