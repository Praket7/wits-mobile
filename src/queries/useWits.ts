import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import type {
  AbsenceReport,
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
  TeacherTodayPayload,
  TodayPayload,
  User,
} from '@/domain/schemas';
import type { MonthlyAttendanceQuery } from '@/domain/schemas';
import type { AbsenceReportInput } from '@/data/repository';
import { repository } from '@/data/mockRepository';
import type { MessageViewer } from '@/data/repository';
import { useSession } from '@/state/appState';

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

export const useCourses = (studentId: string, options?: { enabled?: boolean }) =>
  useQuery<Course[]>({ queryKey: keys.courses(studentId), queryFn: () => repository.getCourses(studentId), ...defaults, ...options });

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

/**
 * Build the mailbox viewer from session state: students and parents are
 * scoped to the (selected) child's enrolled classes; teachers get their
 * sent-announcements mailbox. The courses query resolves before the messages
 * query runs so class-targeted threads never flash in and out.
 */
export function useMessageViewer(): { viewer: MessageViewer; ready: boolean } {
  const { userId, role, selectedStudentId } = useSession();
  const studentId = role === 'parent' ? (selectedStudentId ?? 'stu-praket') : userId;
  const courses = useCourses(studentId, { enabled: role !== 'teacher' });
  if (role === 'teacher') {
    return { viewer: { role: 'teacher', userId }, ready: true };
  }
  const courseIds = (courses.data ?? []).map((c) => c.id);
  const viewer: MessageViewer =
    role === 'parent'
      ? { role: 'parent', userId, studentId, courseIds }
      : { role: 'student', userId, courseIds };
  return { viewer, ready: courses.isSuccess };
}

export const useMessages = () => {
  const { viewer, ready } = useMessageViewer();
  return useQuery<MessageThread[]>({
    queryKey: [...keys.messages, viewer],
    queryFn: () => repository.getMessages(viewer),
    enabled: ready,
    ...defaults,
  });
};

/**
 * Single source of truth for unread counts (items 92–93): tab badges, Today
 * glance rows, and inbox counts all derive from this one query. The mock
 * repository keeps optimistic sends in the same cache, so they stay in sync.
 */
export function useUnreadCount(): number {
  const messages = useMessages();
  return (messages.data ?? []).filter((t) => t.unread).length;
}

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

export const useMonthlyAttendance = (query: MonthlyAttendanceQuery) =>
  useQuery({
    queryKey: ['attendance', 'monthly', query] as const,
    queryFn: () => repository.getMonthlyAttendance(query),
    ...defaults,
  });

export const useTeacherToday = () =>
  useQuery<TeacherTodayPayload>({
    queryKey: ['teacher', 'today'] as const,
    queryFn: () => repository.getTeacherToday(),
    ...defaults,
  });

export const useAbsenceReports = (studentId: string) =>
  useQuery<AbsenceReport[]>({
    queryKey: ['absence-reports', studentId] as const,
    queryFn: () => repository.getAbsenceReports(studentId),
    ...defaults,
  });

export function useSubmitAbsenceReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AbsenceReportInput) => repository.submitAbsenceReport(input),
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: ['absence-reports', input.studentId] });
    },
  });
}

/**
 * Message mutations (item 91): screens call these instead of touching the
 * query cache. Sending invalidates the thread list; opening a thread marks it
 * read so badges stay consistent (item 92). Read state is per viewer, so a
 * parent reading an announcement never clears the student's badge.
 */
export function useSendMessage() {
  const queryClient = useQueryClient();
  const { userId } = useSession();
  return useMutation({
    mutationFn: ({ threadId, body }: { threadId: string; body: string }) =>
      repository.sendMessage(threadId, body, { senderId: userId, senderName: 'Me' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.messages });
    },
  });
}

/** Teacher multi-class announcement: one unread thread per targeted class. */
export function useSendAnnouncement() {
  const queryClient = useQueryClient();
  const { userId } = useSession();
  return useMutation({
    mutationFn: (input: { courseIds: string[]; subject: string; body: string; authorName: string }) =>
      repository.sendAnnouncement({ ...input, authorId: userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.messages });
    },
  });
}

export function useMarkThreadRead() {
  const queryClient = useQueryClient();
  const { userId } = useSession();
  return useMutation({
    mutationFn: (threadId: string) => repository.markThreadRead(threadId, userId),
    // Badge drops immediately (P0.15): invalidate every viewer-scoped mailbox
    // query so unread counts recompute after marking read.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.messages });
    },
  });
}

/** Staff directory for the forward sheet's To picker. */
export const useStaffDirectory = () =>
  useQuery({
    queryKey: ['staff', 'directory'] as const,
    queryFn: () => repository.getStaffDirectory(),
    ...defaults,
  });

/** WITSMail forward: real unread mail for each selected recipient. */
export function useForwardMessage() {
  const queryClient = useQueryClient();
  const { userId } = useSession();
  return useMutation({
    mutationFn: (input: {
      sourceThreadId: string;
      quotedFrom: string;
      quotedDateLabel: string;
      quotedSubject: string;
      quotedBody: string;
      note: string;
      to: { kind: 'user' | 'class'; id: string; label: string }[];
    }) =>
      repository.forwardMessage({
        sourceThreadId: input.sourceThreadId,
        quotedFrom: input.quotedFrom,
        quotedDateLabel: input.quotedDateLabel,
        quotedSubject: input.quotedSubject,
        quotedBody: input.quotedBody,
        note: input.note,
        from: { senderId: userId, senderName: 'Me' },
        to: input.to.map((t) =>
          t.kind === 'class'
            ? { kind: 'class' as const, courseId: t.id, label: t.label }
            : { kind: 'user' as const, userId: t.id, label: t.label },
        ),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.messages });
    },
  });
}

const PREFS_KEY = 'wits.notification-prefs.v2';

const defaultPrefs: NotificationPrefs = {
  masterEnabled: true,
  grades: true,
  attendance: true,
  assignments: true,
  messages: true,
  schoolAnnouncements: true,
  clubsActivities: true,
  guidance: true,
  athletics: true,
  calendarEvents: false,
  transportation: true,
  emergency: true,
  digestMode: false,
  quietHoursEnabled: false,
  quietHoursStart: '9:00 PM',
  quietHoursEnd: '6:30 AM',
  lockScreenPrivacy: true,
};

/**
 * Versioned persisted prefs (P0.10). v1 stored five booleans with a shared
 * `events` backing value — the v2 migration maps it onto the independent
 * categories so no stored state silently disappears.
 */
function migrateStored(raw: string): NotificationPrefs {
  const parsed: unknown = JSON.parse(raw);
  const v1 = parsed as { events?: boolean } & Partial<NotificationPrefs>;
  // v1's shared `events` boolean maps onto schoolAnnouncements (its dominant
  // use); the finer categories adopt defaults.
  const { events, ...rest } = v1;
  const next = { ...defaultPrefs, ...rest };
  if (typeof events === 'boolean') next.schoolAnnouncements = events;
  return next;
}

export function useNotificationPrefs() {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(PREFS_KEY)
      .then((raw) => {
        if (raw) setPrefs(migrateStored(raw));
        else {
          // One-time v1 → v2 migration, then discard the old key.
          AsyncStorage.getItem('wits.notification-prefs')
            .then((old) => {
              if (old) {
                setPrefs(migrateStored(old));
                AsyncStorage.setItem(PREFS_KEY, JSON.stringify(migrateStored(old))).catch(() => {});
              } else {
                setPrefs(defaultPrefs);
              }
              AsyncStorage.removeItem('wits.notification-prefs').catch(() => {});
            })
            .catch(() => setPrefs(defaultPrefs));
        }
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
