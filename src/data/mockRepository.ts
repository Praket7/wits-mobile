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
  AttendanceSubmission,
  DistrictForm,
  DemoControls,
} from './repository';
import { AppError } from '@/utils/errors';
import { HttpWitsRepository } from './httpRepository';
import { setCapabilities } from '../config/capabilities';
import {
  assignmentSchema,
  attendanceRecordSchema,
  attendanceSummarySchema,
  calendarEventSchema,
  courseAnnouncementSchema,
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
  type AttendanceSummary,
  type CalendarEvent,
  type Course,
  type CourseAnnouncement,
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
import { resolveScenario, selectedScenario } from './demo/scenarios';
import { DEMO_NOW, now } from '@/utils/clock';

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

export class MockWitsRepository implements WitsRepository, DemoControls {
  private db: DemoDatabase;

  /**
   * Session actor (security pass): the mock's stand-in for the bearer-derived
   * identity the real server would use. Default matches the prototype's
   * primary student; setRole()/sign-in flows update it via DemoControls.
   */
  private actor: { userId: string; role: 'student' | 'parent' | 'teacher' } = {
    userId: 'stu-alex',
    role: 'student',
  };

  /** Prototype stand-in for server-derived identity (see DemoControls). */
  setActor(actor: { userId: string; role: 'student' | 'parent' | 'teacher' }): void {
    this.actor = actor;
  }

  constructor() {
    this.db = createDemoDatabase(selectedScenario());
    // Dev scenario picker persistence (§6.3): restore the last choice before
    // the first query renders. env var wins when both are set.
    void resolveScenario().then((s) => {
      if (s !== selectedScenario()) this.seed(s);
    });
  }

  /** Display name of the session actor (mirrors server-derived identity). */
  private get actorName(): string {
    return this.actor.role === 'teacher'
      ? fixtures.mockTeacherUser.name
      : this.actor.role === 'parent'
        ? fixtures.mockParentUser.name
        : fixtures.mockStudentUser.name;
  }

  private seed(scenario?: Parameters<typeof createDemoDatabase>[0]): void {
    this.db = createDemoDatabase(scenario);
  }

  /** Restore the pristine seed (tests, demo walkthroughs). */
  async resetDemo(): Promise<void> {
    this.seed();
  }

  /**
   * Session-derived identity (security pass): the mock mirrors the production
   * contract — /me comes from the session actor, not a client-chosen role
   * parameter. setActor() plays the role of the bearer token in demo mode.
   */
  async getMe(): Promise<User> {
    await delay(80);
    const actor = this.actor;
    const user =
      actor.role === 'parent'
        ? fixtures.mockParentUser
        : actor.role === 'teacher'
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

  async getAttendanceSummary(studentId: string): Promise<AttendanceSummary> {
    await delay(60);
    const summary =
      this.db.attendanceSummaryByStudent[studentId] ??
      // Unknown student: honest empty shape — every figure Unavailable.
      {
        overall: {
          attendanceRate: null,
          absences: null,
          tardies: null,
          earlyDismissals: null,
          schoolDays: null,
        },
        byClass: [],
      };
    return parse(attendanceSummarySchema, summary);
  }

  /** Class detail screen reads the per-class rows, not the school-day log. */
  async getClassAttendance(courseId: string): Promise<AttendanceRecord[]> {
    await delay();
    return parse(
      z.array(attendanceRecordSchema),
      this.db.classAttendanceByCourse[courseId] ?? [],
    );
  }

  async getCourseAnnouncements(courseId: string): Promise<CourseAnnouncement[]> {
    await delay(60);
    const course = Object.values(this.db.coursesByStudent)
      .flat()
      .find((c) => c.id === courseId);
    return parse(z.array(courseAnnouncementSchema), course?.announcements ?? []);
  }

  async getCalendar(studentId: string): Promise<CalendarEvent[]> {
    await delay();
    const isPrimary = studentId === 'stu-alex';
    const events = isPrimary
      ? this.db.events.filter((e) => !e.id.startsWith('me'))
      : this.db.events.filter((e) => e.id.startsWith('me') || e.audience === 'families');
    return parse(z.array(calendarEventSchema), events);
  }

  async getMessages(viewer: MessageViewer): Promise<MessageThread[]> {
    await delay();
    // Partial-source-outage scenario (§6.3): WITSMail is down while every
    // other source stays healthy — screens must degrade, not blank out.
    if (this.db.messagesOutage) {
      throw new AppError('server', 'WITSMail is temporarily unavailable');
    }
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
      {
        ...base,
        schedule: scheduleFor(this.db, studentId),
        meta: {
          fetchedAt: DEMO_NOW.toISOString(),
          source: 'demo' as const,
          stale: this.db.metaStale,
        },
      },
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
    return JSON.parse(
      JSON.stringify({
        ...this.db.teacherToday,
        meta: {
          fetchedAt: DEMO_NOW.toISOString(),
          source: 'demo' as const,
          stale: this.db.metaStale,
        },
      }),
    ) as TeacherTodayPayload;
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

  /** Event detail (item 27): calendar events plus guidance college visits. */
  async getEvent(eventId: string): Promise<CalendarEvent | null> {
    await delay(80);
    const event = this.db.events.find((e) => e.id === eventId);
    if (event) return parse(calendarEventSchema, event);
    const visit = this.db.guidanceEvents.find((g) => g.id === eventId);
    if (!visit) return null;
    // Project a guidance visit into the event-detail shape (item 20 fields).
    const detailLines = [
      visit.description,
      visit.registrationRequired ? 'Registration required — sign up in the Guidance Office.' : null,
      visit.eligibleGrades ? `Eligible grades: ${visit.eligibleGrades}.` : null,
    ].filter((l): l is string => Boolean(l));
    return parse(calendarEventSchema, {
      id: visit.id,
      title: visit.title,
      start: `${visit.date}T09:00:00`,
      end: null,
      allDay: false,
      location: visit.location,
      category: 'College Visit',
      source: 'guidance' as const,
      audience: 'students',
      sourceLabel: visit.sourceLabel,
      description: detailLines.join('\n'),
      registrationUrl: null,
      sourceUrl: null,
    });
  }

  async getForms(studentId: string): Promise<DistrictForm[]> {
    await delay();
    return this.db.forms.filter((f) => f.studentId === studentId).map((f) => ({ ...f }));
  }

  async signForm(formId: string): Promise<DistrictForm> {
    await delay(120);
    const form = this.db.forms.find((f) => f.id === formId);
    if (!form) throw new AppError('not-found', 'Form not found');
    form.status = 'signed';
    form.signedAt = now().toISOString();
    return { ...form };
  }

  async submitClassAttendance(
    classId: string,
    date: string,
    submissions: AttendanceSubmission[],
  ): Promise<void> {
    await delay(120);
    if (submissions.length === 0) {
      throw new AppError('validation', 'Attendance submission requires at least one student');
    }
    this.db.attendanceSubmissions.push({
      classId,
      date,
      submissions: submissions.map((s) => ({ ...s })),
      submittedAt: now().toISOString(),
    });
  }

  async markGradingComplete(classId: string): Promise<TeacherClass> {
    await delay(120);
    const cls = this.db.teacherClasses.find((c) => c.id === classId);
    if (!cls) throw new AppError('not-found', 'Class not found');
    cls.pendingGrading = 0;
    cls.nextAction = 'All grading complete';
    this.db.teacherToday.actions = this.db.teacherToday.actions.filter(
      (a) => !(a.kind === 'grading' && a.context === cls.name),
    );
    return { ...cls };
  }

  /** Synthetic staff directory backing the forward sheet's To picker. */
  async getStaffDirectory(): Promise<StaffContact[]> {
    await delay(80);
    return [
      { id: 'tea-morgan', name: 'Mr. Morgan', title: 'Science — AP Chemistry' },
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
            t.messages.some((m) => m.senderId === this.actor.userId)) ||
            t.participants === this.actorName),
      );
      if (existing) {
        existing.messages.push({
          id: `m-fwd-${Date.now()}-${r.userId}`,
          sender: this.actorName,
          senderId: this.actor.userId,
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
          authorId: this.actor.userId,
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
              sender: this.actorName,
              senderId: this.actor.userId,
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

  async replyToThread(threadId: string, body: string): Promise<void> {
    await delay(120);
    const thread = this.db.threads.find((t) => t.id === threadId);
    if (!thread) throw new Error('Thread not found');
    thread.messages.push({
      id: `m-${Date.now()}`,
      sender: this.actorName,
      senderId: this.actor.userId,
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
    // Actor (author) derives from the session stand-in, not the input
    // (security pass) — the mock mirrors how the backend treats the token.
    const authorId = this.actor.userId;
    const authorName = this.actorName;
    for (const courseId of input.courseIds) {
      // Reuse the existing per-class thread when one exists (e.g. t1 for
      // c-chem), so the announcement joins that class's conversation.
      const existing = this.db.threads.find(
        (t) => t.authorId === authorId && t.courseIds.length === 1 && t.courseIds[0] === courseId,
      );
      if (existing) {
        existing.messages.push({
          id: `m-${Date.now()}-${courseId}`,
          sender: authorName,
          senderId: authorId,
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
        authorId,
        recipientIds: [],
        participants: authorName,
        subject: input.subject,
        category: 'Classes',
        unread: true,
        preview: input.body.length > 72 ? `${input.body.slice(0, 72)}…` : input.body,
        timeLabel: 'Now',
        attachments: [],
        messages: [
          {
            id: `m-${Date.now()}-${courseId}`,
            sender: authorName,
            senderId: authorId,
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

  async markThreadRead(threadId: string): Promise<void> {
    this.db.readByViewer.add(viewerKey(this.actor.userId, threadId));
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

if (process.env.EXPO_PUBLIC_DATA_SOURCE !== 'http') {
  // Demo baseline applies immediately (no network, by design). HTTP mode is
  // NOT bootstrapped here: /v1/capabilities requires the bearer token, so the
  // AuthController fetches it post-sign-in (security pass) — the app stays
  // fail-closed until then instead of fetching with no token at import time.
  setCapabilities({}, 'demo');
}
