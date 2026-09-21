import { Redirect, Slot } from 'expo-router';
import React from 'react';
import { useSession } from '@/state/appState';

/**
 * Group-level role guard (audit P0/P1 — role isolation): only parents may be
 * inside the parent group. Students and teachers are bounced to their own
 * homes, so a deep link can never land a wrong role in a parent route.
 */
export default function ParentGroupLayout() {
  const { loggedIn, role } = useSession();
  if (!loggedIn) return <Redirect href="/(auth)/login" />;
  if (role === 'student') return <Redirect href="/(student)/(tabs)/today" />;
  if (role === 'teacher') return <Redirect href="/(teacher)/(tabs)/today" />;
  return <Slot />;
}
