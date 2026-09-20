/**
 * Capability system (plan §11): what the *backend* can do, as opposed to
 * `features` (what this prototype build chooses to show). Demo mode returns
 * synthetic capabilities; production replaces this with GET /v1/capabilities
 * and the UI derives availability from it — no hard-coded assumptions.
 */
export type Capabilities = {
  messagingReply: boolean;
  messagingCompose: boolean;
  attendanceReporting: boolean;
  teacherAttendanceWrite: boolean;
  teacherAnnouncements: boolean;
  forms: boolean;
  transportation: boolean;
  lunch: boolean;
  googleClassroomLinks: boolean;
  notificationPush: boolean;
  eventReminders: boolean;
  reportCards: boolean;
};

const demoCapabilities: Capabilities = {
  messagingReply: true,
  messagingCompose: true,
  // Prototype-only writes to the in-memory demo database (P0.8, §10.6).
  // Production hides each flow until the district backend supports it.
  attendanceReporting: true,
  teacherAttendanceWrite: true,
  teacherAnnouncements: true,
  forms: true,
  transportation: false,
  lunch: false,
  googleClassroomLinks: true,
  notificationPush: false,
  eventReminders: true,
  reportCards: true,
};

let current: Capabilities = { ...demoCapabilities };

export function getCapabilities(): Capabilities {
  return current;
}

/** Production: replace the in-memory set with the server's declaration. */
export function setCapabilities(next: Partial<Capabilities>): void {
  current = { ...demoCapabilities, ...next };
}

export const DEMO_CAPABILITIES: Capabilities = demoCapabilities;
