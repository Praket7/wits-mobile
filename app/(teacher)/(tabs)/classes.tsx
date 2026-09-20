import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { WitsLogoHeader } from '@/components/brand';
import { Card, ListRow, Screen, SectionHeader, StatusPill } from '@/components/ui';
import { IconCalendar, IconPeople } from '@/components/icons';
import { space } from '@/design/tokens';
import { useTeacherClasses } from '@/queries/useWits';

/**
 * Teacher Classes (P0.13): every row field — period, room, enrollment, next
 * meeting, pending grading — comes from the repository's TeacherClass model.
 * No screen-local metadata map.
 */
export default function TeacherClasses() {
  const classes = useTeacherClasses();

  return (
    <Screen>
      <WitsLogoHeader initials="MB" onBellPress={() => router.push('/(teacher)/(tabs)/more' as never)}
        onAvatarPress={() => router.push('/(teacher)/(tabs)/more' as never)}/>
      <Text style={styles.title}>Classes</Text>
      <SectionHeader title="My Classes" icon={<IconCalendar size={20} />} />
      <Card>
        {(classes.data ?? []).map((c) => (
          <ListRow
            key={c.id}
            title={c.name}
            subtitle={`Period ${c.period ?? '—'} • Room ${c.room} • ${c.studentCount} students${
              c.nextMeeting ? `\nNext meeting ${c.nextMeeting}` : ''
            }`}
            left={<IconPeople size={22} />}
            chevron
            onPress={() => router.push(`/(teacher)/class/${c.id}` as never)}
            right={
              (c.pendingGrading ?? 0) > 0 ? (
                <StatusPill label={`${c.pendingGrading} to grade`} tone="warning" />
              ) : (
                <StatusPill label="Graded" tone="success" />
              )
            }
          />
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '700', marginTop: space.sm, marginBottom: space.md },
});
