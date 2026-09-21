/**
 * Capability system (plan §11, audit P0): what the *backend* can do.
 *
 * Fail-closed by design: production defaults every mutating capability to
 * `false` and only enables what the authenticated server explicitly declares
 * via GET /v1/capabilities (audit fix — demo state can no longer leak into
 * HTTP mode). Demo mode applies DEMO_CAPABILITIES, which unlock the prototype's
 * in-memory demo-database writes.
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

/** Prototype-only writes against the in-memory demo database (P0.8, §10.6). */
export const DEMO_CAPABILITIES: Capabilities = {
  messagingReply: true,
  messagingCompose: true,
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

/**
 * Production baseline (audit P0): nothing is assumed. Every district-managed
 * mutation stays hidden until /v1/capabilities says otherwise.
 */
export const PRODUCTION_CAPABILITIES: Capabilities = {
  messagingReply: false,
  messagingCompose: false,
  attendanceReporting: false,
  teacherAttendanceWrite: false,
  teacherAnnouncements: false,
  forms: false,
  transportation: false,
  lunch: false,
  googleClassroomLinks: false,
  notificationPush: false,
  eventReminders: false,
  reportCards: false,
};

let current: Capabilities = { ...PRODUCTION_CAPABILITIES };
/** Which baseline `current` was seeded from — used by config diagnostics. */
let source: 'production' | 'demo' = 'production';

export function getCapabilities(): Capabilities {
  return current;
}

export function getCapabilitiesSource(): 'production' | 'demo' {
  return source;
}

/**
 * Merge a (partial or full) capability declaration over the correct baseline.
 * `base: 'demo'` is only ever called from mock mode / demo-server wiring.
 */
export function setCapabilities(
  next: Partial<Capabilities>,
  base: 'production' | 'demo' = 'production',
): void {
  const baseline = base === 'demo' ? DEMO_CAPABILITIES : PRODUCTION_CAPABILITIES;
  current = { ...baseline, ...next };
  source = base;
}

/** Reset to the fail-closed production set (used on logout/session change). */
export function resetCapabilities(): void {
  current = { ...PRODUCTION_CAPABILITIES };
  source = 'production';
}
