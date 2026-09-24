// Synthetic data only — no real student PII.
import type {
  AttendanceSummary,
  Assignment,
  AttendanceRecord,
  CalendarEvent,
  Course,
  GradeEntry,
  GuidanceItem,
  MessageThread,
  ResourceLink,
  ScheduleBlock,
  Student,
  User,
} from '@/domain/schemas';
import { messageThreadSchema } from '@/domain/schemas';
import { z } from 'zod';

export const mockStudentUser: User = {
  id: 'stu-alex',
  name: 'Alex Williams',
  role: 'student',
  initials: 'AW',
  school: ['Williamsville East High School'],
};

export const mockParentUser: User = {
  id: 'par-williams',
  name: 'Jordan Williams',
  role: 'parent',
  initials: 'JW',
  school: ['Williamsville East High School'],
};

export const mockTeacherUser: User = {
  id: 'tea-morgan',
  name: 'Mr. Morgan',
  role: 'teacher',
  initials: 'TM',
  school: ['Williamsville East High School'],
};

export const students: Student[] = [
  {
    id: 'stu-alex',
    name: 'Alex Williams',
    initials: 'AW',
    grade: 11,
    school: 'Williamsville East High School',
    gpa: 3.87,
    attendanceRate: 98,
    absences: 2,
    tardies: 1,
    earlyDismissals: 0,
    schoolDays: 98,
  },
  {
    id: 'stu-maya',
    name: 'Maya Williams',
    initials: 'MW',
    grade: 8,
    school: 'Williamsville East Middle School',
    gpa: 3.92,
    attendanceRate: 99,
    absences: 1,
    tardies: 0,
    earlyDismissals: 0,
    schoolDays: 98,
  },
];

export const courses: Course[] = [
  {
    id: 'c-chem',
    name: 'AP Chemistry',
    teacher: ['Mr. Morgan'],
    teacherEmail: 'tmorgan@williamsville.example',
    room: ['220'],
    period: 3,
    meetingTime: '10:05 AM – 10:47 AM',
    color: '#C8102E',
    gradePercent: 92,
    letterGrade: 'A-',
    nextDue: 'Lab Questions',
    markingPeriods: [
      { id: 'q1', label: 'Q1', gradePercent: 92, letterGrade: 'A-', updated: 'Sep 16, 2026' },
      { id: 'q2', label: 'Q2', gradePercent: null, letterGrade: null, updated: 'Not started' },
      { id: 'q3', label: 'Q3', gradePercent: null, letterGrade: null, updated: 'Not started' },
      { id: 'q4', label: 'Q4', gradePercent: null, letterGrade: null, updated: 'Not started' },
    ],
    gradeCategories: [
      { id: 'cat-chem-tests', label: 'Tests', percent: 92 },
      { id: 'cat-chem-quizzes', label: 'Quizzes', percent: 88 },
      { id: 'cat-chem-labs', label: 'Labs', percent: 93 },
      { id: 'cat-chem-homework', label: 'Homework', percent: 87 },
      { id: 'cat-chem-participation', label: 'Participation', percent: 100 },
    ],
    announcements: [
      {
        id: 'ca-chem-1',
        title: 'Lab Tomorrow',
        body: 'Please make sure to bring your lab notebook, calculator, and safety goggles tomorrow. We will be performing the equilibrium lab, so closed-toe shoes are required.',
        author: 'Mr. Morgan',
        postedAt: '2026-09-15',
      },
    ],
    description:
      'Advanced study of general chemistry including stoichiometry, thermodynamics, kinetics, equilibrium, and laboratory technique.',
  },
  {
    id: 'c-ushist',
    name: 'AP U.S. History',
    teacher: ['Mrs. Smith'],
    teacherEmail: 'ssmith@williamsville.example',
    room: ['125'],
    period: 4,
    meetingTime: '10:52 AM – 11:34 AM',
    color: '#FFB81C',
    gradePercent: 88,
    letterGrade: 'B+',
    nextDue: 'Unit 2 Reading Notes',
    markingPeriods: [
      { id: 'q1', label: 'Q1', gradePercent: 88, letterGrade: 'B+', updated: 'Sep 15, 2026' },
      { id: 'q2', label: 'Q2', gradePercent: null, letterGrade: null, updated: 'Not started' },
      { id: 'q3', label: 'Q3', gradePercent: null, letterGrade: null, updated: 'Not started' },
      { id: 'q4', label: 'Q4', gradePercent: null, letterGrade: null, updated: 'Not started' },
    ],
    gradeCategories: [
      { id: 'cat-ush-tests', label: 'Tests', percent: 85 },
      { id: 'cat-ush-essays', label: 'Essays', percent: 91 },
      { id: 'cat-ush-quizzes', label: 'Quizzes', percent: 86 },
      { id: 'cat-ush-homework', label: 'Homework', percent: 90 },
    ],
    description: 'College-level survey of United States history.',
  },
  {
    id: 'c-lang',
    name: 'AP Language',
    teacher: ['Mr. Cook'],
    teacherEmail: 'rcook@williamsville.example',
    room: ['134'],
    period: 5,
    meetingTime: '12:18 PM – 1:00 PM',
    color: '#C8102E',
    gradePercent: 90,
    letterGrade: 'A-',
    nextDue: 'Rhetorical Analysis Essay',
    markingPeriods: [
      { id: 'q1', label: 'Q1', gradePercent: 90, letterGrade: 'A-', updated: 'Sep 15, 2026' },
      { id: 'q2', label: 'Q2', gradePercent: null, letterGrade: null, updated: 'Not started' },
      { id: 'q3', label: 'Q3', gradePercent: null, letterGrade: null, updated: 'Not started' },
      { id: 'q4', label: 'Q4', gradePercent: null, letterGrade: null, updated: 'Not started' },
    ],
    gradeCategories: [
      { id: 'cat-lang-essays', label: 'Essays', percent: 89 },
      { id: 'cat-lang-quizzes', label: 'Multiple Choice', percent: 92 },
      { id: 'cat-lang-participation', label: 'Participation', percent: 95 },
    ],
    description: 'Rhetoric, composition, and close reading.',
  },
  {
    id: 'c-precalc',
    name: 'Precalculus',
    teacher: ['Mr. Lee'],
    teacherEmail: 'dlee@williamsville.example',
    room: ['210'],
    period: 2,
    meetingTime: '8:52 AM – 9:34 AM',
    color: '#FFB81C',
    gradePercent: 85,
    letterGrade: 'B',
    nextDue: 'Worksheet 4.1',
    markingPeriods: [
      { id: 'q1', label: 'Q1', gradePercent: 85, letterGrade: 'B', updated: 'Sep 16, 2026' },
      { id: 'q2', label: 'Q2', gradePercent: null, letterGrade: null, updated: 'Not started' },
      { id: 'q3', label: 'Q3', gradePercent: null, letterGrade: null, updated: 'Not started' },
      { id: 'q4', label: 'Q4', gradePercent: null, letterGrade: null, updated: 'Not started' },
    ],
    gradeCategories: [
      { id: 'cat-precalc-tests', label: 'Tests', percent: 82 },
      { id: 'cat-precalc-quizzes', label: 'Quizzes', percent: 84 },
      { id: 'cat-precalc-homework', label: 'Homework', percent: 90 },
    ],
    description: 'Functions, trigonometry, and limits.',
  },
  {
    id: 'c-physics',
    name: 'Physics A',
    teacher: ['Ms. Belling'],
    teacherEmail: 'jbelling@williamsville.example',
    room: ['322'],
    period: 1,
    meetingTime: '8:05 AM – 8:47 AM',
    color: '#C8102E',
    gradePercent: 87,
    letterGrade: 'B+',
    nextDue: 'Physics Lab Writeup',
    markingPeriods: [
      { id: 'q1', label: 'Q1', gradePercent: 87, letterGrade: 'B+', updated: 'Sep 14, 2026' },
      { id: 'q2', label: 'Q2', gradePercent: null, letterGrade: null, updated: 'Not started' },
      { id: 'q3', label: 'Q3', gradePercent: null, letterGrade: null, updated: 'Not started' },
      { id: 'q4', label: 'Q4', gradePercent: null, letterGrade: null, updated: 'Not started' },
    ],
    gradeCategories: [
      { id: 'cat-phys-tests', label: 'Tests', percent: 84 },
      { id: 'cat-phys-labs', label: 'Labs', percent: 93 },
      { id: 'cat-phys-homework', label: 'Homework', percent: 86 },
    ],
    description: 'Mechanics and energy.',
  },
  {
    id: 'c-psych',
    name: 'AP Psychology',
    teacher: ['Mrs. Hart'],
    teacherEmail: 'khart@williamsville.example',
    room: ['118'],
    period: 6,
    meetingTime: '1:05 PM – 1:47 PM',
    color: '#8E9AA6',
    gradePercent: 94,
    letterGrade: 'A',
    nextDue: null,
    markingPeriods: [
      { id: 'q1', label: 'Q1', gradePercent: 94, letterGrade: 'A', updated: 'Sep 16, 2026' },
      { id: 'q2', label: 'Q2', gradePercent: null, letterGrade: null, updated: 'Not started' },
      { id: 'q3', label: 'Q3', gradePercent: null, letterGrade: null, updated: 'Not started' },
      { id: 'q4', label: 'Q4', gradePercent: null, letterGrade: null, updated: 'Not started' },
    ],
    gradeCategories: [
      { id: 'cat-psych-tests', label: 'Tests', percent: 95 },
      { id: 'cat-psych-quizzes', label: 'Quizzes', percent: 93 },
      { id: 'cat-psych-projects', label: 'Projects', percent: 94 },
    ],
    description: 'Introduction to psychological science.',
  },
];

export const assignments: Assignment[] = [
  {
    id: 'a-labq',
    courseId: 'c-chem',
    courseName: 'AP Chemistry',
    title: 'Lab Questions',
    description:
      "Complete the stoichiometry lab questions based on the data collected in today's experiment. Show all work and include proper units. Upload your answers as a PDF or clear photos in Google Classroom.",
    dueDate: '2026-09-18',
    dueTime: '11:59 PM',
    type: 'Homework',
    category: 'Labs',
    points: 50,
    earnedPoints: null,
    status: 'upcoming',
    source: 'google-classroom',
    attachments: [{ name: 'Lab Questions.pdf', size: '245 KB' }],
    gradedDate: null,
  },
  {
    id: 'a-essay',
    courseId: 'c-lang',
    courseName: 'AP Language',
    title: 'Rhetorical Analysis Essay',
    description: 'Analyze the assigned speech for rhetorical strategy.',
    dueDate: '2026-09-22',
    dueTime: '11:59 PM',
    type: 'Essay',
    category: 'Essays',
    points: 100,
    earnedPoints: null,
    status: 'upcoming',
    source: 'district',
    attachments: [],
    gradedDate: null,
  },
  {
    id: 'a-notes2',
    courseId: 'c-ushist',
    courseName: 'AP U.S. History',
    title: 'Unit 2 Reading Notes',
    description: 'Complete structured notes for Unit 2 readings.',
    dueDate: '2026-09-23',
    dueTime: '8:00 AM',
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
    id: 'a-ws41',
    courseId: 'c-precalc',
    courseName: 'Precalculus',
    title: 'Worksheet 4.1',
    description: 'Trig identities practice.',
    dueDate: '2026-09-25',
    dueTime: '9:00 AM',
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
    id: 'a-quiz',
    courseId: 'c-psych',
    courseName: 'AP Psychology',
    title: 'Syllabus Quiz',
    description: 'Open-note quiz on course expectations.',
    dueDate: null,
    dueTime: null,
    type: 'Quiz',
    category: 'Quizzes',
    points: 10,
    earnedPoints: null,
    status: 'no-due-date',
    source: 'district',
    attachments: [],
    gradedDate: null,
  },
  {
    id: 'a-missing',
    courseId: 'c-precalc',
    courseName: 'Precalculus',
    title: 'Homework 3',
    description: 'Polynomial functions homework.',
    dueDate: '2026-09-10',
    dueTime: '9:00 AM',
    type: 'Homework',
    category: 'Homework',
    points: 20,
    earnedPoints: 17,
    status: 'missing',
    source: 'district',
    attachments: [],
    gradedDate: null,
  },
  {
    id: 'a-test1',
    courseId: 'c-chem',
    courseName: 'AP Chemistry',
    title: 'Unit 1 Test',
    description: 'Unit 1 assessment.',
    dueDate: '2026-09-14',
    dueTime: null,
    type: 'Test',
    category: 'Tests',
    points: 100,
    earnedPoints: 92,
    status: 'graded',
    source: 'district',
    attachments: [],
    gradedDate: '2026-09-14',
  },
  {
    id: 'a-stoich',
    courseId: 'c-chem',
    courseName: 'AP Chemistry',
    title: 'Stoichiometry Worksheet',
    description: 'Practice problems.',
    dueDate: '2026-09-08',
    dueTime: null,
    type: 'Homework',
    category: 'Homework',
    points: 20,
    earnedPoints: 17,
    status: 'graded',
    source: 'district',
    attachments: [],
    gradedDate: '2026-09-08',
  },
];

export const gradeEntries: GradeEntry[] = [
  { id: 'g1', courseId: 'c-chem', courseName: 'AP Chemistry', assignmentTitle: 'Unit 1 Test', earned: 92, total: 100, percent: 92, date: '2026-09-14' },
  { id: 'g2', courseId: 'c-lang', courseName: 'AP Language', assignmentTitle: 'Q1 Essay', earned: 45, total: 50, percent: 90, date: '2026-09-12' },
  { id: 'g3', courseId: 'c-ushist', courseName: 'AP U.S. History', assignmentTitle: 'Topic 1.4 Quiz', earned: 18, total: 20, percent: 90, date: '2026-09-11' },
  { id: 'g4', courseId: 'c-precalc', courseName: 'Precalculus', assignmentTitle: 'Homework 3', earned: 17, total: 20, percent: 85, date: '2026-09-10' },
  { id: 'g5', courseId: 'c-physics', courseName: 'Physics A', assignmentTitle: 'Lab Report', earned: 28, total: 30, percent: 93, date: '2026-09-10' },
];

export const attendance: AttendanceRecord[] = [
  { id: 'at1', date: '2026-09-17', status: 'present', note: null, courseId: null, arrivalTime: null, excused: false, reason: null, reportedBy: null, period: null, departureTime: null },
  { id: 'at2', date: '2026-09-16', status: 'tardy', note: 'Arrived at 8:12 AM (Period 1)', courseId: 'c-physics', arrivalTime: '8:12 AM', excused: false, reason: null, reportedBy: 'Physics Office', period: 1, departureTime: null },
  { id: 'at3', date: '2026-09-15', status: 'present', note: null, courseId: null, arrivalTime: null, excused: false, reason: null, reportedBy: null, period: null, departureTime: null },
  { id: 'at4', date: '2026-09-14', status: 'present', note: null, courseId: null, arrivalTime: null, excused: false, reason: null, reportedBy: null, period: null, departureTime: null },
  { id: 'at5', date: '2026-09-11', status: 'absent', note: 'Excused (Illness)', courseId: null, arrivalTime: null, excused: true, reason: 'Illness', reportedBy: 'ParentPortal', period: null, departureTime: null },
];

/**
 * Overall + per-class attendance stats for the primary student (audit P1):
 * consumed by the Attendance screen through getAttendanceSummary — the screen
 * no longer owns a CLASS_STATS table. Coherent with the per-class records
 * below: c-physics has 1 tardy, c-precalc/c-ushist 1 absence each.
 */
export const attendanceSummary: AttendanceSummary = {
  overall: { attendanceRate: 98, absences: 2, tardies: 1, earlyDismissals: 0, schoolDays: 98 },
  byClass: [
    { courseId: 'c-physics', absences: 0, tardies: 1, earlyDismissals: 0, attendanceRate: 97 },
    { courseId: 'c-precalc', absences: 1, tardies: 0, earlyDismissals: 0, attendanceRate: 98 },
    { courseId: 'c-ushist', absences: 1, tardies: 0, earlyDismissals: 0, attendanceRate: 98 },
    { courseId: 'c-chem', absences: 0, tardies: 0, earlyDismissals: 0, attendanceRate: 100 },
    { courseId: 'c-lang', absences: 0, tardies: 0, earlyDismissals: 0, attendanceRate: 100 },
    { courseId: 'c-psych', absences: 0, tardies: 0, earlyDismissals: 0, attendanceRate: 100 },
  ],
};

/** Per-class period-attendance rows backing the class detail screen. */
export const classAttendance: Record<string, AttendanceRecord[]> = {
  'c-physics': [
    { id: 'cat-p1', date: '2026-09-16', status: 'tardy', note: 'Arrived at 8:12 AM', courseId: 'c-physics', arrivalTime: '8:12 AM', excused: false, reason: null, reportedBy: 'Physics Office', period: 1, departureTime: null },
  ],
  'c-precalc': [
    { id: 'cat-pr1', date: '2026-09-11', status: 'absent', note: 'Excused (Illness)', courseId: 'c-precalc', arrivalTime: null, excused: true, reason: 'Illness', reportedBy: 'ParentPortal', period: 2, departureTime: null },
  ],
  'c-ushist': [
    { id: 'cat-u1', date: '2026-09-14', status: 'absent', note: 'Excused (Medical appointment)', courseId: 'c-ushist', arrivalTime: null, excused: true, reason: 'Medical appointment', reportedBy: 'ParentPortal', period: 4, departureTime: null },
  ],
};

export const events: CalendarEvent[] = [
  { id: 'e1', title: 'Student Council Meeting', start: '2026-09-17T15:00:00', end: '2026-09-17T16:00:00', allDay: false, location: 'Room 142', category: 'Club', source: 'club', audience: 'students', sourceLabel: 'Student Council', description: 'Weekly planning meeting for homecoming week events. All class representatives attend.', registrationUrl: null, sourceUrl: null },
  { id: 'e2', title: 'Pace University Info Session', start: '2026-09-17T09:00:00', end: '2026-09-17T10:00:00', allDay: false, location: 'Career Center', category: 'Guidance', source: 'guidance', audience: 'students', sourceLabel: 'Guidance Office', description: 'An admissions counselor from Pace University presents programs, campus life, and application timelines.', registrationUrl: null, sourceUrl: null },
  { id: 'e3', title: 'College Fair', start: '2026-09-18T13:00:00', end: '2026-09-18T16:00:00', allDay: false, location: 'Main Gym', category: 'Guidance', source: 'guidance', audience: 'families', sourceLabel: 'Guidance Office', description: 'Over 50 colleges represented. Bring your student ID — families welcome.', registrationUrl: null, sourceUrl: null },
  { id: 'e4', title: 'Villanova University Visit', start: '2026-09-18T09:00:00', end: '2026-09-18T10:00:00', allDay: false, location: 'Auditorium', category: 'Guidance', source: 'guidance', audience: 'students', sourceLabel: 'Guidance Office', description: 'Information session with a Villanova admissions representative.', registrationUrl: 'https://www.villanova.edu/admission', sourceUrl: null },
  { id: 'e5', title: 'RPI University Visit', start: '2026-09-21T10:00:00', end: '2026-09-21T11:00:00', allDay: false, location: 'Auditorium', category: 'Guidance', source: 'guidance', audience: 'students', sourceLabel: 'Guidance Office', description: 'Engineering and architecture program overview with an RPI admissions counselor.', registrationUrl: null, sourceUrl: null },
  { id: 'e6', title: 'PSAT/NMSQT', start: '2026-09-24T07:45:00', end: '2026-09-24T12:00:00', allDay: false, location: 'Williamsville East', category: 'School', source: 'school', audience: 'students', sourceLabel: 'Williamsville East', description: 'National testing day. Report to your assigned room by 7:45 AM with two #2 pencils and an approved calculator.', registrationUrl: null, sourceUrl: null },
  { id: 'e7', title: 'Homecoming Game', start: '2026-09-25T19:00:00', end: null, allDay: false, location: 'East High School Stadium', category: 'Athletics', source: 'athletics', audience: 'everyone', sourceLabel: 'Athletics', description: 'Varsity football under the lights. Gates open at 6:15 PM; student section opens with valid ID.', registrationUrl: null, sourceUrl: null },
];

/**
 * Threads are parsed through the schema at load so default fields added later
 * (e.g. recipientIds for WITSMail forward addressing) exist on every runtime
 * object — repository code can rely on the domain model, not literals.
 */
export const messageThreads: MessageThread[] = z
  .array(messageThreadSchema)
  .parse([
  {
    id: 't1',
    courseIds: ['c-chem'],
    authorId: 'tea-morgan',
    participants: 'Mr. Morgan',
    subject: 'Lab Reminder',
    category: 'Classes',
    unread: true,
    preview: "Don't forget to bring your lab notebook, calculator, and safety goggles…",
    timeLabel: '10:24 AM',
    attachments: [{ name: 'Lab Pre-Lab Questions.pdf', size: '245 KB' }],
    messages: [
      {
        id: 'm1',
        sender: 'Mr. Morgan',
        senderId: 'tea-morgan',
        time: '2026-09-17T10:24:00',
        sentByMe: false,
        read: false,
        body: "Hi everyone,\n\nJust a reminder to bring your lab notebook, calculator, and safety goggles to tomorrow's lab. We will be working with the equilibrium experiment, so please make sure you have completed the pre-lab questions.\n\nLet me know if you have any questions.\n\nMr. Morgan",
      },
      {
        id: 'm2',
        sender: 'Me',
        senderId: 'stu-alex',
        time: '2026-09-17T10:27:00',
        sentByMe: true,
        read: true,
        body: 'Thank you! Will we need to turn in the pre-lab before class?',
      },
      {
        id: 'm3',
        sender: 'Mr. Morgan',
        senderId: 'tea-morgan',
        time: '2026-09-17T10:29:00',
        sentByMe: false,
        read: true,
        body: 'Yes, please have it submitted on Google Classroom before the start of class.',
      },
    ],
  },
  {
    id: 't2',
    courseIds: [],
    authorId: null,
    participants: 'Guidance Office',
    subject: 'College Fair Next Week',
    category: 'School',
    unread: true,
    preview: 'The fall college fair will be held on…',
    timeLabel: '9:12 AM',
    attachments: [],
    messages: [
      {
        id: 'm4',
        sender: 'Guidance Office',
        senderId: null,
        time: '2026-09-17T09:12:00',
        sentByMe: false,
        read: false,
        body: 'The fall college fair will be held on September 24 in the Main Gym from 1:00 to 4:00 PM. Over 50 colleges will be represented. Sign up in Guidance.',
      },
    ],
  },
  {
    id: 't3',
    courseIds: [],
    authorId: null,
    participants: 'Student Council',
    subject: 'Meeting Tomorrow',
    category: 'Clubs',
    unread: true,
    preview: 'Reminder that our Student Council…',
    timeLabel: 'Yesterday',
    attachments: [],
    messages: [
      {
        id: 'm5',
        sender: 'Student Council',
        senderId: null,
        time: '2026-09-16T15:10:00',
        sentByMe: false,
        read: false,
        body: 'Reminder that our Student Council meeting is tomorrow at 3:00 PM in Room 142. See you there!',
      },
    ],
  },
  {
    id: 't4',
    courseIds: [],
    authorId: null,
    participants: 'Williamsville East',
    subject: 'Homecoming Information',
    category: 'School',
    unread: false,
    preview: 'Tickets for the homecoming game are…',
    timeLabel: 'Sep 15',
    attachments: [],
    messages: [
      {
        id: 'm6',
        sender: 'Williamsville East',
        senderId: null,
        time: '2026-09-15T12:00:00',
        sentByMe: false,
        read: true,
        body: 'Tickets for the homecoming game are now available in the main office. $5 for students.',
      },
    ],
  },
  {
    id: 't5',
    courseIds: ['c-ushist'],
    authorId: null,
    participants: 'AP U.S. History',
    subject: 'Unit 2 Resources',
    category: 'Classes',
    unread: false,
    preview: "I've attached the reading guide and…",
    timeLabel: 'Sep 15',
    attachments: [],
    messages: [
      {
        id: 'm7',
        sender: 'Mrs. Smith',
        senderId: null,
        time: '2026-09-15T08:30:00',
        sentByMe: false,
        read: true,
        body: "I've attached the reading guide and primary sources for Unit 2. Please review before Monday.",
      },
    ],
  },
  {
    id: 't6',
    courseIds: ['c-psych'],
    authorId: null,
    participants: 'Mrs. Hart',
    subject: 'Psychology Notes',
    category: 'Classes',
    unread: false,
    preview: "Here are the notes from today's lecture…",
    timeLabel: 'Sep 14',
    attachments: [],
    messages: [
      {
        id: 'm8',
        sender: 'Mrs. Hart',
        senderId: null,
        time: '2026-09-14T14:00:00',
        sentByMe: false,
        read: true,
        body: "Here are the notes from today's lecture on research methods.",
      },
    ],
  },
  {
    id: 't7',
    courseIds: ['c-precalc'],
    authorId: null,
    participants: 'Mr. Lee',
    subject: 'Worksheet Clarification',
    category: 'Classes',
    unread: false,
    preview: 'A few students had questions about…',
    timeLabel: 'Sep 14',
    attachments: [],
    messages: [
      {
        id: 'm9',
        sender: 'Mr. Lee',
        senderId: null,
        time: '2026-09-14T10:00:00',
        sentByMe: false,
        read: true,
        body: 'A few students had questions about problem 7 on Worksheet 4.1 — you may use either identity form.',
      },
    ],
  },
  {
    id: 't8',
    courseIds: [],
    authorId: null,
    participants: 'Science Olympiad',
    subject: 'Practice Schedule',
    category: 'Clubs',
    unread: false,
    preview: 'Our next practice will be on Thursday…',
    timeLabel: 'Sep 13',
    attachments: [],
    messages: [
      {
        id: 'm10',
        sender: 'Science Olympiad',
        senderId: null,
        time: '2026-09-13T16:00:00',
        sentByMe: false,
        read: true,
        body: 'Our next practice will be on Thursday after school in Room 305.',
      },
    ],
  },
  {
    id: 't9',
    courseIds: [],
    authorId: null,
    participants: 'District Communications',
    subject: 'Important Bus Update',
    category: 'School',
    unread: false,
    preview: 'Due to road construction, some bus…',
    timeLabel: 'Sep 13',
    attachments: [],
    messages: [
      {
        id: 'm11',
        sender: 'District Communications',
        senderId: null,
        time: '2026-09-13T09:00:00',
        sentByMe: false,
        read: true,
        body: 'Due to road construction, some bus routes may experience 5–10 minute delays through September.',
      },
    ],
  },
  {
    id: 't10',
    courseIds: [],
    authorId: null,
    participants: 'TSA',
    subject: 'Regional Competition Details',
    category: 'Clubs',
    unread: false,
    preview: 'Information about registration and…',
    timeLabel: 'Sep 12',
    attachments: [],
    messages: [
      {
        id: 'm12',
        sender: 'TSA',
        senderId: null,
        time: '2026-09-12T12:00:00',
        sentByMe: false,
        read: true,
        body: 'Information about registration and event categories for the regional competition is now posted.',
      },
    ],
  },
]);

export const guidanceItems: GuidanceItem[] = [
  { id: 'gd1', title: 'College Fair', date: '2026-09-18', location: 'Main Gym', description: 'Over 50 colleges represented. Bring your student ID.', category: 'College', registrationRequired: false, eligibleGrades: '9–12', sourceLabel: 'Guidance Office' },
  { id: 'gd2', title: 'PSAT/NMSQT Registration', date: '2026-09-20', location: 'Guidance Office', description: 'Registration deadline for the October PSAT.', category: 'Testing', registrationRequired: true, eligibleGrades: '10–11', sourceLabel: 'Guidance Office' },
  { id: 'gd3', title: 'Naviance Session: College Essays', date: '2026-09-28', location: 'Room 210', description: 'Workshop on drafting your college essay.', category: 'College', registrationRequired: true, eligibleGrades: '11–12', sourceLabel: 'Guidance Office' },
];

export const resourceLinks: ResourceLink[] = [
  { id: 'r1', title: 'Google Classroom', subtitle: 'Open your classes', url: 'https://classroom.google.com', icon: 'classroom' },
  { id: 'r2', title: 'eSchoolData', subtitle: 'View full academic record', url: 'https://eschool.example', icon: 'school' },
  { id: 'r3', title: 'Naviance', subtitle: 'College & career planning', url: 'https://naviance.example', icon: 'compass' },
  { id: 'r4', title: 'Library Resources', subtitle: 'Research, databases, more', url: 'https://library.example', icon: 'book' },
  { id: 'r5', title: 'Tutoring', subtitle: 'NHS, peer tutoring, support', url: 'https://tutoring.example', icon: 'people' },
  { id: 'r6', title: 'Course Requests', subtitle: 'View and plan for next year', url: 'https://requests.example', icon: 'clipboard' },
  { id: 'r7', title: 'Report an Absence', subtitle: 'Notify the school', url: 'https://absence.example', icon: 'mail' },
  { id: 'r8', title: 'School Website', subtitle: 'williamsville.example', url: 'https://williamsville.example', icon: 'globe' },
];

export const studentSchedule: ScheduleBlock[] = [
  { courseId: 'c-physics', period: 1, startTime: '8:05 AM', endTime: '8:47 AM', attended: 'attended', arrivalTime: null },
  { courseId: 'c-precalc', period: 2, startTime: '8:52 AM', endTime: '9:34 AM', attended: 'attended', arrivalTime: null },
  { courseId: 'c-chem', period: 3, startTime: '10:05 AM', endTime: '10:47 AM', attended: 'upcoming', arrivalTime: null },
  { courseId: 'c-ushist', period: 4, startTime: '10:52 AM', endTime: '11:34 AM', attended: 'upcoming', arrivalTime: null },
  { courseId: 'c-lang', period: 5, startTime: '12:18 PM', endTime: '1:00 PM', attended: 'upcoming', arrivalTime: null },
  { courseId: 'c-psych', period: 6, startTime: '1:05 PM', endTime: '1:47 PM', attended: 'upcoming', arrivalTime: null },
];

export const announcements = [
  { id: 'an1', title: 'College Fair Next Week', body: 'Williamsville East will be hosting over 50 colleges on September 24. Sign up in Guidance.' },
];

export const recentActivity = [
  { id: 'ra1', title: 'Lab Reminder', subtitle: 'Mr. Morgan – AP Chemistry', timeLabel: '10:24 AM' },
  { id: 'ra2', title: 'College Fair Next Week', subtitle: 'Guidance Office', timeLabel: '9:12 AM' },
  { id: 'ra3', title: 'Student Council Meeting Tomorrow', subtitle: 'Student Council', timeLabel: 'Yesterday' },
];

export const teacherClasses = [
  { id: 'c-chem', name: 'AP Chemistry – Period 3', room: '220', studentCount: 24, nextAction: 'Grade Unit 1 Tests (12 remaining)' },
  { id: 'c-chem2', name: 'AP Chemistry – Period 7', room: '220', studentCount: 22, nextAction: 'Post lab materials' },
  { id: 'c-forensic', name: 'Forensic Science – Period 5', room: '222', studentCount: 28, nextAction: 'Review safety contracts' },
];

export const teacherRoster = [
  { id: 'sr1', name: 'Avery Chen', gradePercent: 95, absences: 0 },
  { id: 'sr2', name: 'Jordan Diaz', gradePercent: 82, absences: 2 },
  { id: 'sr3', name: 'Sam Ellis', gradePercent: 78, absences: 1 },
  { id: 'sr4', name: 'Morgan Fisher', gradePercent: 91, absences: 0 },
  { id: 'sr5', name: 'Riley Grant', gradePercent: 88, absences: 3 },
  { id: 'sr6', name: 'Taylor Hayes', gradePercent: 85, absences: 1 },
];

// September 2026 attendance dots for the monthly calendar view (prototype: fixed data).
export const monthlyAttendance: Record<number, 'present' | 'tardy' | 'absent' | 'no-school'> = {
  1: 'present',
  2: 'tardy',
  3: 'present',
  4: 'present',
  8: 'present',
  9: 'present',
  10: 'present',
  11: 'absent',
  14: 'present',
  15: 'present',
  16: 'tardy',
  17: 'present',
};

export const bellSchedule = [
  { period: 1, start: '8:05 AM', end: '8:47 AM' },
  { period: 2, start: '8:52 AM', end: '9:34 AM' },
  { period: 3, start: '10:05 AM', end: '10:47 AM' },
  { period: 4, start: '10:52 AM', end: '11:34 AM' },
  { period: 5, start: '12:18 PM', end: '1:00 PM' },
  { period: 6, start: '1:05 PM', end: '1:47 PM' },
];

export const reminders = [
  'Bring lab notebook (AP Chemistry)',
  'Student Council meeting at 3:00 PM',
];

// Period-by-period meeting map for teacher schedule views.
export const teacherTodaySchedule = [
  { period: 1, label: 'Hall Duty', time: '8:05 – 8:47 AM' },
  { period: 3, label: 'AP Chemistry', time: '10:05 – 10:47 AM' },
  { period: 5, label: 'Forensic Science', time: '12:18 – 1:00 PM' },
  { period: 7, label: 'AP Chemistry', time: '1:05 – 1:47 PM' },
];
