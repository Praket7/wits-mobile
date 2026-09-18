import { colors } from '@/design/tokens';

/**
 * Semantic color roles (item 105): keeps brandRed from being overloaded for
 * errors, emergencies, navigation, and branding. Screens should prefer these.
 */
export const semantic = {
  actionPrimary: colors.brandRed,
  critical: colors.danger,
  warning: colors.warning,
  success: colors.success,
  info: '#1A73E8',
  /** Reserved exclusively for emergency/closure styling (item 104). */
  emergency: '#8B0000',
} as const;

/**
 * Feature flags (item 121): UI exposes only what the backend supports. District
 * pilots flip these rather than shipping half-built capabilities (items 20§99,
 * 199, 200, 201).
 */
export const features = {
  teacherMode: true,
  parentMode: true,
  realSso: false,
  pushNotifications: false,
  googleClassroom: true,
  transportation: false,
  lunchMenu: false,
  formsSigning: false,
  messagingReply: true,
  eventReminders: true,
  notificationDigest: false,
} as const;

export type FeatureName = keyof typeof features;
