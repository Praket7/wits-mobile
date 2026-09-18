import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { WitsLogoHeader } from '@/components/brand';
import { Card, ListRow, Screen, SectionHeader, StatusPill } from '@/components/ui';
import { IconCalendar, IconPeople } from '@/components/icons';
import { space } from '@/design/tokens';
import { useTeacherClasses } from '@/queries/useWits';

// Mock pending-grading + next-meeting metadata keyed by class name prefix
// (item 17). The district API replaces this with real aggregation.
const METADATA: Record<string, { pendingGrading: number; nextMeeting: string; period: string }> = {
  'AP Chemistry': { pendingGrading: 12, nextMeeting: 'Thu 10:05 AM', period: 'P3 + P7' },
  Forensic: { pendingGrading: 4, nextMeeting: 'Fri 12:18 PM', period: 'P5' },
};

export default function TeacherClasses() {
  const classes = useTeacherClasses();

  return (
    <Screen>
      <WitsLogoHeader initials="MB" onBellPress={() => router.push('/(teacher)/(tabs)/more' as never)}
        onAvatarPress={() => router.push('/(teacher)/(tabs)/more' as never)}/>
      <Text style={styles.title}>Classes</Text>
      <SectionHeader title="My Classes" icon={<IconCalendar size={20} />} />
      <Card>
        {(classes.data ?? []).map((c) => {
          const meta = Object.keys(METADATA).find((k) => c.name.startsWith(k));
          const m = meta ? METADATA[meta] : { pendingGrading: 0, nextMeeting: '—', period: '—' };
          return (
            <ListRow
              key={c.id}
              title={c.name}
              subtitle={`Period ${m.period} • Room ${c.room} • ${c.studentCount} students\nNext meeting ${m.nextMeeting}`}
              left={<IconPeople size={22} />}
              chevron
              onPress={() => router.push(`/(teacher)/class/${c.id}` as never)}
              right={
                m.pendingGrading > 0 ? (
                  <StatusPill label={`${m.pendingGrading} to grade`} tone="warning" />
                ) : (
                  <StatusPill label="Graded" tone="success" />
                )
              }
            />
          );
        })}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '700', marginTop: space.sm, marginBottom: space.md },
});
