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
import type { Capabilities } from '@/config/capabilities';
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
  districtFormSchema,
  teacherClassSchema,
  teacherRosterEntrySchema,
  teacherTodayPayloadSchema,
  todayPayloadSchema,
  userSchema,
  type Assignment,
  type AbsenceReport,
  type AttendanceRecord,
  type AttendanceSubmission,
  type BellPeriod,
  type CalendarEvent,
  type Course,
  type DistrictForm,
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
 MonthlyAttendanceQuery } from '@/domain/schemas';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
const TIMEOUT_MS = 15_000;

/**
 * Auth token seam (plan §43/§49): production registers a real provider that
 * returns the SSO access token; tokens never live in AsyncStorage.
 */
let authTokenProvider: (() => string | null) | null = null;
export function setAuthTokenProvider(provider: () => string | null): void {
  authTokenProvider = provider;
}

/** One correlation id per app launch is sufficient for support triage. */
const CORRELATION_ID = `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

type Method = 'GET' | 'POST';

/** Error copy never contains paths or IDs — diagnostics live in `detail` only. */
function requestFailure(method: Method, status: number, detail: string): AppError {
  void detail;
  return new AppError(codeFromStatus(status), `${method} request failed`, { status });
}

async function fetchOnce<T>(
  schema: z.ZodType<T>,
  path: string,
  init: { method: Method; body?: unknown },
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const token = authTokenProvider?.();
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        Accept: 'application/json',
        ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'X-Correlation-ID': CORRELATION_ID,
      },
      method: init.method,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: controller.signal,
    });
    if (!res.ok) {
      // Body never enters the thrown message (audit P1: no path/ID leaks);
      // status → taxonomy → friendly copy happens in the UI layer.
      throw requestFailure(init.method, res.status, await res.text().catch(() => ''));
    }
    const json: unknown = await res.json();
    return schema.parse(json); // validate at the boundary (plan §6.1)
  } catch (e) {
    if (e instanceof AppError) throw e;
    if (e instanceof z.ZodError) {
      throw new AppError('validation', 'Server returned malformed data');
    }
    throw new AppError('offline', 'The request could not be completed');
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Retry policy (plan item 277, audit P0): GETs may retry one transient
 * failure. Mutations are NEVER auto-retried — a POST that succeeded
 * server-side but lost its response must not execute twice. Production adds
 * server-side idempotency keys before any write retry is considered.
 */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isTransient(e: unknown): boolean {
  if (!(e instanceof AppError)) return false;
  if (e.code === 'unauthorized' || e.code === 'forbidden' || e.code === 'validation') return false;
  if (e.code === 'offline' || e.code === 'server') return true;
  return false;
}

async function request<T>(
  schema: z.ZodType<T>,
  path: string,
  options?: { method?: Method; body?: unknown },
): Promise<T> {
  if (!BASE_URL) {
    throw new AppError('config', 'API base URL is not configured', {
      hint: 'Set EXPO_PUBLIC_API_BASE_URL when EXPO_PUBLIC_DATA_SOURCE=http.',
    });
  }
  const method: Method = options?.method ?? 'GET';
  if (method === 'GET') {
    try {
      return await fetchOnce(schema, path, { method, body: options?.body });
    } catch (e) {
      if (!isTransient(e)) throw e;
      await sleep(400);
      return fetchOnce(schema, path, { method, body: options?.body });
    }
  }
  return fetchOnce(schema, path, { method, body: options?.body });
}

/** The server's capability declaration (OpenAPI /capabilities). */
const capabilitiesResponseSchema = z.record(z.string(), z.boolean());

/** Fetched once at startup by the repository factory (fail-closed default). */
export async function fetchServerCapabilities(): Promise<Partial<Capabilities>> {
  return (await request(capabilitiesResponseSchema, '/v1/capabilities')) as Partial<Capabilities>;
}

/** District-ready repository. Same contract as MockWitsRepository. */
export class HttpWitsRepository implements WitsRepository {
  /** Server-derived identity (OpenAPI: role comes from the session). */
  async getMe(_role: string): Promise<User> {
    void _role; // intentionally ignored — never sent to the server
    return request(userSchema, '/v1/me');
  }
  /** Authorized relationships only (OpenAPI /me/students). */
  async getStudents(): Promise<Student[]> {
    return request(z.array(studentSchema), '/v1/me/students');
  }
  async getCourses(studentId: string): Promise<Course[]> {
    return request(z.array(courseSchema), `/v1/students/${encodeURIComponent(studentId)}/courses`);
  }
  async getCourse(courseId: string): Promise<Course> {
    return request(courseSchema, `/v1/courses/${encodeURIComponent(courseId)}`);
  }
  async getAssignments(studentId: string): Promise<Assignment[]> {
    return request(
      z.array(assignmentSchema),
      `/v1/students/${encodeURIComponent(studentId)}/assignments`,
    );
  }
  async getAssignment(id: string): Promise<Assignment> {
    return request(assignmentSchema, `/v1/assignments/${encodeURIComponent(id)}`);
  }
  async getGrades(studentId: string): Promise<GradeEntry[]> {
    return request(z.array(gradeEntrySchema), `/v1/students/${encodeURIComponent(studentId)}/grades`);
  }
  async getAttendance(studentId: string): Promise<AttendanceRecord[]> {
    return request(
      z.array(attendanceRecordSchema),
      `/v1/students/${encodeURIComponent(studentId)}/attendance`,
    );
  }
  async getCalendar(studentId: string): Promise<CalendarEvent[]> {
    return request(
      z.array(calendarEventSchema),
      `/v1/students/${encodeURIComponent(studentId)}/calendar`,
    );
  }
  async getMessages(viewer: MessageViewer): Promise<MessageThread[]> {
    // The real backend derives the viewer from the authenticated session;
    // the viewer param documents intent and lets the mock mirror semantics.
    void viewer;
    return request(z.array(messageThreadSchema), '/v1/messages');
  }
  async getGuidance(studentId: string): Promise<GuidanceItem[]> {
    return request(
      z.array(guidanceItemSchema),
      `/v1/students/${encodeURIComponent(studentId)}/guidance`,
    );
  }
  async getResources(): Promise<ResourceLink[]> {
    return request(z.array(resourceLinkSchema), '/v1/resources');
  }
  async getToday(studentId: string): Promise<TodayPayload> {
    return request(todayPayloadSchema, `/v1/students/${encodeURIComponent(studentId)}/today`);
  }
  async getTeacherClasses(): Promise<TeacherClass[]> {
    return request(z.array(teacherClassSchema), '/v1/teacher/classes');
  }
  async getTeacherRoster(classId: string): Promise<TeacherRosterEntry[]> {
    return request(
      z.array(teacherRosterEntrySchema),
      `/v1/teacher/classes/${encodeURIComponent(classId)}/roster`,
    );
  }
  async getTeacherToday(): Promise<TeacherTodayPayload> {
    return request(teacherTodayPayloadSchema, '/v1/teacher/today');
  }
  async getBellSchedule(): Promise<BellPeriod[]> {
    return request(z.array(bellPeriodSchema), '/v1/schedules/bell');
  }
  async getReminders(): Promise<Reminder[]> {
    return request(z.array(reminderSchema), '/v1/reminders');
  }
  async getMonthlyAttendance(query: MonthlyAttendanceQuery): Promise<MonthlyAttendance> {
    const p = new URLSearchParams({
      year: String(query.year),
      month: String(query.month),
    });
    if (query.courseId) p.set('courseId', query.courseId);
    return request(
      monthlyAttendanceSchema,
      `/v1/students/${encodeURIComponent(query.studentId)}/attendance/monthly?${p.toString()}`,
    );
  }

  async getAbsenceReports(studentId: string): Promise<AbsenceReport[]> {
    return request(
      z.array(absenceReportSchema),
      `/v1/students/${encodeURIComponent(studentId)}/absence-reports`,
    );
  }

  async getEvent(eventId: string): Promise<CalendarEvent | null> {
    return request(calendarEventSchema.nullable(), `/v1/events/${encodeURIComponent(eventId)}`);
  }

  async getForms(studentId: string): Promise<DistrictForm[]> {
    return request(z.array(districtFormSchema), `/v1/students/${encodeURIComponent(studentId)}/forms`);
  }

  async signForm(formId: string): Promise<DistrictForm> {
    return request(districtFormSchema, `/v1/forms/${encodeURIComponent(formId)}/sign`, {
      method: 'POST',
      body: {},
    });
  }

  async submitClassAttendance(
    classId: string,
    date: string,
    submissions: AttendanceSubmission[],
  ): Promise<void> {
    await request(z.object({ ok: z.boolean() }), `/v1/teacher/classes/${encodeURIComponent(classId)}/attendance`, {
      method: 'POST',
      body: { date, submissions },
    });
  }

  async markGradingComplete(classId: string): Promise<TeacherClass> {
    return request(teacherClassSchema, `/v1/teacher/classes/${encodeURIComponent(classId)}/grading-complete`, {
      method: 'POST',
      body: {},
    });
  }

  async submitAbsenceReport(input: AbsenceReportInput): Promise<AbsenceReport> {
    return request(absenceReportSchema, `/v1/students/${encodeURIComponent(input.studentId)}/absence-reports`, {
      method: 'POST',
      body: {
        date: input.date,
        type: input.type,
        reason: input.reason,
        note: input.note ?? null,
      },
    });
  }

  /** Every mutation below goes through the same hardened request path. */
  async sendMessage(
    threadId: string,
    body: string,
    from: { senderId: string; senderName: string },
  ): Promise<void> {
    await request(z.object({ ok: z.boolean() }), `/v1/messages/threads/${encodeURIComponent(threadId)}/reply`, {
      method: 'POST',
      body: { body, senderId: from.senderId },
    });
  }

  async sendAnnouncement(input: AnnouncementInput): Promise<number> {
    const res = await request(z.object({ created: z.number() }), '/v1/messages/announcements', {
      method: 'POST',
      body: input,
    });
    return res.created;
  }

  async getStaffDirectory(): Promise<StaffContact[]> {
    return request(z.array(staffContactSchema), '/v1/staff');
  }

  async forwardMessage(input: ForwardInput): Promise<number> {
    const res = await request(z.object({ created: z.number() }), '/v1/messages/forward', {
      method: 'POST',
      body: input,
    });
    return res.created;
  }

  async markThreadRead(threadId: string, viewerId: string): Promise<void> {
    void viewerId; // backend derives from session
    await request(z.object({ ok: z.boolean() }), `/v1/messages/threads/${encodeURIComponent(threadId)}/read`, {
      method: 'POST',
    });
  }

  /** Mock-only capability: demo state resets have no HTTP counterpart. */
  async resetDemo(): Promise<void> {
    throw new AppError('not-found', 'resetDemo is mock-only');
  }
}
