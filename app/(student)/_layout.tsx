import { Redirect, Slot } from 'expo-router';
import React from 'react';
import { useSession } from '@/state/appState';

/**
 * Group-level role guard (audit P0/P1 — role isolation):
 * • Students and parents may be here: parents view their child's detail
 *   screens (course, attendance, guidance) by design (plan §15).
 * • Teachers can never sit inside student routes — deep links included.
 * The tabs layout additionally bounces a parent out of student tab roots.
 */
export default function StudentGroupLayout() {
  const { loggedIn, role } = useSession();
  if (!loggedIn) return <Redirect href="/(auth)/login" />;
  if (role === 'teacher') return <Redirect href="/(teacher)/(tabs)/today" />;
  return <Slot />;
}
