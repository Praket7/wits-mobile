import type {
  AttendanceSummary,
  Assignment,
  AttendanceRecord,
  BellPeriod,
  CalendarEvent,
  Course,
  CourseAnnouncement,
  DistrictForm,
  GradeEntry,
  GuidanceItem,
  MessageThread,
  MonthlyAttendance,
  Reminder,
  ResourceLink,
  Student,
  TeacherClass,
  TeacherRosterEntry,
  TodayPayload,
  User,
  AttendanceSubmission,
  MonthlyAttendanceQuery,
  TeacherTodayPayload,
  AbsenceReport,
} from '@/domain/schemas';

// Canonical shapes live in the Zod schemas (plan item 5) so the mock and HTTP
// repositories validate against one source of truth.
export type {
  AttendanceSummary,
  AttendanceSummaryClass,
  TeacherClass,
  TeacherRosterEntry,
  TeacherTodayPayload,
  BellPeriod,
  Reminder,
  MonthlyAttendance,
  MonthlyAttendanceQuery,
  AbsenceReport,
  AbsenceType,
  DistrictForm,
  AttendanceSubmission,
} from '@/domain/schemas';

/** Synthetic absence submission (P0.8) — demo-only until capabilities allow. */
export type AbsenceReportInput = {
  studentId: string;
  date: string;
  type: 'full-day' | 'late-arrival' | 'early-dismissal';
  reason: string;
  note?: string;
};

/**
 * Who is asking for a mailbox. WITSMail is scoped per viewer: a student sees
 * threads addressed to their classes plus school-wide mail; a parent sees the
 * selected child's mailbox; a teacher sees the announcements they authored
 * (their sent log). Production enforces this server-side — the client-supplied
 * viewer is only a prototype convenience, and the HTTP repository ignores it
 * (the bearer session is the scope).
 */
export type MessageViewer =
  | { role: 'student'; userId: string; courseIds: string[] }
  | { role: 'parent'; userId: string; studentId: string; courseIds: string[] }
  | { role: 'teacher'; userId: string };

/**
 * Teacher multi-class announcement input (security pass): NO author fields.
 * The backend derives the author from the bearer session; a client that could
 * declare "I am another user" would be an identity-spoofing hole.
 */
export type AnnouncementInput = {
  courseIds: string[];
  subject: string;
  body: string;
};

/** Who can receive a forward in the prototype. */
export type ForwardRecipient =
  | { kind: 'user'; userId: string; label: string }
  | { kind: 'class'; courseId: string; label: string };

/** WITSMail forward (plan item 32 mail semantics). Sender derives from the session. */
export type ForwardInput = {
  sourceThreadId: string;
  /** Quoted provenance prepended to the forwarded mail. */
  quotedFrom: string;
  quotedDateLabel: string;
  quotedSubject: string;
  quotedBody: string;
  note: string;
  to: ForwardRecipient[];
};

/** Tiny staff directory backing forward addressing in the prototype. */
export type StaffContact = { id: string; name: string; title: string };

/**
 * Production repository contract (security pass): the phone never tells the
 * server who the actor is — identity, role, mailbox scope, and read state all
 * derive from the bearer session. Object ids are the only client input.
 */
export interface WitsRepository {
  /** Server-derived identity (OpenAPI /v1/me: role comes from the session). */
  getMe(): Promise<User>;
  getStudents(): Promise<Student[]>;
  getCourses(studentId: string): Promise<Course[]>;
  getCourse(courseId: string): Promise<Course>;
  /** Course announcements (audit P1) — replaces screen-local synthetic copy. */
  getCourseAnnouncements(courseId: string): Promise<CourseAnnouncement[]>;
  getAssignments(studentId: string): Promise<Assignment[]>;
  getAssignment(id: string): Promise<Assignment>;
  getGrades(studentId: string): Promise<GradeEntry[]>;
  getAttendance(studentId: string): Promise<AttendanceRecord[]>;
  /**
   * Overall + per-class attendance statistics (audit P1). The Attendance
   * screen renders this directly — no screen-local stat tables. Every figure
   * is nullable: partial real data shows Unavailable, never a fake metric.
   */
  getAttendanceSummary(studentId: string): Promise<AttendanceSummary>;
  /** Per-class period-attendance rows for the class detail screen. */
  getClassAttendance(courseId: string): Promise<AttendanceRecord[]>;
  getCalendar(studentId: string): Promise<CalendarEvent[]>;
  getMessages(viewer: MessageViewer): Promise<MessageThread[]>;
  getGuidance(studentId: string): Promise<GuidanceItem[]>;
  getResources(): Promise<ResourceLink[]>;
  getToday(studentId: string): Promise<TodayPayload>;
  getTeacherClasses(): Promise<TeacherClass[]>;
  getTeacherRoster(classId: string): Promise<TeacherRosterEntry[]>;
  /** Repository-composed Teacher Today payload (P0.12). */
  getTeacherToday(): Promise<TeacherTodayPayload>;
  getBellSchedule(): Promise<BellPeriod[]>;
  getReminders(): Promise<Reminder[]>;
  /** Scoped monthly grid (P0.17): student + optional course + year/month. */
  getMonthlyAttendance(query: MonthlyAttendanceQuery): Promise<MonthlyAttendance>;
  /** Absence reporting (P0.8): demo writes only, capability-gated in prod. */
  getAbsenceReports(studentId: string): Promise<AbsenceReport[]>;
  submitAbsenceReport(input: AbsenceReportInput): Promise<AbsenceReport>;
  /** Event detail (plan item 27): calendar event or guidance visit by id. */
  getEvent(eventId: string): Promise<CalendarEvent | null>;
  /** Forms & signatures (plan §9.5): demo writes only, capability-gated. */
  getForms(studentId: string): Promise<DistrictForm[]>;
  signForm(formId: string): Promise<DistrictForm>;
  /** Teacher class attendance write (plan §10.6): demo only. */
  submitClassAttendance(
    classId: string,
    date: string,
    submissions: AttendanceSubmission[],
  ): Promise<void>;
  /** Teacher grading completion (plan §10.6): clears the pending queue. */
  markGradingComplete(classId: string): Promise<TeacherClass>;
  /** Reply joins an existing WITSMail thread; actor derives from the session. */
  replyToThread(threadId: string, body: string): Promise<void>;
  /**
   * Teacher multi-class announcement: creates ONE unread thread per targeted
   * class so each enrolled student (and their parents) gets real inbox mail.
   * Author derives from the bearer session. Returns threads created.
   */
  sendAnnouncement(input: AnnouncementInput): Promise<number>;
  /** Read receipt is per-session; no viewerId crosses the wire. */
  markThreadRead(threadId: string): Promise<void>;
  /** Directory used by the forward sheet's To picker. */
  getStaffDirectory(): Promise<StaffContact[]>;
  /** Forward mail: creates real unread threads for every recipient. */
  forwardMessage(input: ForwardInput): Promise<number>;
}

/**
 * Demo-only controls (security pass): synthetic-database operations that have
 * no production counterpart are separated from the WitsRepository contract so
 * screens/hooks can grow dependencies on them only behind DATA_SOURCE checks.
 * `setActor` feeds the mock the session identity the real server would derive
 * from the bearer token (display name resolves from the role's fixture).
 */
export interface DemoControls {
  /** Restore the pristine seed (tests, demo walkthroughs). */
  resetDemo(): Promise<void>;
  /** Prototype stand-in for server-derived identity. */
  setActor(actor: { userId: string; role: 'student' | 'parent' | 'teacher' }): void;
}

/** Narrow a repository to DemoControls when DATA_SOURCE=mock. */
export function asDemoControls(repo: WitsRepository): DemoControls | null {
  if (typeof (repo as Partial<DemoControls>).resetDemo === 'function') {
    return repo as unknown as DemoControls;
  }
  return null;
}
