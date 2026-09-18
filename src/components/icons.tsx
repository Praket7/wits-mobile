import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '@/design/tokens';

type IconProps = { size?: number; color?: string };

const make =
  (name: keyof typeof Ionicons.glyphMap, defaultColor?: string) => {
    const Icon = ({ size = 20, color = defaultColor ?? colors.brandRed }: IconProps) => (
      <Ionicons name={name} size={size} color={color} />
    );
    Icon.displayName = `Icon${name.charAt(0).toUpperCase()}${name.slice(1)}`;
    return Icon;
  };

export const IconHome = make('home');
export const IconHomeFilled = make('home');
export const IconBook = make('book-outline');
export const IconCalendar = make('calendar-outline');
export const IconMail = make('mail-outline');
export const IconMailUnread = make('mail');
export const IconMore = make('ellipsis-horizontal');
export const IconBell = make('notifications-outline');
export const IconBellFilled = make('notifications');
export const IconDoc = make('document-outline');
export const IconDocText = make('document-text-outline');
export const IconFlask = ({ size = 20, color = '#FFFFFF' }: IconProps) => (
  <Ionicons name="flask" size={size} color={color} />
);
export const IconPeople = make('people');
export const IconPerson = make('person-outline');
export const IconMega = make('megaphone-outline');
export const IconTrophy = make('trophy-outline');
export const IconGlobe = make('globe-outline');
export const IconGradCap = make('school-outline');
export const IconClock = make('time-outline');
export const IconPin = make('location-outline');
export const IconStats = make('bar-chart-outline');
export const IconStar = make('star-outline');
export const IconLink = make('link');
export const IconCompass = make('compass-outline');
export const IconClipboard = make('clipboard-outline');
export const IconFolder = make('folder-open-outline');
export const IconChevronRight = make('chevron-forward', '#9AA2AE');
export const IconChevronBack = make('chevron-back', colors.brandRed);
export const IconSearch = make('search', colors.textSecondary);
export const IconSliders = make('options-outline', colors.textSecondary);
export const IconCheck = make('checkmark', colors.success);
export const IconCheckCircle = make('checkmark-circle', colors.success);
export const IconInfo = make('information-circle-outline');
export const IconDownload = make('download-outline', colors.textSecondary);
export const IconAttach = make('attach', colors.textSecondary);
export const IconOpenExternal = make('open-outline', colors.brandRed);
export const IconAlert = make('alert-circle-outline', colors.danger);
export const IconEye = make('eye-outline');
export const IconAdd = make('add', colors.textSecondary);
export const IconSend = make('paper-plane', '#FFFFFF');
export const IconCheckbox = make('checkbox', colors.brandRed);
export const IconCheckboxBlue = make('checkbox', '#1A73E8');
export const IconCheckboxPurple = make('checkbox', '#7B4DAA');
export const IconCheckboxGold = make('checkbox', colors.brandGold);
export const IconSquareGreen = make('square-outline', colors.success);
export const IconSquareOrange = make('square-outline', '#E8710A');
export const IconGlasses = make('glasses-outline', colors.textSecondary);

export function IconGoogle({ size = 22 }: { size?: number }) {
  return (
    <Ionicons name="logo-google" size={size} color="#4285F4" />
  );
}
