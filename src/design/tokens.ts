import { Platform } from 'react-native';

export const colors = {
  background: '#F7F8FA',
  surface: '#FFFFFF',
  text: '#16181D',
  textSecondary: '#5D6673',
  border: '#E2E5E9',

  brandRed: '#C8102E',
  brandRedDark: '#A90E27',
  brandGold: '#FFB81C',

  success: '#137333',
  successBg: '#E6F4EA',
  warning: '#A15C00',
  warningBg: '#FEF7E0',
  danger: '#B5121B',
  dangerBg: '#FCE8E6',
  infoBg: '#E8F0FE',

  bandBg: '#7A0A1B',
};

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const radius = {
  control: 12,
  card: 16,
  pill: 999,
};

// Plan §4.2 typography: body 17 on iOS / 16 on Android; system fonts only.
export const type = {
  screenTitle: { fontSize: 30, fontWeight: '700' as const },
  sectionTitle: { fontSize: 22, fontWeight: '700' as const },
  headline: { fontSize: 17, fontWeight: '600' as const },
  body: {
    fontSize: Platform.OS === 'ios' ? 17 : 16,
    fontWeight: '400' as const,
  },
  subhead: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  bigMetric: { fontSize: 32, fontWeight: '700' as const },
};

export const shadow = {
  card: {
    shadowColor: '#16181D',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
};

export const theme = { colors, space, radius, type, shadow };
