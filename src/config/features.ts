import { getCapabilities } from './capabilities';

/**
 * Feature flags (item 121) — build-level switches only. Anything that depends
 * on what the *backend* supports is derived from the capability system
 * (audit P1: the two systems can no longer disagree).
 *
 * Capability-derived flags are LIVE getters. They are attached with
 * Object.defineProperties rather than object-literal getters after a spread —
 * a spread would evaluate each getter once at module load and freeze the
 * value, silently decoupling `features` from `getCapabilities()`.
 */
const base = {
  teacherMode: true,
  parentMode: true,
  realSso: false,
  pushNotifications: false,
  notificationDigest: false,
} as const;

/** Capability → feature mapping (single source of truth: the server). */
const derived = {
  googleClassroom: () => getCapabilities().googleClassroomLinks,
  transportation: () => getCapabilities().transportation,
  lunchMenu: () => getCapabilities().lunch,
  formsSigning: () => getCapabilities().forms,
  messagingReply: () => getCapabilities().messagingReply,
  eventReminders: () => getCapabilities().eventReminders,
} as const;

export const features = Object.defineProperties(
  { ...base },
  Object.fromEntries(
    Object.entries(derived).map(([name, get]) => [
      name,
      { enumerable: true, get },
    ]),
  ),
) as typeof base & { readonly [K in keyof typeof derived]: boolean };

export type FeatureName = keyof typeof features;
