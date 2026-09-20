import { z } from 'zod';

export const attendanceStatusSchema = z.enum([
  'present',
  'tardy',
  'absent',
  'early-dismissal',
]);

export const assignmentStatusSchema = z.enum([
  'upcoming',
  'missing',
  'submitted',
  'graded',
  'no-due-date',
]);

export const eventSourceSchema = z.enum([
  'district',
  'school',
  'guidance',
  'club',
  'athletics',
  'course',
]);

export const roleSchema = z.enum(['student', 'parent', 'teacher']);

/**
 * Payload provenance + freshness (plan §7.2). Every major payload carries it
 * so the UI can say "Grades last updated 8:42 AM" and never present stale
 * data as live. Demo fills source 'demo'; production maps the upstream system.
 */
export const payloadMetaSchema = z.object({
  fetchedAt: z.string(), // ISO datetime
  source: z.enum(['demo', 'wits', 'eschooldata', 'guidance', 'finalsite', 'google-classroom']),
  stale: z.boolean().default(false),
});
export type PayloadMeta = z.infer<typeof payloadMetaSchema>;

/**
 * Forms & signatures (plan §9.5). Demo-synthetic; production writes stay
 * disabled until the forms capability is approved.
 */
export const districtFormSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  title: z.string(),
  type: z.enum(['permission-slip', 'acknowledgement', 'rsvp', 'conference', 'emergency-contact']),
  dueDate: z.string().nullable().default(null),
  status: z.enum(['awaiting-signature', 'signed']).default('awaiting-signature'),
  signedAt: z.string().nullable().default(null),
  school: z.string(),
  description: z.string().default(''),
});
export type DistrictForm = z.infer<typeof districtFormSchema>;

/** Parent-authorized class attendance submission (plan §10.6, demo write). */
export const attendanceSubmissionSchema = z.object({
  studentId: z.string(),
  status: z.enum(['present', 'tardy', 'absent']),
});
export type AttendanceSubmission = z.infer<typeof attendanceSubmissionSchema>;

export const monthlyStatusSchema = z.enum(['present', 'tardy', 'absent', 'no-school']);

// Teacher-side entities (real validation at the repository boundary — no z.custom).
export const teacherClassSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** Course label without the period suffix, e.g. "AP Chemistry". */
  course: z.string().optional(),
  /** Period number shown with the course name in rows and pickers. */
  period: z.number().int().optional(),
  room: z.string(),
  studentCount: z.number().int().nonnegative(),
  /** Next meeting time label, e.g. "Tomorrow 10:05 AM". */
  nextMeeting: z.string().optional(),
  /** Count of submissions awaiting grading, from the repository. */
  pendingGrading: z.number().int().nonnegative().optional(),
  nextAction: z.string(),
});

export const teacherRosterEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  gradePercent: z.number(),
  absences: z.number().int().nonnegative(),
  /** Missing assignments in this teacher's class (repository-derived). */
  missingCount: z.number().int().nonnegative().default(0),
});

/** One block of the teacher's day, rendered verbatim by Teacher Today. */
export const teacherScheduleBlockSchema = z.object({
  period: z.number().int(),
  label: z.string(),
  time: z.string(),
  /** Which of the teacher's classes this block is, if it is a class. */
  classId: z.string().nullable().optional(),
  kind: z.enum(['class', 'planning', 'duty']).default('class'),
});

/** Actionable item surfaced on Teacher Today (grading, mail, announcements). */
export const teacherActionItemSchema = z.object({
  id: z.string(),
  kind: z.enum(['grading', 'message', 'announcement']),
  label: z.string(),
  /** Class context shown as the subtitle, when applicable. */
  context: z.string().nullable(),
  count: z.number().int().nonnegative().optional(),
});

/** Repository-composed payload behind Teacher Today (P0.12). */
export const teacherTodayPayloadSchema = z.object({
  /** Provenance/freshness (§7.2). */
  meta: payloadMetaSchema.optional(),
  teacherName: z.string(),
  dateLabel: z.string(),
  dayLabel: z.string(),
  currentBlock: teacherScheduleBlockSchema.nullable(),
  nextBlock: teacherScheduleBlockSchema.nullable(),
  blocks: z.array(teacherScheduleBlockSchema),
  planningPeriods: z.array(teacherScheduleBlockSchema),
  totalStudents: z.number().int().nonnegative(),
  actions: z.array(teacherActionItemSchema),
  unreadMessages: z.number().int().nonnegative(),
});

export const bellPeriodSchema = z.object({
  period: z.number().int(),
  start: z.string(),
  end: z.string(),
});

/** Synthetic staff directory entry used by WITSMail forward addressing. */
export const staffContactSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string(),
});

export const reminderSchema = z.object({
  id: z.string(),
  text: z.string(),
});

/**
 * Monthly attendance scoped by (student, optional course, year, month) —
 * P0.17. Keys are ISO day numbers as strings; 'no-school' days come from the
 * district calendar in production.
 */
export const monthlyAttendanceSchema = z.record(z.string(), monthlyStatusSchema);
export type MonthlyAttendanceQuery = {
  studentId: string;
  courseId?: string;
  year: number;
  month: number;
};

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: roleSchema,
  initials: z.string(),
  school: z.string(),
});

export const studentSchema = z.object({
  id: z.string(),
  name: z.string(),
  initials: z.string(),
  grade: z.number().int().min(1).max(12),
  school: z.string(),
  gpa: z.number().min(0).max(5),
  attendanceRate: z.number().min(0).max(100),
  absences: z.number().int().nonnegative(),
  tardies: z.number().int().nonnegative(),
  earlyDismissals: z.number().int().nonnegative(),
  schoolDays: z.number().int().nonnegative(),
});

export const courseSchema = z.object({
  id: z.string(),
  name: z.string(),
  teacher: z.string(),
  teacherEmail: z.string(),
  room: z.string(),
  period: z.number(),
  meetingTime: z.string(),
  color: z.string(),
  gradePercent: z.number().min(0).max(100).nullable(),
  letterGrade: z.string().nullable(),
  nextDue: z.string().nullable(),
  description: z.string().optional(),
  markingPeriods: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        gradePercent: z.number().nullable(),
        letterGrade: z.string().nullable(),
        updated: z.string(),
      }),
    )
    .optional(),
});

export const assignmentSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  courseName: z.string(),
  title: z.string(),
  description: z.string(),
  dueDate: z.string().nullable(), // ISO date
  dueTime: z.string().nullable(),
  type: z.string(),
  category: z.string(),
  points: z.number().nonnegative().nullable(),
  earnedPoints: z.number().nonnegative().nullable(),
  status: assignmentStatusSchema,
  source: z.enum(['google-classroom', 'district']).default('district'),
  attachments: z
    .array(z.object({ name: z.string(), size: z.string() }))
    .default([]),
  gradedDate: z.string().nullable(),
});

export const gradeEntrySchema = z.object({
  id: z.string(),
  courseId: z.string(),
  courseName: z.string(),
  assignmentTitle: z.string(),
  earned: z.number().nonnegative(),
  total: z.number().nonnegative(),
  percent: z.number().min(0).max(100),
  date: z.string(),
});

export const attendanceRecordSchema = z.object({
  id: z.string(),
  date: z.string(), // ISO
  status: attendanceStatusSchema,
  note: z.string().nullable(),
  courseId: z.string().nullable(),
  arrivalTime: z.string().nullable(),
  // Richer district fields (plan item 9). All defaulted so existing data passes.
  excused: z.boolean().default(false),
  reason: z.string().nullable().default(null),
  reportedBy: z.string().nullable().default(null),
  period: z.number().int().nullable().default(null),
  departureTime: z.string().nullable().default(null),
});

export const calendarEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  start: z.string(), // ISO
  end: z.string().nullable(),
  allDay: z.boolean().default(false),
  location: z.string().nullable(),
  category: z.string(),
  source: eventSourceSchema,
  audience: z.string(),
  sourceLabel: z.string(),
  // Event-detail fields (plan item 27 / §7.6). Defaults keep existing data valid.
  description: z.string().default(''),
  registrationUrl: z.string().nullable().default(null),
  sourceUrl: z.string().nullable().default(null),
});

export const messageSchema = z.object({
  id: z.string(),
  sender: z.string(),
  /** Author's user id. Lets the repository project sentByMe per viewer. */
  senderId: z.string().nullable().default(null),
  body: z.string(),
  time: z.string(), // ISO
  sentByMe: z.boolean().default(false),
  read: z.boolean().default(true),
});

export const messageThreadSchema = z.object({
  id: z.string(),
  participants: z.string(),
  subject: z.string(),
  category: z.enum(['Classes', 'School', 'Clubs']),
  unread: z.boolean(),
  preview: z.string(),
  timeLabel: z.string(),
  messages: z.array(messageSchema),
  attachments: z
    .array(z.object({ name: z.string(), size: z.string() }))
    .default([]),
  /**
   * Audience targeting: which classes a thread is visible to, and who sent it.
   * Optional so district-supplied threads without routing stay valid — they
   * are then treated as visible to everyone (school-wide).
   * `authorId` lets a teacher's sent-log show only threads they authored.
   */
  courseIds: z.array(z.string()).default([]),
  authorId: z.string().nullable().default(null),
  /**
   * Individually addressed recipients (WITSMail forward). A thread is
   * visible to a staff viewer if they authored it OR are addressed on it.
   */
  recipientIds: z.array(z.string()).default([]),
});

export const guidanceItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(),
  location: z.string().nullable(),
  description: z.string(),
  category: z.string(),
  // College-visit detail (plan item 20). Defaults keep existing data valid.
  registrationRequired: z.boolean().default(false),
  eligibleGrades: z.string().nullable().default(null),
  sourceLabel: z.string().default('Guidance Office'),
});

export const resourceLinkSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  url: z.string(),
  icon: z.string(),
});

export const scheduleBlockSchema = z.object({
  courseId: z.string(),
  period: z.number(),
  startTime: z.string(),
  endTime: z.string(),
  attended: z.enum(['attended', 'late', 'upcoming']).nullable(),
  arrivalTime: z.string().nullable(),
});

export const todayPayloadSchema = z.object({
  /** Provenance/freshness (§7.2) — surfaces "Updated 1:20 PM" + stale banners. */
  meta: payloadMetaSchema.optional(),
  greetingDateLabel: z.string(),
  dayLabel: z.string(), // "B Day"
  schedule: z.array(scheduleBlockSchema),
  assignmentsDueCount: z.number(),
  assignmentsDueSoonCount: z.number(),
  eventsTodayCount: z.number(),
  unreadMessagesCount: z.number(),
  announcements: z.array(
    z.object({ id: z.string(), title: z.string(), body: z.string() })
  ),
  recentActivity: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      subtitle: z.string(),
      timeLabel: z.string(),
    })
  ),
});

/**
 * Notification preferences (P0.10): every visible category is an independent
 * toggle backed by real persisted state — no shared backing boolean.
 */
export const notificationPrefsSchema = z.object({
  masterEnabled: z.boolean().default(true),
  grades: z.boolean().default(true),
  attendance: z.boolean().default(true),
  assignments: z.boolean().default(true),
  messages: z.boolean().default(true),
  schoolAnnouncements: z.boolean().default(true),
  clubsActivities: z.boolean().default(true),
  guidance: z.boolean().default(true),
  athletics: z.boolean().default(true),
  calendarEvents: z.boolean().default(false),
  transportation: z.boolean().default(true),
  /** Emergency alerts are district-forced: the UI disables the control. */
  emergency: z.boolean().default(true),
  digestMode: z.boolean().default(false),
  quietHoursEnabled: z.boolean().default(false),
  quietHoursStart: z.string().default('9:00 PM'),
  quietHoursEnd: z.string().default('6:30 AM'),
  lockScreenPrivacy: z.boolean().default(true),
});

/** Attendance code set used by absence reporting (P0.8). */
export const absenceTypeSchema = z.enum(['full-day', 'late-arrival', 'early-dismissal']);
export const absenceReportSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  date: z.string(),
  type: absenceTypeSchema,
  reason: z.string(),
  note: z.string().nullable().default(null),
  submittedAt: z.string(),
  status: z.enum(['submitted', 'acknowledged']).default('submitted'),
});

export type User = z.infer<typeof userSchema>;
export type Student = z.infer<typeof studentSchema>;
export type Course = z.infer<typeof courseSchema>;
export type Assignment = z.infer<typeof assignmentSchema>;
export type GradeEntry = z.infer<typeof gradeEntrySchema>;
export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>;
export type CalendarEvent = z.infer<typeof calendarEventSchema>;
export type MessageThread = z.infer<typeof messageThreadSchema>;
export type GuidanceItem = z.infer<typeof guidanceItemSchema>;
export type ResourceLink = z.infer<typeof resourceLinkSchema>;
export type ScheduleBlock = z.infer<typeof scheduleBlockSchema>;
export type TodayPayload = z.infer<typeof todayPayloadSchema>;
export type NotificationPrefs = z.infer<typeof notificationPrefsSchema>;
export type Role = z.infer<typeof roleSchema>;
export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>;
export type MonthlyStatus = z.infer<typeof monthlyStatusSchema>;
export type AssignmentStatus = z.infer<typeof assignmentStatusSchema>;
export type TeacherClass = z.infer<typeof teacherClassSchema>;
export type TeacherRosterEntry = z.infer<typeof teacherRosterEntrySchema>;
export type TeacherScheduleBlock = z.infer<typeof teacherScheduleBlockSchema>;
export type TeacherActionItem = z.infer<typeof teacherActionItemSchema>;
export type TeacherTodayPayload = z.infer<typeof teacherTodayPayloadSchema>;
export type BellPeriod = z.infer<typeof bellPeriodSchema>;
export type Reminder = z.infer<typeof reminderSchema>;
export type MonthlyAttendance = z.infer<typeof monthlyAttendanceSchema>;
export type AbsenceReport = z.infer<typeof absenceReportSchema>;
export type AbsenceType = z.infer<typeof absenceTypeSchema>;
export type StaffContact = z.infer<typeof staffContactSchema>;
