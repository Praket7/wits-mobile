import type {
  Assignment,
  AttendanceRecord,
  BellPeriod,
  CalendarEvent,
  Course,
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
 * viewer is only a prototype convenience.
 */
export type MessageViewer =
  | { role: 'student'; userId: string; courseIds: string[] }
  | { role: 'parent'; userId: string; studentId: string; courseIds: string[] }
  | { role: 'teacher'; userId: string };

export type AnnouncementInput = {
  courseIds: string[];
  subject: string;
  body: string;
  authorId: string;
  authorName: string;
};

/** Who can receive a forward in the prototype. */
export type ForwardRecipient =
  | { kind: 'user'; userId: string; label: string }
  | { kind: 'class'; courseId: string; label: string };

/** WITSMail forward (plan item 32 mail semantics). */
export type ForwardInput = {
  sourceThreadId: string;
  /** Quoted provenance prepended to the forwarded mail. */
  quotedFrom: string;
  quotedDateLabel: string;
  quotedSubject: string;
  quotedBody: string;
  note: string;
  to: ForwardRecipient[];
  from: { senderId: string; senderName: string };
};

/** Tiny staff directory backing forward addressing in the prototype. */
export type StaffContact = { id: string; name: string; title: string };

export interface WitsRepository {
  getMe(role: string): Promise<User>;
  getStudents(): Promise<Student[]>;
  getCourses(studentId: string): Promise<Course[]>;
  getCourse(courseId: string): Promise<Course>;
  getAssignments(studentId: string): Promise<Assignment[]>;
  getAssignment(id: string): Promise<Assignment>;
  getGrades(studentId: string): Promise<GradeEntry[]>;
  getAttendance(studentId: string): Promise<AttendanceRecord[]>;
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
  /** Mock mutation surface (item 91): the HTTP impl calls WCSD later. */
  sendMessage(
    threadId: string,
    body: string,
    from: { senderId: string; senderName: string },
  ): Promise<void>;
  /**
   * Teacher multi-class announcement: creates ONE unread thread per targeted
   * class so each enrolled student (and their parents) gets real inbox mail.
   * Returns the number of threads created.
   */
  sendAnnouncement(input: AnnouncementInput): Promise<number>;
  markThreadRead(threadId: string, viewerId: string): Promise<void>;
  /** Directory used by the forward sheet's To picker. */
  getStaffDirectory(): Promise<StaffContact[]>;
  /** Forward mail: creates real unread threads for every recipient. */
  forwardMessage(input: ForwardInput): Promise<number>;
  /** Mock-only: restore the pristine seed (tests, demo walkthroughs). */
  resetDemo(): Promise<void>;
}
