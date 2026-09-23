import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import type {
  AbsenceReport,
  Assignment,
  AttendanceRecord,
  CalendarEvent,
  Course,
  DistrictForm,
  GradeEntry,
  GuidanceItem,
  MessageThread,
  NotificationPrefs,
  ResourceLink,
  Student,
  TeacherTodayPayload,
  TodayPayload,
  User,
  AttendanceSubmission,
  MonthlyAttendanceQuery,
} from '@/domain/schemas';
import type { AbsenceReportInput, MessageViewer } from '@/data/repository';
import { repository } from '@/data/mockRepository';
import { useSession } from '@/state/appState';

export const keys = {
  // Server-derived identity: one /me per session (no client-chosen role key —
  // role comes from the server response, security pass).
  me: ['me'] as const,
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

/**
 * Per-query freshness (plan item 276): production varies staleness by data
 * kind instead of a single global value. Demo mirrors the tiers.
 */
const defaults = {
  staleTime: 60_000,
  retry: 1,
} as const;

/** Academic records change on grading cycles, not per-minute. */
const academicDefaults = {
  staleTime: 5 * 60_000,
  retry: 1,
} as const;

/** Bell schedules, resources, directories: effectively static per session. */
const staticDefaults = {
  staleTime: 30 * 60_000,
  retry: 1,
} as const;

export const useMe = () =>
  useQuery<User>({ queryKey: keys.me, queryFn: () => repository.getMe(), ...staticDefaults });

export const useToday = (studentId: string) =>
  useQuery<TodayPayload>({ queryKey: keys.today(studentId), queryFn: () => repository.getToday(studentId), ...defaults });

export const useStudents = () =>
  useQuery<Student[]>({ queryKey: keys.students, queryFn: () => repository.getStudents(), ...staticDefaults });

export const useCourses = (studentId: string, options?: { enabled?: boolean }) =>
  useQuery<Course[]>({ queryKey: keys.courses(studentId), queryFn: () => repository.getCourses(studentId), ...academicDefaults, ...options });

export const useCourse = (courseId: string) =>
  useQuery<Course>({ queryKey: keys.course(courseId), queryFn: () => repository.getCourse(courseId), ...academicDefaults });

export const useAssignments = (studentId: string) =>
  useQuery<Assignment[]>({ queryKey: keys.assignments(studentId), queryFn: () => repository.getAssignments(studentId), ...academicDefaults });

export const useAssignment = (id: string) =>
  useQuery<Assignment>({ queryKey: keys.assignment(id), queryFn: () => repository.getAssignment(id), ...academicDefaults });

export const useGrades = (studentId: string) =>
  useQuery<GradeEntry[]>({ queryKey: keys.grades(studentId), queryFn: () => repository.getGrades(studentId), ...academicDefaults });

export const useAttendance = (studentId: string) =>
  useQuery<AttendanceRecord[]>({ queryKey: keys.attendance(studentId), queryFn: () => repository.getAttendance(studentId), ...defaults });

export const useCalendar = (studentId: string) =>
  useQuery<CalendarEvent[]>({ queryKey: keys.calendar(studentId), queryFn: () => repository.getCalendar(studentId), ...academicDefaults });

/** Single event detail (plan item 27): works for calendar + guidance visits. */
export const useEvent = (eventId: string) =>
  useQuery<CalendarEvent | null>({
    queryKey: ['event', eventId] as const,
    queryFn: () => repository.getEvent(eventId),
    ...academicDefaults,
  });

/** Forms & signatures (§9.5). */
export const useForms = (studentId: string) =>
  useQuery<DistrictForm[]>({
    queryKey: ['forms', studentId] as const,
    queryFn: () => repository.getForms(studentId),
    ...academicDefaults,
  });

/**
 * Build the mailbox viewer from session state: students and parents are
 * scoped to the (selected) child's enrolled classes; teachers get their
 * sent-announcements mailbox. The courses query resolves before the messages
 * query runs so class-targeted threads never flash in and out.
 */
export function useMessageViewer(): { viewer: MessageViewer; ready: boolean } {
  const { userId, role, selectedStudentId } = useSession();
  const studentId = role === 'parent' ? (selectedStudentId ?? 'stu-alex') : userId;
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
  useQuery<GuidanceItem[]>({ queryKey: keys.guidance(studentId), queryFn: () => repository.getGuidance(studentId), ...academicDefaults });

export const useResources = () =>
  useQuery<ResourceLink[]>({ queryKey: keys.resources, queryFn: () => repository.getResources(), ...staticDefaults });

export const useTeacherClasses = () =>
  useQuery({ queryKey: ['teacher', 'classes'] as const, queryFn: () => repository.getTeacherClasses(), ...defaults });

export const useTeacherRoster = (classId: string) =>
  useQuery({ queryKey: ['teacher', 'roster', classId] as const, queryFn: () => repository.getTeacherRoster(classId), ...defaults });

export const useBellSchedule = () =>
  useQuery({ queryKey: ['schedules', 'bell'] as const, queryFn: () => repository.getBellSchedule(), ...staticDefaults });

export const useReminders = () =>
  useQuery({ queryKey: ['reminders'] as const, queryFn: () => repository.getReminders(), ...staticDefaults });

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

/** Sign a form (§9.5): refresh the family's forms queue. */
export function useSignForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formId: string) => repository.signForm(formId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
    },
  });
}

/** Teacher class attendance write (§10.6). */
export function useSubmitClassAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { classId: string; date: string; submissions: AttendanceSubmission[] }) =>
      repository.submitClassAttendance(input.classId, input.date, input.submissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher'] });
    },
  });
}

/** Teacher grading completion (§10.6): clears the class's pending queue. */
export function useMarkGradingComplete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (classId: string) => repository.markGradingComplete(classId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher'] });
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
  return useMutation({
    // Actor derives from the session server-side — no sender fields cross the
    // wire (security pass).
    mutationFn: ({ threadId, body }: { threadId: string; body: string }) =>
      repository.replyToThread(threadId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.messages });
    },
  });
}

/**
 * Teacher multi-class announcement: one unread thread per targeted class.
 * Author derives from the bearer session server-side — the input carries no
 * author fields (security pass).
 */
export function useSendAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { courseIds: string[]; subject: string; body: string }) =>
      repository.sendAnnouncement(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.messages });
    },
  });
}

export function useMarkThreadRead() {
  const queryClient = useQueryClient();
  return useMutation({
    // Read state is per-session server-side; no viewerId crosses the wire.
    mutationFn: (threadId: string) => repository.markThreadRead(threadId),
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
    ...staticDefaults,
  });

/** WITSMail forward: real unread mail for each selected recipient. */
export function useForwardMessage() {
  const queryClient = useQueryClient();
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
