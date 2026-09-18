import type {
  Assignment,
  AttendanceRecord,
  BellPeriod,
  CalendarEvent,
  Course,
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
} from '@/domain/schemas';

// Canonical shapes live in the Zod schemas (plan item 5) so the mock and HTTP
// repositories validate against one source of truth.
export type {
  TeacherClass,
  TeacherRosterEntry,
  BellPeriod,
  Reminder,
  MonthlyAttendance,
} from '@/domain/schemas';

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
  getMessages(): Promise<MessageThread[]>;
  getGuidance(studentId: string): Promise<GuidanceItem[]>;
  getResources(): Promise<ResourceLink[]>;
  getToday(studentId: string): Promise<TodayPayload>;
  getTeacherClasses(): Promise<TeacherClass[]>;
  getTeacherRoster(classId: string): Promise<TeacherRosterEntry[]>;
  getBellSchedule(): Promise<BellPeriod[]>;
  getReminders(): Promise<Reminder[]>;
  getMonthlyAttendance(): Promise<MonthlyAttendance>;
}
