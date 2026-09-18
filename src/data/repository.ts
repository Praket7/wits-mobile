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
}
