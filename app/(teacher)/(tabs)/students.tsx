import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { WitsLogoHeader } from '@/components/BrandBand';
import { Card, ListRow, Screen, SectionHeader, StatusPill } from '@/components/ui';
import { IconPeople } from '@/components/icons';
import { space } from '@/design/tokens';
import { teacherRoster } from '@/data/fixtures/data';

export default function TeacherStudents() {
  return (
    <Screen>
      <WitsLogoHeader initials="MB" />
      <Text style={styles.title}>Students</Text>
      <SectionHeader title="Roster (AP Chemistry – Period 3)" icon={<IconPeople size={20} />} />
      <Card>
        {teacherRoster.map((s) => (
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
