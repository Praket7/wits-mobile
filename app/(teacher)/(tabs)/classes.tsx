import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { WitsLogoHeader } from '@/components/BrandBand';
import { Card, ListRow, Screen, SectionHeader } from '@/components/ui';
import { IconCalendar, IconPeople } from '@/components/icons';
import { space } from '@/design/tokens';
import { teacherClasses } from '@/data/fixtures/data';

export default function TeacherClasses() {
  return (
    <Screen>
      <WitsLogoHeader initials="MB" />
      <Text style={styles.title}>Classes</Text>
      <SectionHeader title="My Classes" icon={<IconCalendar size={20} />} />
      <Card>
        {teacherClasses.map((c) => (
          <ListRow
            key={c.id}
            title={c.name}
            subtitle={`Room ${c.room} • ${c.studentCount} students`}
            left={<IconPeople size={22} />}
            chevron
            onPress={() => router.push(`/(teacher)/class/${c.id}` as never)}
          />
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '700', marginTop: space.sm, marginBottom: space.md },
});
