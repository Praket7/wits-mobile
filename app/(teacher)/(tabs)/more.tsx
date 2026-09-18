import { router } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';
import { WitsLogoHeader } from '@/components/brand';
import { Card, ListRow, Screen, SegmentedControl } from '@/components/ui';
import { useSession } from '@/state/appState';
import type { Role } from '@/domain/schemas';

export default function TeacherMore() {
  const { signOut, role, setRole } = useSession();
  return (
    <Screen>
      <WitsLogoHeader initials="MB" onBellPress={() => router.push('/(teacher)/(tabs)/more' as never)}
        onAvatarPress={() => router.push('/(teacher)/(tabs)/more' as never)}/>
      <Text style={{ fontSize: 30, fontWeight: '700', marginTop: 8, marginBottom: 16 }}>More</Text>
      {/* Dev-only role switcher (plan item 4): hidden in preview/release builds. */}
      {__DEV__ && (
        <Card>
          <SegmentedControl options={['student', 'parent', 'teacher']} value={role} onChange={(v) => setRole(v as Role)} />
        </Card>
      )}
      <Card>
        <ListRow title="Sign Out" onPress={signOut} right={<Text style={{ color: '#B5121B', fontWeight: '600' }}>Sign Out</Text>} />
      </Card>
    </Screen>
  );
}
