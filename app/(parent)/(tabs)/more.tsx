import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { WitsLogoHeader } from '@/components/BrandBand';
import { Card, ListRow, Screen, SectionHeader, SegmentedControl } from '@/components/ui';
import { IconBell, IconPeople } from '@/components/icons';
import { colors, space } from '@/design/tokens';
import { useNotificationPrefs, useStudents } from '@/queries/useWits';
import { useSession } from '@/state/appState';
import type { Role } from '@/domain/schemas';

export default function ParentMore() {
  const { signOut, role, setRole, selectedStudentId, setSelectedStudentId } = useSession();
  const students = useStudents().data;
  const { prefs, update, ready } = useNotificationPrefs();

  return (
    <Screen>
      <WitsLogoHeader initials="PG" />
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

      <SectionHeader title="Notification Preferences" icon={<IconBell size={20} />} />
      <Card>
        {ready && prefs && (
          <>
            <PrefRow label="Grades" value={prefs.grades} onChange={(v) => update({ grades: v })} />
            <PrefRow label="Attendance" value={prefs.attendance} onChange={(v) => update({ attendance: v })} />
            <PrefRow label="Assignments" value={prefs.assignments} onChange={(v) => update({ assignments: v })} />
            <PrefRow label="Messages" value={prefs.messages} onChange={(v) => update({ messages: v })} />
            <PrefRow label="School Events" value={prefs.events} onChange={(v) => update({ events: v })} />
          </>
        )}
      </Card>

      <SectionHeader title="Prototype Role (dev)" />
      <Card>
        <Text style={styles.roleNote}>Production derives role from SSO. This switch is prototype-only.</Text>
        <View style={{ marginTop: space.md }}>
          <SegmentedControl options={['student', 'parent', 'teacher']} value={role} onChange={(v) => setRole(v as Role)} />
        </View>
      </Card>

      <Card>
        <ListRow title="Sign Out" onPress={signOut} right={<Text style={styles.signOut}>Sign Out</Text>} />
      </Card>
    </Screen>
  );
}

function PrefRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.prefRow}>
      <Text style={styles.prefLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={`${label} notifications`}
        trackColor={{ false: '#E2E5E9', true: colors.brandRed }}
      />
    </View>
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
