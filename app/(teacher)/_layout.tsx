import { Redirect, Slot } from 'expo-router';
import React from 'react';
import { useSession } from '@/state/appState';

/**
 * Group-level role guard (audit P0/P1 — role isolation): only teachers may be
 * inside the teacher group. Students and parents are bounced to their own
 * homes, so a deep link can never land a wrong role in a teacher route.
 */
export default function TeacherGroupLayout() {
  const { loggedIn, role } = useSession();
  if (!loggedIn) return <Redirect href="/(auth)/login" />;
  if (role === 'student') return <Redirect href="/(student)/(tabs)/today" />;
  if (role === 'parent') return <Redirect href="/(parent)/(tabs)/today" />;
  return <Slot />;
}
