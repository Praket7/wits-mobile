/**
 * Relational demo database (P0.2, P0.16, plan §6).
 *
 * `createDemoDatabase()` builds a fresh, privately-owned in-memory graph per
 * repository instance, so:
 *  - mutations never leak between instances/tests (resetDemo() restores seed),
 *  - switching the selected child changes real content, not just a name,
 *  - teacher rosters/today are scoped per class, not shared fixtures.
 *
 * All data is synthetic. Personas stay coherent with the approved mockups;
 * per §6.1 what matters is coherence, not specific names.
 */
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
  MonthlyAttendance,
  MonthlyStatus,
  ResourceLink,
  ScheduleBlock,
  Student,
  TeacherActionItem,
  TeacherClass,
  TeacherRosterEntry,
  TeacherScheduleBlock,
  TeacherTodayPayload,
  TodayPayload,
} from '@/domain/schemas';
import { DEMO_NOW } from '@/utils/clock';
import { applyScenario, type ScenarioId } from './scenarios';
import * as fixtures from '../fixtures/data';

// Inline shapes of todayPayloadSchema's nested arrays (no named exports).
type Announcement = { id: string; title: string; body: string };
type RecentActivity = { id: string; title: string; subtitle: string; timeLabel: string };

export type DemoDatabase = {
  students: Student[];
  coursesByStudent: Record<string, Course[]>;
  assignmentsByStudent: Record<string, Assignment[]>;
  gradesByStudent: Record<string, GradeEntry[]>;
  attendanceByStudent: Record<string, AttendanceRecord[]>;
  guidanceByStudent: Record<string, GuidanceItem[]>;
  /** Per-student monthly grids keyed `YYYY-MM` (P0.17). */
  monthlyAttendanceByStudent: Record<string, Record<string, Record<string, MonthlyStatus>>>;
  /** No-school dates as `YYYY-MM-DD` — district calendar in production. */
  noSchoolDays: string[];
  events: CalendarEvent[];
  guidanceEvents: GuidanceItem[];
  resources: ResourceLink[];
  threads: MessageThread[];
  /** Per-viewer read state — private to this database instance. */
  readByViewer: Set<string>;
  bellSchedule: { period: number; start: string; end: string }[];
  reminders: string[];
  teacherClasses: TeacherClass[];
  rostersByClass: Record<string, TeacherRosterEntry[]>;
  teacherToday: TeacherTodayPayload;
  absenceReports: AbsenceReport[];
  /** Forms & signatures awaiting the family (plan §9.5). */
  forms: DistrictForm[];
  /** Teacher class-attendance submissions (§10.6 demo write). */
  attendanceSubmissions: {
    classId: string;
    date: string;
    submissions: { studentId: string; status: 'present' | 'tardy' | 'absent' }[];
    submittedAt: string;
  }[];
  /** Scenario flags (§6.3): offline-stale-data / partial-source-outage. */
  metaStale: boolean;
  messagesOutage: boolean;
};

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

// ---------------------------------------------------------------------------
// Personas: the primary scenario mirrors the approved mockups exactly; the
// second child has a complete, deliberately different dataset so parent-child
// switching is visibly relational.
// ---------------------------------------------------------------------------

const ANIKA_COURSES: Course[] = [
  {
    id: 'm-math',
    name: 'Math 8',
    teacher: 'Mr. Lin',
    teacherEmail: 'mlin@williamsville.example',
    room: '114',
    period: 1,
    meetingTime: '8:05 AM – 8:47 AM',
    color: '#C8102E',
    gradePercent: 91,
    letterGrade: 'A-',
    nextDue: 'Problem Set 2.3',
    description: 'Grade 8 mathematics: linear equations, functions, and geometry.',
  },
  {
    id: 'm-sci',
    name: 'Science 8',
    teacher: 'Mrs. Okafor',
    teacherEmail: 'lokafor@williamsville.example',
    room: '121',
    period: 2,
    meetingTime: '8:52 AM – 9:34 AM',
    color: '#FFB81C',
    gradePercent: 88,
    letterGrade: 'B+',
    nextDue: 'Lab: Density of Liquids',
    description: 'Physical science foundations with hands-on laboratory work.',
  },
  {
    id: 'm-eng',
    name: 'English 8',
    teacher: 'Ms. Tran',
    teacherEmail: 'etran@williamsville.example',
    room: '108',
    period: 3,
    meetingTime: '10:05 AM – 10:47 AM',
    color: '#8E9AA6',
    gradePercent: 94,
    letterGrade: 'A',
    nextDue: null,
    description: 'Literature study, writing workshop, and discussion.',
  },
  {
    id: 'm-ss',
    name: 'Social Studies 8',
    teacher: 'Mr. Cook',
    teacherEmail: 'rcook@williamsville.example',
    room: '102',
    period: 4,
    meetingTime: '10:52 AM – 11:34 AM',
    color: '#C8102E',
    gradePercent: 85,
    letterGrade: 'B',
    nextDue: 'Constitution Quiz',
    description: 'United States history and civics through Reconstruction.',
  },
];

const ANIKA_ASSIGNMENTS: Assignment[] = [
  {
    id: 'ma-ps23',
    courseId: 'm-math',
    courseName: 'Math 8',
    title: 'Problem Set 2.3',
    description: 'Linear equations practice, problems 1–20.',
    dueDate: '2026-09-18',
    dueTime: '8:05 AM',
    type: 'Homework',
    category: 'Homework',
    points: 20,
    earnedPoints: null,
    status: 'upcoming',
    source: 'district',
    attachments: [],
    gradedDate: null,
  },
  {
    id: 'ma-density',
    courseId: 'm-sci',
    courseName: 'Science 8',
    title: 'Lab: Density of Liquids',
    description: 'Complete the density lab worksheet and reflection.',
    dueDate: '2026-09-21',
    dueTime: '9:34 AM',
    type: 'Lab',
    category: 'Labs',
    points: 30,
    earnedPoints: null,
    status: 'upcoming',
    source: 'district',
    attachments: [],
    gradedDate: null,
  },
  {
    id: 'ma-const',
    courseId: 'm-ss',
    courseName: 'Social Studies 8',
    title: 'Constitution Quiz',
    description: 'Quiz on the articles and amendments.',
    dueDate: '2026-09-22',
    dueTime: '10:52 AM',
    type: 'Quiz',
    category: 'Quizzes',
    points: 25,
    earnedPoints: null,
    status: 'upcoming',
    source: 'district',
    attachments: [],
    gradedDate: null,
  },
  {
    id: 'ma-ws',
    courseId: 'm-eng',
    courseName: 'English 8',
    title: 'Vocabulary Week 3',
    description: 'Weekly vocabulary worksheet.',
    dueDate: '2026-09-11',
    dueTime: '10:05 AM',
    type: 'Homework',
    category: 'Homework',
    points: 10,
    earnedPoints: 10,
    status: 'graded',
    source: 'district',
    attachments: [],
    gradedDate: '2026-09-11',
  },
  {
    id: 'ma-missing',
    courseId: 'm-math',
    courseName: 'Math 8',
    title: 'Checkpoint 2.1',
    description: 'Short checkpoint on solving equations.',
    dueDate: '2026-09-09',
    dueTime: '8:05 AM',
    type: 'Quiz',
    category: 'Quizzes',
    points: 15,
    earnedPoints: null,
    status: 'missing',
    source: 'district',
    attachments: [],
    gradedDate: null,
  },
];

const ANIKA_GRADES: GradeEntry[] = [
  { id: 'mg1', courseId: 'm-eng', courseName: 'English 8', assignmentTitle: 'Vocabulary Week 3', earned: 10, total: 10, percent: 100, date: '2026-09-11' },
  { id: 'mg2', courseId: 'm-sci', courseName: 'Science 8', assignmentTitle: 'Metric Measurement Quiz', earned: 26, total: 30, percent: 87, date: '2026-09-10' },
  { id: 'mg3', courseId: 'm-math', courseName: 'Math 8', assignmentTitle: 'Problem Set 2.2', earned: 18, total: 20, percent: 90, date: '2026-09-09' },
  { id: 'mg4', courseId: 'm-ss', courseName: 'Social Studies 8', assignmentTitle: 'Colonies Map', earned: 21, total: 25, percent: 84, date: '2026-09-08' },
];

const ANIKA_ATTENDANCE: AttendanceRecord[] = [
  { id: 'mat1', date: '2026-09-17', status: 'present', note: null, courseId: null, arrivalTime: null, excused: false, reason: null, reportedBy: null, period: null, departureTime: null },
  { id: 'mat2', date: '2026-09-15', status: 'present', note: null, courseId: null, arrivalTime: null, excused: false, reason: null, reportedBy: null, period: null, departureTime: null },
  { id: 'mat3', date: '2026-09-14', status: 'absent', note: 'Excused (Medical appointment)', courseId: null, arrivalTime: null, excused: true, reason: 'Medical appointment', reportedBy: 'ParentPortal', period: null, departureTime: null },
];

const ANIKA_GUIDANCE: GuidanceItem[] = [
  { id: 'mgd1', title: 'High School Course Planning', date: '2026-10-02', location: 'Middle School Counseling Office', description: 'Family meeting to plan the grade 9 course sequence.', category: 'Planning', registrationRequired: false, eligibleGrades: '8', sourceLabel: 'Middle School Counseling' },
];

const ANIKA_MONTHLY: Record<string, MonthlyStatus> = {
  '1': 'present', '2': 'present', '3': 'present', '4': 'present', '8': 'present',
  '9': 'present', '10': 'present', '11': 'present', '14': 'absent', '15': 'present', '17': 'present',
};

const ANIKA_SCHEDULE: ScheduleBlock[] = [
  { courseId: 'm-math', period: 1, startTime: '8:05 AM', endTime: '8:47 AM', attended: 'attended', arrivalTime: null },
  { courseId: 'm-sci', period: 2, startTime: '8:52 AM', endTime: '9:34 AM', attended: 'attended', arrivalTime: null },
  { courseId: 'm-eng', period: 3, startTime: '10:05 AM', endTime: '10:47 AM', attended: 'upcoming', arrivalTime: null },
  { courseId: 'm-ss', period: 4, startTime: '10:52 AM', endTime: '11:34 AM', attended: 'upcoming', arrivalTime: null },
];

const ANIKA_ANNOUNCEMENTS: Announcement[] = [
  { id: 'man1', title: 'Picture Day Friday', body: 'Picture day is Friday, September 18. Order forms went home Monday.' },
];

const ANIKA_ACTIVITY: RecentActivity[] = [
  { id: 'mra1', title: 'Vocabulary Week 3 graded', subtitle: 'Ms. Tran – English 8', timeLabel: '9:00 AM' },
  { id: 'mra2', title: 'Picture Day Friday', subtitle: 'Main Office', timeLabel: 'Yesterday' },
];

// ---------------------------------------------------------------------------
// Teacher datasets: per-class metadata (P0.13) and per-class rosters (P0.3).
// ---------------------------------------------------------------------------

const TEACHER_CLASSES: TeacherClass[] = [
  { id: 'c-chem', name: 'AP Chemistry – Period 3', course: 'AP Chemistry', period: 3, room: '220', studentCount: 24, nextMeeting: 'Today 10:05 AM', pendingGrading: 12, nextAction: 'Grade Unit 1 Tests (12 remaining)' },
  { id: 'c-chem2', name: 'AP Chemistry – Period 7', course: 'AP Chemistry', period: 7, room: '220', studentCount: 22, nextMeeting: 'Today 1:05 PM', pendingGrading: 4, nextAction: 'Post lab materials' },
  { id: 'c-forensic', name: 'Forensic Science – Period 5', course: 'Forensic Science', period: 5, room: '222', studentCount: 28, nextMeeting: 'Today 12:18 PM', pendingGrading: 6, nextAction: 'Review safety contracts' },
];

const CHEM_ROSTER: TeacherRosterEntry[] = fixtures.teacherRoster.map((r, i) => ({
  ...r,
  missingCount: [0, 3, 1, 0, 2, 0][i] ?? 0,
}));

const CHEM2_ROSTER: TeacherRosterEntry[] = [
  { id: 'sr7', name: 'Casey Ibarra', gradePercent: 93, absences: 1, missingCount: 0 },
  { id: 'sr8', name: 'Devon Jacobs', gradePercent: 76, absences: 4, missingCount: 5 },
  { id: 'sr9', name: 'Elena Kim', gradePercent: 89, absences: 0, missingCount: 1 },
  { id: 'sr10', name: 'Franklin Osei', gradePercent: 82, absences: 2, missingCount: 2 },
  { id: 'sr11', name: 'Grace Patel', gradePercent: 96, absences: 0, missingCount: 0 },
];

const FORENSIC_ROSTER: TeacherRosterEntry[] = [
  { id: 'sr12', name: 'Hana Rivera', gradePercent: 91, absences: 1, missingCount: 0 },
  { id: 'sr13', name: 'Isaac Novak', gradePercent: 79, absences: 3, missingCount: 4 },
  { id: 'sr14', name: 'Julia Mensah', gradePercent: 87, absences: 0, missingCount: 1 },
  { id: 'sr15', name: 'Kevin Zhao', gradePercent: 94, absences: 0, missingCount: 0 },
  { id: 'sr16', name: 'Lena Petrov', gradePercent: 68, absences: 5, missingCount: 7 },
  { id: 'sr17', name: 'Marcus Reed', gradePercent: 84, absences: 2, missingCount: 2 },
];

/** Teacher day blocks — planning/duty periods labeled explicitly (§10.1). */
const TEACHER_BLOCKS: TeacherScheduleBlock[] = [
  { period: 1, label: 'Hall Duty', time: '8:05 – 8:47 AM', classId: null, kind: 'duty' },
  { period: 2, label: 'Planning', time: '8:52 – 9:34 AM', classId: null, kind: 'planning' },
  { period: 3, label: 'AP Chemistry', time: '10:05 – 10:47 AM', classId: 'c-chem', kind: 'class' },
  { period: 4, label: 'Planning', time: '10:52 – 11:34 AM', classId: null, kind: 'planning' },
  { period: 5, label: 'Forensic Science', time: '12:18 – 1:00 PM', classId: 'c-forensic', kind: 'class' },
  { period: 6, label: 'Planning', time: '1:05 – 1:47 PM', classId: null, kind: 'planning' },
  { period: 7, label: 'AP Chemistry', time: '1:52 – 2:34 PM', classId: 'c-chem2', kind: 'class' },
];

// ---------------------------------------------------------------------------
// A/B day rotation (plan item 29): explicit mock calendar until WCSD supplies
// the authoritative schedule source. Labor Day excluded from numbering.
// ---------------------------------------------------------------------------

const NO_SCHOOL_DAYS = ['2026-09-07', '2026-10-12'];

const dayIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * Deterministic mock rotation: school days alternate A/B starting with A on
 * Sep 1, 2026, numbered excluding no-school days. Labeled as mock data —
 * replace with the district calendar when available.
 */
export function rotationForDate(iso: string): 'A Day' | 'B Day' | null {
  if (NO_SCHOOL_DAYS.includes(iso)) return null;
  const start = new Date('2026-09-01T12:00:00');
  const d = new Date(`${iso}T12:00:00`);
  if (d < start) return null;
  let schoolDay = 0;
  for (let cur = new Date(start); cur <= d; cur.setDate(cur.getDate() + 1)) {
    const dow = cur.getDay();
    if (dow === 0 || dow === 6) continue;
    if (NO_SCHOOL_DAYS.includes(dayIso(cur))) continue;
    schoolDay += 1;
    if (dayIso(cur) === iso) return schoolDay % 2 === 1 ? 'A Day' : 'B Day';
  }
  return null;
}

// ---------------------------------------------------------------------------
// Today payload assembly (§6.4: derive, never duplicate).
// ---------------------------------------------------------------------------

const isoOf = (d: Date) => dayIso(d);

/** Due within 5 calendar days of the demo clock. */
function dueSoonCount(assignments: Assignment[]): number {
  const horizon = new Date(DEMO_NOW);
  horizon.setDate(horizon.getDate() + 5);
  return assignments.filter((a) => {
    if (a.status !== 'upcoming' || !a.dueDate) return false;
    const due = new Date(`${a.dueDate}T23:59:59`);
    return due >= DEMO_NOW && due <= horizon;
  }).length;
}

function eventsTodayCount(events: CalendarEvent[]): number {
  const today = isoOf(DEMO_NOW);
  return events.filter((e) => {
    if (e.allDay) return e.start.slice(0, 10) === today;
    const end = e.end ? new Date(e.end) : new Date(e.start);
    return e.start.slice(0, 10) === today && end >= DEMO_NOW;
  }).length;
}

/** Threads the student viewer sees as unread (school-wide + own classes). */
function unreadForStudent(threads: MessageThread[], courseIds: string[]): number {
  return threads.filter(
    (t) =>
      t.unread &&
      (t.courseIds.length === 0 || t.courseIds.some((c) => courseIds.includes(c))),
  ).length;
}

export function createDemoDatabase(scenario: ScenarioId = 'normal-day'): DemoDatabase {
  const students: Student[] = clone(fixtures.students);
  const alexId = 'stu-alex';
  const mayaId = 'stu-maya';

  const coursesByStudent: Record<string, Course[]> = {
    [alexId]: clone(fixtures.courses),
    [mayaId]: clone(ANIKA_COURSES),
  };

  const assignmentsByStudent: Record<string, Assignment[]> = {
    [alexId]: clone(fixtures.assignments),
    [mayaId]: clone(ANIKA_ASSIGNMENTS),
  };

  const gradesByStudent: Record<string, GradeEntry[]> = {
    [alexId]: clone(fixtures.gradeEntries),
    [mayaId]: clone(ANIKA_GRADES),
  };

  const attendanceByStudent: Record<string, AttendanceRecord[]> = {
    [alexId]: clone(fixtures.attendance),
    [mayaId]: clone(ANIKA_ATTENDANCE),
  };

  const guidanceByStudent: Record<string, GuidanceItem[]> = {
    [alexId]: clone(fixtures.guidanceItems),
    [mayaId]: clone(ANIKA_GUIDANCE),
  };

  const monthlyAttendanceByStudent: DemoDatabase['monthlyAttendanceByStudent'] = {
    [alexId]: { '2026-09': { ...fixtures.monthlyAttendance } },
    [mayaId]: { '2026-09': { ...ANIKA_MONTHLY } },
  };

  const events: CalendarEvent[] = clone(fixtures.events);
  const guidanceEvents: GuidanceItem[] = clone(fixtures.guidanceItems);

  const anikaEvents: CalendarEvent[] = [
    { id: 'me1', title: 'Picture Day', start: '2026-09-18T08:00:00', end: '2026-09-18T11:00:00', allDay: false, location: 'Main Lobby', category: 'School', source: 'school', audience: 'students', sourceLabel: 'East Middle', description: 'Bring your order form; photos are taken during homeroom.', registrationUrl: null, sourceUrl: null },
    { id: 'me2', title: 'Middle School Open House', start: '2026-09-24T18:30:00', end: '2026-09-24T20:00:00', allDay: false, location: 'East Middle Gym', category: 'School', source: 'school', audience: 'families', sourceLabel: 'East Middle', description: "Walk your student's schedule and meet each teacher for five minutes.", registrationUrl: null, sourceUrl: null },
  ];

  const threads: MessageThread[] = clone(fixtures.messageThreads);

  const teacherClasses: TeacherClass[] = clone(TEACHER_CLASSES);
  const rostersByClass: Record<string, TeacherRosterEntry[]> = {
    'c-chem': clone(CHEM_ROSTER),
    'c-chem2': clone(CHEM2_ROSTER),
    'c-forensic': clone(FORENSIC_ROSTER),
  };

  const actions: TeacherActionItem[] = [];
  for (const c of teacherClasses) {
    if ((c.pendingGrading ?? 0) > 0) {
      actions.push({
        id: `act-grading-${c.id}`,
        kind: 'grading',
        label: `Grade ${c.nextAction.replace(/^Grade | \(.*\)$/, '')}`,
        context: c.name,
        count: c.pendingGrading,
      });
    }
  }
  actions.push({
    id: 'act-msg-chem',
    kind: 'message',
    label: 'Reply to lab question thread',
    context: 'AP Chemistry – Period 3',
    count: 1,
  });

  const teacherToday: TeacherTodayPayload = {
    teacherName: 'Mr. Morgan',
    dateLabel: 'Thursday, September 17, 2026',
    dayLabel: rotationForDate(isoOf(DEMO_NOW)) ?? 'A Day',
    currentBlock: TEACHER_BLOCKS.find((b) => b.kind === 'class' && b.period === 3) ?? null,
    nextBlock: TEACHER_BLOCKS.find((b) => b.kind === 'class' && b.period === 5) ?? null,
    blocks: clone(TEACHER_BLOCKS),
    planningPeriods: clone(TEACHER_BLOCKS.filter((b) => b.kind === 'planning')),
    totalStudents: teacherClasses.reduce((n, c) => n + c.studentCount, 0),
    actions,
    unreadMessages: 1,
  };

  return applyScenario(
    {
    students,
    coursesByStudent,
    assignmentsByStudent,
    gradesByStudent,
    attendanceByStudent,
    guidanceByStudent,
    monthlyAttendanceByStudent,
    noSchoolDays: [...NO_SCHOOL_DAYS],
    events: [...events, ...clone(anikaEvents)],
    guidanceEvents,
    resources: clone(fixtures.resourceLinks),
    threads,
    readByViewer: new Set<string>(),
    bellSchedule: clone(fixtures.bellSchedule),
    reminders: [...fixtures.reminders],
    teacherClasses,
    rostersByClass,
    teacherToday,
    absenceReports: [],
    forms: [
      {
        id: 'form-1',
        studentId: 'stu-alex',
        title: 'AP Chemistry Field Trip Permission Slip',
        type: 'permission-slip',
        dueDate: '2026-09-25',
        status: 'awaiting-signature',
        signedAt: null,
        school: 'Williamsville East High School',
        description: 'Annual consent for the October chemistry lab visit to the district partner site.',
      },
      {
        id: 'form-2',
        studentId: 'stu-alex',
        title: 'Emergency Contact Review',
        type: 'emergency-contact',
        dueDate: '2026-09-30',
        status: 'awaiting-signature',
        signedAt: null,
        school: 'Williamsville East High School',
        description: 'Confirm household contacts and pickup authorizations for the current school year.',
      },
      {
        id: 'form-3',
        studentId: 'stu-alex',
        title: 'Parent–Teacher Conference RSVP',
        type: 'rsvp',
        dueDate: '2026-10-02',
        status: 'awaiting-signature',
        signedAt: null,
        school: 'Williamsville East High School',
        description: 'Reserve a conference slot for the October parent–teacher evenings.',
      },
      {
        id: 'form-4',
        studentId: 'stu-maya',
        title: 'Picture Day Order Acknowledgement',
        type: 'acknowledgement',
        dueDate: '2026-09-18',
        status: 'awaiting-signature',
        signedAt: null,
        school: 'East Middle School',
        description: 'Acknowledge the picture-day photography consent for Friday.',
      },
    ],
    attendanceSubmissions: [],
    metaStale: false,
    messagesOutage: false,
    },
    scenario,
  );
}

// ---------------------------------------------------------------------------
// Derived today payloads, exposed for the repository to assemble per student.
// ---------------------------------------------------------------------------

export function todayPayloadFor(
  db: DemoDatabase,
  studentId: string,
): Omit<TodayPayload, 'schedule'> {
  const isPrimary = studentId === 'stu-alex';
  const courses = db.coursesByStudent[studentId] ?? [];
  const assignments = db.assignmentsByStudent[studentId] ?? [];
  const studentEvents = isPrimary
    ? db.events.filter((e) => !e.id.startsWith('me'))
    : db.events.filter((e) => e.id.startsWith('me') || e.audience === 'families');

  const due = dueSoonCount(assignments);
  const unread = unreadForStudent(db.threads, courses.map((c) => c.id));

  return {
    greetingDateLabel: 'Thursday, September 17, 2026',
    dayLabel: rotationForDate(isoOf(DEMO_NOW)) ?? 'B Day',
    assignmentsDueCount: due,
    assignmentsDueSoonCount: due,
    eventsTodayCount: eventsTodayCount(studentEvents),
    unreadMessagesCount: unread,
    announcements: isPrimary ? clone(fixtures.announcements) : clone(ANIKA_ANNOUNCEMENTS),
    recentActivity: isPrimary ? clone(fixtures.recentActivity) : clone(ANIKA_ACTIVITY),
  };
}

/** Maya's schedule lives only in the db (primary stays fixture-canonical). */
export function scheduleFor(db: DemoDatabase, studentId: string): ScheduleBlock[] {
  if (studentId === 'stu-alex') return clone(fixtures.studentSchedule);
  return clone(ANIKA_SCHEDULE);
}

/** October has no seeded grid — derive present-days from records + calendar. */
export function monthlyAttendanceFor(
  db: DemoDatabase,
  studentId: string,
  year: number,
  month: number,
): MonthlyAttendance {
  const key = `${year}-${String(month).padStart(2, '0')}`;
  const seeded = db.monthlyAttendanceByStudent[studentId]?.[key];
  if (seeded) return { ...seeded };
  // Derive from this student's records; no-school days from the calendar.
  const out: Record<string, MonthlyStatus> = {};
  for (const d of db.noSchoolDays) {
    if (d.startsWith(key)) out[String(Number(d.slice(8, 10)))] = 'no-school';
  }
  for (const r of db.attendanceByStudent[studentId] ?? []) {
    if (r.date.startsWith(key)) {
      const day = String(Number(r.date.slice(8, 10)));
      // Only statuses that exist on the monthly grid; 'early-dismissal'
      // still counts as a day present.
      if (r.status === 'tardy' || r.status === 'absent') out[day] = r.status;
    }
  }
  return out;
}
