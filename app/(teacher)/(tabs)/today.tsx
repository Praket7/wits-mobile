import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { BrandBand, WitsLogoHeader } from '@/components/BrandBand';
import { Card, ListRow, Screen, SectionHeader, StatusPill } from '@/components/ui';
import {
  IconBell,
  IconCalendar,
  IconClipboard,
  IconDocText,
  IconMail,
  IconPeople,
  IconPin,
  IconStats,
} from '@/components/icons';
import { colors, space } from '@/design/tokens';
import { teacherClasses } from '@/data/fixtures/data';

export default function TeacherToday() {
  return (
    <Screen>
      <WitsLogoHeader initials="MB" />
      <Text style={styles.title}>Good morning, Mr. Bernard.</Text>
      <Text style={styles.subtitle}>Thursday, September 17, 2026</Text>

      <SectionHeader title="Today's Classes" icon={<IconCalendar size={20} />} />
      <Card>
        {teacherClasses.map((c) => (
          <ListRow
            key={c.id}
            title={c.name}
            subtitle={`Room ${c.room} • ${c.studentCount} students`}
            left={<IconPin size={22} />}
            chevron
            onPress={() => router.push(`/(teacher)/class/${c.id}` as never)}
          />
        ))}
      </Card>

      <SectionHeader title="Action Items" icon={<IconClipboard size={20} />} />
      <Card>
        <ListRow
          title="Grade Unit 1 Tests"
          subtitle="12 remaining for AP Chemistry Period 3"
          left={<IconDocText size={22} />}
          right={<StatusPill label="12" tone="brand" />}
          chevron
        />
        <ListRow title="Post lab materials" subtitle="AP Chemistry Period 7" left={<IconStats size={22} />} chevron />
        <ListRow title="Review safety contracts" subtitle="Forensic Science" left={<IconPeople size={22} />} chevron />
      </Card>

      <SectionHeader title="Messages" icon={<IconMail size={20} />} />
      <Card>
        <ListRow
          title="Message a class"
          subtitle="Send an announcement to students or families"
          left={<IconBell size={22} />}
          chevron
          onPress={() => router.push('/(parent)/(tabs)/messages' as never)}
        />
      </Card>

      <BrandBand />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '700', marginTop: space.sm },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: space.lg },
});
