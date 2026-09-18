import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { WitsLogoHeader } from '@/components/brand';
import { Card, ListRow, Screen, SectionHeader, StatusPill } from '@/components/ui';
import { IconPeople } from '@/components/icons';
import { space } from '@/design/tokens';
import { useTeacherRoster } from '@/queries/useWits';

export default function TeacherStudents() {
  const roster = useTeacherRoster('c-chem');

  return (
    <Screen>
      <WitsLogoHeader initials="MB" />
      <Text style={styles.title}>Students</Text>
      <SectionHeader title="Roster (AP Chemistry – Period 3)" icon={<IconPeople size={20} />} />
      <Card>
        {(roster.data ?? []).map((s) => (
          <ListRow
            key={s.id}
            title={s.name}
            subtitle={`${s.absences} absence${s.absences === 1 ? '' : 's'}`}
            right={
              <StatusPill
                label={`${s.gradePercent}%`}
                tone={s.gradePercent >= 90 ? 'success' : s.gradePercent >= 80 ? 'warning' : 'danger'}
              />
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
