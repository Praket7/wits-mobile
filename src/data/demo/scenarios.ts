/**
 * Demo scenarios (plan §6.3): a finished prototype must demonstrate more than
 * the happy path. Each scenario is a deterministic transform over the demo
 * database, applied when a repository instance is created — no randomness, no
 * wall-clock dependence, so screenshots and E2E runs stay reproducible.
 *
 * Selection precedence: AsyncStorage dev picker > EXPO_PUBLIC_DEMO_SCENARIO >
 * 'normal-day'. The picker lives behind __DEV__ on the More screen and applies
 * instantly via resetDemo() + query invalidation.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DemoDatabase } from './db';

export type ScenarioId =
  | 'normal-day'
  | 'all-caught-up'
  | 'heavy-workload'
  | 'missing-work'
  | 'attendance-concern'
  | 'no-upcoming-events'
  | 'empty-inbox'
  | 'long-names'
  | 'teacher-large-roster'
  | 'offline-stale-data'
  | 'partial-source-outage';

export type ScenarioDef = {
  id: ScenarioId;
  label: string;
  description: string;
};

/**
 * Switcher-selectable scenarios. `large-text` (OS setting), `parent-two-children`
 * (the default dataset already ships two children), and `session-expired`
 * (device/auth state) are documented in docs/demo-script.md rather than
 * data transforms.
 */
export const SCENARIOS: ScenarioDef[] = [
  { id: 'normal-day', label: 'Normal Day', description: 'The canonical seeded day — matches the approved mockups.' },
  { id: 'all-caught-up', label: 'All Caught Up', description: 'Nothing missing, nothing unread, empty Needs Attention.' },
  { id: 'heavy-workload', label: 'Heavy Workload', description: 'Many upcoming assignments due this week.' },
  { id: 'missing-work', label: 'Missing Work', description: 'Several assignments overdue and missing.' },
  { id: 'attendance-concern', label: 'Attendance Concern', description: 'Elevated absences and tardies.' },
  { id: 'no-upcoming-events', label: 'No Upcoming Events', description: 'Calendar has nothing ahead.' },
  { id: 'empty-inbox', label: 'Empty Inbox', description: 'Every WITSMail thread already read.' },
  { id: 'long-names', label: 'Long Names', description: 'Stress-tests truncation and wrapping.' },
  { id: 'teacher-large-roster', label: 'Large Roster', description: '30+ students in a teacher class.' },
  { id: 'offline-stale-data', label: 'Stale Data', description: 'Payloads marked stale; Today shows last-updated.' },
  { id: 'partial-source-outage', label: 'Partial Outage', description: 'WITSMail unavailable; everything else loads.' },
];

const STORAGE_KEY = 'wits.demo-scenario';

let activeScenario: ScenarioId =
  (process.env.EXPO_PUBLIC_DEMO_SCENARIO as ScenarioId | undefined) ?? 'normal-day';

export function selectedScenario(): ScenarioId {
  return activeScenario;
}

/** Dev picker: persists the choice and applies it to the live repository. */
export async function setSelectedScenario(id: ScenarioId): Promise<void> {
  activeScenario = id;
  await AsyncStorage.setItem(STORAGE_KEY, id).catch(() => {});
}

/** Boot-time persistence: restore a previously chosen dev scenario. */
export async function restoreScenario(): Promise<void> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY).catch(() => null);
  if (raw && SCENARIOS.some((s) => s.id === raw)) {
    activeScenario = raw as ScenarioId;
  }
}

function markAllMissing(db: DemoDatabase, studentId: string): void {
  const list = db.assignmentsByStudent[studentId] ?? [];
  for (const a of list) {
    if (a.status === 'upcoming') a.status = 'missing';
  }
}

function markAllRead(db: DemoDatabase): void {
  for (const t of db.threads) t.unread = false;
}

const LONG = {
  student: 'Alexandra Winterbourne-Whitfield',
  sibling: 'Maximilian Bartholomew Fitzgerald-Williams',
  teacher: 'Mrs. Firebaugh-McAllister van der Berg',
  parent: 'Constanze Nightingale-Featherstonehaugh',
};

/**
 * Apply the scenario in place. Only the primary student (stu-alex) is
 * transformed — the sibling dataset stays canonical so parent/child switching
 * remains meaningful in every scenario.
 */
export function applyScenario(db: DemoDatabase, scenario: ScenarioId): DemoDatabase {
  const primary = 'stu-alex';
  switch (scenario) {
    case 'normal-day':
      break;
    case 'all-caught-up': {
      markAllRead(db);
      for (const a of db.assignmentsByStudent[primary] ?? []) {
        if (a.status === 'missing') a.status = 'submitted';
      }
      for (const c of db.teacherClasses) c.pendingGrading = 0;
      db.teacherToday.actions = db.teacherToday.actions.filter((a) => a.kind !== 'grading');
      db.teacherToday.unreadMessages = 0;
      break;
    }
    case 'heavy-workload': {
      const list = db.assignmentsByStudent[primary] ?? [];
      const titles = [
        ['Unit 2 Problem Set', 'Homework', 20],
        ['Lab Report: Titration', 'Labs', 40],
        ['Gatsby Reading Quiz', 'Quizzes', 15],
        ['Civil War Essay Draft', 'Essays', 50],
        ['Precalc Review Packet', 'Homework', 25],
      ] as const;
      titles.forEach(([title, category, points], i) => {
        const course = (db.coursesByStudent[primary] ?? [])[i % Math.max(1, (db.coursesByStudent[primary] ?? []).length)];
        list.push({
          id: `sc-hw-${i}`,
          courseId: course?.id ?? 'c-chem',
          courseName: course?.name ?? 'AP Chemistry',
          title,
          description: 'Synthetic heavy-workload scenario assignment.',
          dueDate: `2026-09-1${8 + (i % 3)}`,
          dueTime: '11:59 PM',
          type: category,
          category,
          points,
          earnedPoints: null,
          status: 'upcoming',
          source: 'district',
          attachments: [],
          gradedDate: null,
        });
      });
      break;
    }
    case 'missing-work':
      markAllMissing(db, primary);
      break;
    case 'attendance-concern': {
      const student = db.students.find((s) => s.id === primary);
      if (student) {
        student.absences = 9;
        student.tardies = 6;
        student.attendanceRate = 88;
      }
      const records = db.attendanceByStudent[primary] ?? [];
      records.unshift(
        { id: 'sc-at1', date: '2026-09-16', status: 'absent', note: 'Unexcused', courseId: null, arrivalTime: null, excused: false, reason: null, reportedBy: null, period: null, departureTime: null },
        { id: 'sc-at2', date: '2026-09-11', status: 'tardy', note: null, courseId: null, arrivalTime: '8:22 AM', excused: false, reason: null, reportedBy: null, period: 1, departureTime: null },
        { id: 'sc-at3', date: '2026-09-10', status: 'absent', note: 'Unexcused', courseId: null, arrivalTime: null, excused: false, reason: null, reportedBy: null, period: null, departureTime: null },
      );
      const grid = db.monthlyAttendanceByStudent[primary]?.['2026-09'];
      if (grid) {
        grid['16'] = 'absent';
        grid['11'] = 'tardy';
        grid['10'] = 'absent';
      }
      break;
    }
    case 'no-upcoming-events':
      db.events = db.events.filter((e) => e.start < '2026-09-18');
      break;
    case 'empty-inbox':
      markAllRead(db);
      db.teacherToday.unreadMessages = 0;
      break;
    case 'long-names': {
      for (const s of db.students) {
        s.name = s.grade === 8 ? LONG.sibling : LONG.student;
        s.initials = s.grade === 8 ? 'MB' : 'AW';
      }
      db.teacherToday.teacherName = LONG.teacher;
      for (const cls of db.teacherClasses) cls.name = `${cls.name.split(' – ')[0]} – Room ${cls.room} Extended Section Label`;
      break;
    }
    case 'teacher-large-roster': {
      const roster = db.rostersByClass['c-forensic'] ?? [];
      const first = ['Ava', 'Ben', 'Chloe', 'Dmitri', 'Esme', 'Farid', 'Gwen', 'Hugo', 'Iris', 'Jonah'];
      const last = ['Archer', 'Brooks', 'Chen', 'Duval', 'Ellis', 'Fischer', 'Grant', 'Huang', 'Iyer', 'Jensen'];
      for (let i = roster.length; i < 32; i += 1) {
        roster.push({
          id: `sr-large-${i}`,
          name: `${first[i % 10]} ${last[(i * 7) % 10]}`,
          gradePercent: 70 + ((i * 13) % 30),
          absences: i % 5,
          missingCount: i % 3,
        });
      }
      const forensic = db.teacherClasses.find((c) => c.id === 'c-forensic');
      if (forensic) forensic.studentCount = roster.length;
      db.teacherToday.totalStudents = db.teacherClasses.reduce((n, c) => n + c.studentCount, 0);
      break;
    }
    case 'offline-stale-data':
      db.metaStale = true;
      break;
    case 'partial-source-outage':
      db.messagesOutage = true;
      break;
  }
  return db;
}

/**
 * Resolve the scenario for a new repository instance. The AsyncStorage dev
 * choice resolves before the first query in practice (session hydration gates
 * rendering), so reading it here is safe — and the env var remains the
 * hermetic override for CI/screenshots.
 */
export async function resolveScenario(): Promise<ScenarioId> {
  await restoreScenario();
  return selectedScenario();
}
