import type {
  Assignment,
  AttendanceRecord,
  CalendarEvent,
  Course,
  GradeEntry,
  GuidanceItem,
  MessageThread,
  ResourceLink,
  Student,
  TodayPayload,
  User,
} from '@/domain/schemas';

export type TeacherClass = {
  id: string;
  name: string;
  room: string;
  studentCount: number;
  nextAction: string;
};

export type TeacherRosterEntry = {
  id: string;
  name: string;
  gradePercent: number;
  absences: number;
};

export type BellPeriod = { period: number; start: string; end: string };

export type Reminder = { id: string; text: string };

export type MonthlyAttendance = Record<number, 'present' | 'tardy' | 'absent' | 'no-school'>;

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
