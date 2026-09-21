import { getCapabilities } from './capabilities';

/**
 * Feature flags (item 121) — build-level switches only. Anything that depends
 * on what the *backend* supports is derived from the capability system
 * (audit P1: the two systems can no longer disagree).
 */
const base = {
  teacherMode: true,
  parentMode: true,
  realSso: false,
  pushNotifications: false,
  notificationDigest: false,
} as const;

export const features = {
  ...base,
  // Live-derived from capabilities so demo/HTTP/production stay consistent.
  get googleClassroom() {
    return getCapabilities().googleClassroomLinks;
  },
  get transportation() {
    return getCapabilities().transportation;
  },
  get lunchMenu() {
    return getCapabilities().lunch;
  },
  get formsSigning() {
    return getCapabilities().forms;
  },
  get messagingReply() {
    return getCapabilities().messagingReply;
  },
  get eventReminders() {
    return getCapabilities().eventReminders;
  },
} as const;

export type FeatureName = keyof typeof features;
