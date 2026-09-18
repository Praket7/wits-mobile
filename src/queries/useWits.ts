import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import type {
  Assignment,
  AttendanceRecord,
  CalendarEvent,
  Course,
  GradeEntry,
  GuidanceItem,
  MessageThread,
  NotificationPrefs,
  ResourceLink,
  Student,
  TodayPayload,
  User,
} from '@/domain/schemas';
import { repository } from '@/data/mockRepository';

export const keys = {
  me: (role: string) => ['me', role] as const,
  today: (studentId: string) => ['today', studentId] as const,
  students: ['students'] as const,
  courses: (studentId: string) => ['courses', studentId] as const,
  course: (courseId: string) => ['course', courseId] as const,
  assignments: (studentId: string) => ['assignments', studentId] as const,
  assignment: (id: string) => ['assignment', id] as const,
  grades: (studentId: string) => ['grades', studentId] as const,
  attendance: (studentId: string) => ['attendance', studentId] as const,
  calendar: (studentId: string) => ['calendar', studentId] as const,
  messages: ['messages'] as const,
  guidance: (studentId: string) => ['guidance', studentId] as const,
  resources: ['resources'] as const,
};

const defaults = {
  staleTime: 60_000,
  retry: 1,
} as const;

export const useMe = (role: string) =>
  useQuery<User>({ queryKey: keys.me(role), queryFn: () => repository.getMe(role), ...defaults });

export const useToday = (studentId: string) =>
  useQuery<TodayPayload>({ queryKey: keys.today(studentId), queryFn: () => repository.getToday(studentId), ...defaults });

export const useStudents = () =>
  useQuery<Student[]>({ queryKey: keys.students, queryFn: () => repository.getStudents(), ...defaults });

export const useCourses = (studentId: string) =>
  useQuery<Course[]>({ queryKey: keys.courses(studentId), queryFn: () => repository.getCourses(studentId), ...defaults });

export const useCourse = (courseId: string) =>
  useQuery<Course>({ queryKey: keys.course(courseId), queryFn: () => repository.getCourse(courseId), ...defaults });

export const useAssignments = (studentId: string) =>
  useQuery<Assignment[]>({ queryKey: keys.assignments(studentId), queryFn: () => repository.getAssignments(studentId), ...defaults });

export const useAssignment = (id: string) =>
  useQuery<Assignment>({ queryKey: keys.assignment(id), queryFn: () => repository.getAssignment(id), ...defaults });

export const useGrades = (studentId: string) =>
  useQuery<GradeEntry[]>({ queryKey: keys.grades(studentId), queryFn: () => repository.getGrades(studentId), ...defaults });

export const useAttendance = (studentId: string) =>
  useQuery<AttendanceRecord[]>({ queryKey: keys.attendance(studentId), queryFn: () => repository.getAttendance(studentId), ...defaults });

export const useCalendar = (studentId: string) =>
  useQuery<CalendarEvent[]>({ queryKey: keys.calendar(studentId), queryFn: () => repository.getCalendar(studentId), ...defaults });

export const useMessages = () =>
  useQuery<MessageThread[]>({ queryKey: keys.messages, queryFn: () => repository.getMessages(), ...defaults });

export const useGuidance = (studentId: string) =>
  useQuery<GuidanceItem[]>({ queryKey: keys.guidance(studentId), queryFn: () => repository.getGuidance(studentId), ...defaults });

export const useResources = () =>
  useQuery<ResourceLink[]>({ queryKey: keys.resources, queryFn: () => repository.getResources(), ...defaults });

export const useTeacherClasses = () =>
  useQuery({ queryKey: ['teacher', 'classes'] as const, queryFn: () => repository.getTeacherClasses(), ...defaults });

export const useTeacherRoster = (classId: string) =>
  useQuery({ queryKey: ['teacher', 'roster', classId] as const, queryFn: () => repository.getTeacherRoster(classId), ...defaults });

export const useBellSchedule = () =>
  useQuery({ queryKey: ['schedules', 'bell'] as const, queryFn: () => repository.getBellSchedule(), ...defaults });

export const useReminders = () =>
  useQuery({ queryKey: ['reminders'] as const, queryFn: () => repository.getReminders(), ...defaults });

export const useMonthlyAttendance = () =>
  useQuery({ queryKey: ['attendance', 'monthly'] as const, queryFn: () => repository.getMonthlyAttendance(), ...defaults });

const PREFS_KEY = 'wits.notification-prefs';

const defaultPrefs: NotificationPrefs = {
  grades: true,
  attendance: true,
  assignments: true,
  messages: true,
  events: false,
};

export function useNotificationPrefs() {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(PREFS_KEY)
      .then((raw) => {
        if (raw) setPrefs(JSON.parse(raw) as NotificationPrefs);
        else setPrefs(defaultPrefs);
      })
      .catch(() => setPrefs(defaultPrefs));
  }, []);

  const update = (patch: Partial<NotificationPrefs>) => {
    setPrefs((prev) => {
      const next = { ...(prev ?? defaultPrefs), ...patch };
      AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  return { prefs, update, ready: prefs !== null };
}
