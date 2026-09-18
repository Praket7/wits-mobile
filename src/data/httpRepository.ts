import { z } from 'zod';
import type { WitsRepository } from './repository';
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
  studentSchema,
  teacherClassSchema,
  teacherRosterEntrySchema,
  todayPayloadSchema,
  userSchema,
  type Assignment,
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
  type TodayPayload,
  type User,
} from '@/domain/schemas';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

async function fetchParsed<T>(schema: z.ZodType<T>, path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  const json: unknown = await res.json();
  return schema.parse(json); // validate at the boundary (plan §6.1)
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
  async getMessages(): Promise<MessageThread[]> {
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
  async getBellSchedule(): Promise<BellPeriod[]> {
    return fetchParsed(z.array(bellPeriodSchema), `/v1/schedules/bell`);
  }
  async getReminders(): Promise<Reminder[]> {
    return fetchParsed(z.array(reminderSchema), `/v1/reminders`);
  }
  async getMonthlyAttendance(): Promise<MonthlyAttendance> {
    return fetchParsed(monthlyAttendanceSchema, `/v1/attendance/monthly`);
  }
}
