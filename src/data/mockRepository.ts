import { z } from 'zod';
import type {
  BellPeriod,
  MonthlyAttendance,
  Reminder,
  TeacherClass,
  TeacherRosterEntry,
  WitsRepository,
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
  todayPayloadSchema,
  userSchema,
  type Assignment,
  type AttendanceRecord,
  type CalendarEvent,
  type Course,
  type GradeEntry,
  type GuidanceItem,
  type MessageThread,
  type ResourceLink,
  type Student,
  type TodayPayload,
  type User,
} from '@/domain/schemas';
import * as fixtures from './fixtures/data';

const parse = <T>(schema: z.ZodType<T>, value: unknown): T => schema.parse(value);

const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms));

export class MockWitsRepository implements WitsRepository {
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
    return parse(z.array(studentSchema), fixtures.students);
  }

  async getCourses(_studentId: string): Promise<Course[]> {
    await delay();
    return parse(z.array(courseSchema), fixtures.courses);
  }

  async getCourse(courseId: string): Promise<Course> {
    await delay(80);
    const course = fixtures.courses.find((c) => c.id === courseId);
    if (!course) throw new Error(`Course not found: ${courseId}`);
    return parse(courseSchema, course);
  }

  async getAssignments(_studentId: string): Promise<Assignment[]> {
    await delay();
    return parse(z.array(assignmentSchema), fixtures.assignments);
  }

  async getAssignment(id: string): Promise<Assignment> {
    await delay(80);
    const a = fixtures.assignments.find((x) => x.id === id);
    if (!a) throw new Error(`Assignment not found: ${id}`);
    return parse(assignmentSchema, a);
  }

  async getGrades(_studentId: string): Promise<GradeEntry[]> {
    await delay();
    return parse(z.array(gradeEntrySchema), fixtures.gradeEntries);
  }

  async getAttendance(_studentId: string): Promise<AttendanceRecord[]> {
    await delay();
    return parse(z.array(attendanceRecordSchema), fixtures.attendance);
  }

  async getCalendar(_studentId: string): Promise<CalendarEvent[]> {
    await delay();
    return parse(z.array(calendarEventSchema), fixtures.events);
  }

  async getMessages(): Promise<MessageThread[]> {
    await delay();
    return parse(z.array(messageThreadSchema), fixtures.messageThreads);
  }

  async getGuidance(_studentId: string): Promise<GuidanceItem[]> {
    await delay();
    return parse(z.array(guidanceItemSchema), fixtures.guidanceItems);
  }

  async getResources(): Promise<ResourceLink[]> {
    await delay();
    return parse(z.array(resourceLinkSchema), fixtures.resourceLinks);
  }

  async getToday(_studentId: string): Promise<TodayPayload> {
    await delay();
    return parse(
      todayPayloadSchema,
      {
        greetingDateLabel: 'Thursday, September 17, 2026',
        dayLabel: 'B Day',
        schedule: fixtures.studentSchedule,
        assignmentsDueCount: 2,
        assignmentsDueSoonCount: 2,
        eventsTodayCount: 1,
        unreadMessagesCount: 3,
        announcements: fixtures.announcements,
        recentActivity: fixtures.recentActivity,
      },
    );
  }

  async getTeacherClasses(): Promise<TeacherClass[]> {
    await delay(80);
    return fixtures.teacherClasses.map((c) => ({ ...c }));
  }

  async getTeacherRoster(classId: string): Promise<TeacherRosterEntry[]> {
    await delay(80);
    // Prototype: one shared roster; classId selects it in the district API.
    void classId;
    return fixtures.teacherRoster.map((r) => ({ ...r }));
  }

  async getBellSchedule(): Promise<BellPeriod[]> {
    await delay(80);
    return fixtures.bellSchedule.map((b) => ({ ...b }));
  }

  async getReminders(): Promise<Reminder[]> {
    await delay(80);
    return fixtures.reminders.map((text, i) => ({ id: `rem-${i + 1}`, text }));
  }

  async getMonthlyAttendance(): Promise<MonthlyAttendance> {
    await delay(80);
    return { ...fixtures.monthlyAttendance };
  }
}

// EXPO_PUBLIC_DATA_SOURCE=http switches to the district-backed implementation
// with zero screen changes (plan §17).
export const repository: WitsRepository =
  process.env.EXPO_PUBLIC_DATA_SOURCE === 'http'
    ? new HttpWitsRepository()
    : new MockWitsRepository();
