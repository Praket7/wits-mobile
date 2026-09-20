import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WitsLogoHeader } from '@/components/brand';
import { Card, ListRow, Screen, SectionHeader, SegmentedControl } from '@/components/ui';
import { IconPeople } from '@/components/icons';
import { colors, space } from '@/design/tokens';
import { useStudents } from '@/queries/useWits';
import { useSession } from '@/state/appState';
import type { Role } from '@/domain/schemas';

export default function ParentMore() {
  const { signOut, role, setRole, selectedStudentId, setSelectedStudentId } = useSession();
  const students = useStudents().data;

  return (
    <Screen>
      <WitsLogoHeader onBellPress={() => router.push('/(parent)/(tabs)/more' as never)}
        onAvatarPress={() => router.push('/(parent)/(tabs)/more' as never)}/>
      <Text style={styles.screenTitle}>More</Text>

      <SectionHeader title="My Students" icon={<IconPeople size={20} />} actionLabel="See All" onAction={() => router.push('/(parent)/students' as never)} />
      <Card>
        {(students ?? []).map((s) => (
          <ListRow
            key={s.id}
            title={s.name}
            subtitle={`Grade ${s.grade} • ${s.school}`}
            right={s.id === selectedStudentId ? <Text style={styles.check}>✓</Text> : null}
            onPress={() => setSelectedStudentId(s.id)}
          />
        ))}
      </Card>

      {/* Item 22: More keeps only the navigation row — full controls live on
          the dedicated Notification Preferences screen. */}

      {/* Dev-only role switcher (plan item 4): hidden in preview/release builds. */}
      {__DEV__ && (
        <>
          <SectionHeader title="Prototype Role (dev)" />
          <Card>
            <Text style={styles.roleNote}>Production derives role from SSO. This switch is prototype-only.</Text>
            <View style={{ marginTop: space.md }}>
              <SegmentedControl options={['student', 'parent', 'teacher']} value={role} onChange={(v) => setRole(v as Role)} />
            </View>
          </Card>
        </>
      )}

      <Card>
        <ListRow title="Sign Out" onPress={signOut} right={<Text style={styles.signOut}>Sign Out</Text>} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenTitle: { fontSize: 30, fontWeight: '700', color: colors.text, marginTop: space.sm, marginBottom: space.md },
  prefRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: space.sm, minHeight: 44 },
  prefLabel: { fontSize: 16, color: colors.text },
  roleNote: { fontSize: 13, color: colors.textSecondary },
  check: { color: colors.brandRed, fontWeight: '700', fontSize: 16 },
  signOut: { color: colors.danger, fontWeight: '600' },
});
