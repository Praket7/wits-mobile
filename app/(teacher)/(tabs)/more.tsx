import React from 'react';
import { Text } from 'react-native';
import { WitsLogoHeader } from '@/components/BrandBand';
import { Card, ListRow, Screen, SectionHeader, SegmentedControl } from '@/components/ui';
import { useSession } from '@/state/appState';
import type { Role } from '@/domain/schemas';

export default function TeacherMore() {
  const { signOut, role, setRole } = useSession();
  return (
    <Screen>
      <WitsLogoHeader initials="MB" />
      <Text style={{ fontSize: 30, fontWeight: '700', marginTop: 8, marginBottom: 16 }}>More</Text>
      <SectionHeader title="Prototype Role (dev)" />
      <Card>
        <SegmentedControl options={['student', 'parent', 'teacher']} value={role} onChange={(v) => setRole(v as Role)} />
      </Card>
      <Card>
        <ListRow title="Sign Out" onPress={signOut} right={<Text style={{ color: '#B5121B', fontWeight: '600' }}>Sign Out</Text>} />
      </Card>
    </Screen>
  );
}
