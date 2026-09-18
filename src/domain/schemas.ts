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
  grade: z.number(),
  school: z.string(),
  gpa: z.number(),
  attendanceRate: z.number(),
  absences: z.number(),
  tardies: z.number(),
  earlyDismissals: z.number(),
  schoolDays: z.number(),
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
  gradePercent: z.number().nullable(),
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
  points: z.number().nullable(),
  earnedPoints: z.number().nullable(),
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
  earned: z.number(),
  total: z.number(),
  percent: z.number(),
  date: z.string(),
});

export const attendanceRecordSchema = z.object({
  id: z.string(),
  date: z.string(), // ISO
  status: attendanceStatusSchema,
  note: z.string().nullable(),
  courseId: z.string().nullable(),
  arrivalTime: z.string().nullable(),
});

export const calendarEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  start: z.string(), // ISO
  end: z.string().nullable(),
  location: z.string().nullable(),
  category: z.string(),
  source: eventSourceSchema,
  audience: z.string(),
  sourceLabel: z.string(),
});

export const messageSchema = z.object({
  id: z.string(),
  sender: z.string(),
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
});

export const guidanceItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(),
  location: z.string().nullable(),
  description: z.string(),
  category: z.string(),
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

export const notificationPrefsSchema = z.object({
  grades: z.boolean(),
  attendance: z.boolean(),
  assignments: z.boolean(),
  messages: z.boolean(),
  events: z.boolean(),
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
export type AssignmentStatus = z.infer<typeof assignmentStatusSchema>;
