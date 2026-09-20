import { z } from 'zod';
import type {
  AnnouncementInput,
  ForwardInput,
  MessageViewer,
  StaffContact,
  WitsRepository,
  AbsenceReportInput,
} from './repository';
import { AppError, codeFromStatus } from '@/utils/errors';
import {
  assignmentSchema,
  attendanceRecordSchema,
  bellPeriodSchema,
  calendarEventSchema,
  courseSchema,
  gradeEntrySchema,
  guidanceItemSchema,
  messageThreadSchema,
  monthlyAttendanceSchema,
  reminderSchema,
  resourceLinkSchema,
  staffContactSchema,
  studentSchema,
  absenceReportSchema,
  attendanceSubmissionSchema,
  districtFormSchema,
  teacherClassSchema,
  teacherRosterEntrySchema,
  teacherTodayPayloadSchema,
  todayPayloadSchema,
  userSchema,
  type Assignment,
  type AbsenceReport,
  type AttendanceRecord,
  type BellPeriod,
  type CalendarEvent,
  type Course,
  type GradeEntry,
  type GuidanceItem,
  type MessageThread,
  type MonthlyAttendance,
  type Reminder,
  type ResourceLink,
  type Student,
  type TeacherClass,
  type TeacherRosterEntry,
  type TeacherTodayPayload,
  type TodayPayload,
  type User,
  type AttendanceSubmission,
  type DistrictForm,
} from '@/domain/schemas';
import type { MonthlyAttendanceQuery } from '@/domain/schemas';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
const TIMEOUT_MS = 15_000;

/**
 * Auth token seam (plan §43/§49): production registers a real provider that
 * returns the SSO access token; tokens never live in AsyncStorage. Demo/HTTP
 * prototype sends no Authorization header.
 */
let authTokenProvider: (() => string | null) | null = null;
export function setAuthTokenProvider(provider: () => string | null): void {
  authTokenProvider = provider;
}

/** One correlation id per app launch is sufficient for support triage. */
const CORRELATION_ID = `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

async function fetchOnce<T>(schema: z.ZodType<T>, path: string, body?: unknown): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const token = authTokenProvider?.();
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'X-Correlation-ID': CORRELATION_ID,
      },
      method: body !== undefined ? 'POST' : 'GET',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    if (!res.ok) {
      // Typed error envelope (plan §15/§39): status → taxonomy → friendly copy.
      throw new AppError(codeFromStatus(res.status), `${body !== undefined ? 'POST' : 'GET'} ${path} failed`, {
        status: res.status,
      });
    }
    const json: unknown = await res.json();
    return schema.parse(json); // validate at the boundary (plan §6.1)
  } catch (e) {
    if (e instanceof AppError) throw e;
    if (e instanceof z.ZodError) {
      // Malformed server data fails loudly here, never leaks into UI state.
      throw new AppError('validation', 'Server returned malformed data');
    }
    // AbortError → offline-ish; fetch network errors → offline.
    throw new AppError('offline', 'The request could not be completed');
  } finally {
    clearTimeout(timeout);
  }
}

/** Retry policy (plan item 277): one retry for transient failures only. */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isTransient(e: unknown): boolean {
  if (!(e instanceof AppError)) return false;
  // Never retry auth, permission, or validation failures.
  if (e.code === 'unauthorized' || e.code === 'forbidden' || e.code === 'validation') return false;
  // Network/offline and any 5xx are transient.
  if (e.code === 'offline' || e.code === 'server') return true;
  return false;
}

async function fetchParsed<T>(schema: z.ZodType<T>, path: string, body?: unknown): Promise<T> {
  if (!BASE_URL) {
    throw new AppError('config', 'API base URL is not configured', {
      hint: 'Set EXPO_PUBLIC_API_BASE_URL when EXPO_PUBLIC_DATA_SOURCE=http.',
    });
  }
  try {
    return await fetchOnce(schema, path, body);
  } catch (e) {
    if (!isTransient(e)) throw e;
    await sleep(400);
    return fetchOnce(schema, path, body);
  }
}

/** District-ready repository. Same contract as MockWitsRepository. */
export class HttpWitsRepository implements WitsRepository {
  async getMe(role: string): Promise<User> {
    return fetchParsed(userSchema, `/v1/me?role=${encodeURIComponent(role)}`);
  }
  async getStudents(): Promise<Student[]> {
    return fetchParsed(z.array(studentSchema), `/v1/students`);
  }
  async getCourses(studentId: string): Promise<Course[]> {
    return fetchParsed(z.array(courseSchema), `/v1/students/${encodeURIComponent(studentId)}/courses`);
  }
  async getCourse(courseId: string): Promise<Course> {
    return fetchParsed(courseSchema, `/v1/courses/${encodeURIComponent(courseId)}`);
  }
  async getAssignments(studentId: string): Promise<Assignment[]> {
    return fetchParsed(z.array(assignmentSchema), `/v1/students/${encodeURIComponent(studentId)}/assignments`);
  }
  async getAssignment(id: string): Promise<Assignment> {
    return fetchParsed(assignmentSchema, `/v1/assignments/${encodeURIComponent(id)}`);
  }
  async getGrades(studentId: string): Promise<GradeEntry[]> {
    return fetchParsed(z.array(gradeEntrySchema), `/v1/students/${encodeURIComponent(studentId)}/grades`);
  }
  async getAttendance(studentId: string): Promise<AttendanceRecord[]> {
    return fetchParsed(z.array(attendanceRecordSchema), `/v1/students/${encodeURIComponent(studentId)}/attendance`);
  }
  async getCalendar(studentId: string): Promise<CalendarEvent[]> {
    return fetchParsed(z.array(calendarEventSchema), `/v1/students/${encodeURIComponent(studentId)}/calendar`);
  }
  async getMessages(viewer: MessageViewer): Promise<MessageThread[]> {
    // The real backend derives the viewer from the authenticated session;
    // the viewer param documents intent and lets the mock mirror semantics.
    void viewer;
    return fetchParsed(z.array(messageThreadSchema), `/v1/messages`);
  }
  async getGuidance(studentId: string): Promise<GuidanceItem[]> {
    return fetchParsed(z.array(guidanceItemSchema), `/v1/students/${encodeURIComponent(studentId)}/guidance`);
  }
  async getResources(): Promise<ResourceLink[]> {
    return fetchParsed(z.array(resourceLinkSchema), `/v1/resources`);
  }
  async getToday(studentId: string): Promise<TodayPayload> {
    return fetchParsed(todayPayloadSchema, `/v1/students/${encodeURIComponent(studentId)}/today`);
  }
  async getTeacherClasses(): Promise<TeacherClass[]> {
    return fetchParsed(z.array(teacherClassSchema), `/v1/teacher/classes`);
  }
  async getTeacherRoster(classId: string): Promise<TeacherRosterEntry[]> {
    return fetchParsed(z.array(teacherRosterEntrySchema), `/v1/teacher/classes/${encodeURIComponent(classId)}/roster`);
  }
  async getTeacherToday(): Promise<TeacherTodayPayload> {
    return fetchParsed(teacherTodayPayloadSchema, `/v1/teacher/today`);
  }
  async getBellSchedule(): Promise<BellPeriod[]> {
    return fetchParsed(z.array(bellPeriodSchema), `/v1/schedules/bell`);
  }
  async getReminders(): Promise<Reminder[]> {
    return fetchParsed(z.array(reminderSchema), `/v1/reminders`);
  }
  async getMonthlyAttendance(query: MonthlyAttendanceQuery): Promise<MonthlyAttendance> {
    const p = new URLSearchParams({
      studentId: query.studentId,
      year: String(query.year),
      month: String(query.month),
    });
    if (query.courseId) p.set('courseId', query.courseId);
    return fetchParsed(monthlyAttendanceSchema, `/v1/attendance/monthly?${p.toString()}`);
  }

  async getAbsenceReports(studentId: string): Promise<AbsenceReport[]> {
    return fetchParsed(z.array(absenceReportSchema), `/v1/students/${encodeURIComponent(studentId)}/absence-reports`);
  }

  async getEvent(eventId: string): Promise<CalendarEvent | null> {
    return fetchParsed(calendarEventSchema.nullable(), `/v1/events/${encodeURIComponent(eventId)}`);
  }

  async getForms(studentId: string): Promise<DistrictForm[]> {
    return fetchParsed(z.array(districtFormSchema), `/v1/students/${encodeURIComponent(studentId)}/forms`);
  }

  async signForm(formId: string): Promise<DistrictForm> {
    return fetchParsed(districtFormSchema, `/v1/forms/${encodeURIComponent(formId)}/sign`, {});
  }

  async submitClassAttendance(
    classId: string,
    date: string,
    submissions: AttendanceSubmission[],
  ): Promise<void> {
    await fetchParsed(z.object({ ok: z.boolean() }), `/v1/teacher/classes/${encodeURIComponent(classId)}/attendance`, {
      date,
      submissions,
    });
  }

  async markGradingComplete(classId: string): Promise<TeacherClass> {
    return fetchParsed(teacherClassSchema, `/v1/teacher/classes/${encodeURIComponent(classId)}/grading-complete`, {});
  }

  async submitAbsenceReport(input: AbsenceReportInput): Promise<AbsenceReport> {
    return fetchParsed(absenceReportSchema, `/v1/students/${encodeURIComponent(input.studentId)}/absence-reports`, {
      date: input.date,
      type: input.type,
      reason: input.reason,
      note: input.note ?? null,
    });
  }

  /** District implementation of the mutation surface (item 91). */
  async sendMessage(
    threadId: string,
    body: string,
    from: { senderId: string; senderName: string },
  ): Promise<void> {
    const res = await fetch(`${BASE_URL}/v1/messages/${encodeURIComponent(threadId)}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ body, senderId: from.senderId }),
    });
    if (!res.ok) throw new Error(`POST reply failed: ${res.status}`);
  }

  async sendAnnouncement(input: AnnouncementInput): Promise<number> {
    const res = await fetch(`${BASE_URL}/v1/messages/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(`POST announcement failed: ${res.status}`);
    const json: unknown = await res.json();
    return z.object({ created: z.number() }).parse(json).created;
  }

  async getStaffDirectory(): Promise<StaffContact[]> {
    return fetchParsed(z.array(staffContactSchema), `/v1/staff`);
  }

  async forwardMessage(input: ForwardInput): Promise<number> {
    const res = await fetch(`${BASE_URL}/v1/messages/forward`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(`POST forward failed: ${res.status}`);
    const json: unknown = await res.json();
    return z.object({ created: z.number() }).parse(json).created;
  }

  async markThreadRead(threadId: string, viewerId: string): Promise<void> {
    void viewerId; // backend derives from session
    const res = await fetch(`${BASE_URL}/v1/messages/${encodeURIComponent(threadId)}/read`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`POST read failed: ${res.status}`);
  }

  /** Mock-only capability: demo state resets have no HTTP counterpart. */
  async resetDemo(): Promise<void> {
    throw new Error('resetDemo is mock-only');
  }
}
