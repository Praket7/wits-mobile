import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WitsLogoHeader } from '@/components/brand';
import { Card, ListRow, Screen, SectionHeader } from '@/components/ui';
import { ScorePill } from '@/components/patterns';
import { IconStats } from '@/components/icons';
import { colors, space } from '@/design/tokens';
import { useCourses, useStudents } from '@/queries/useWits';
import { useSelectedStudentId } from '@/state/appState';

export default function ParentAcademics() {
  const selectedStudentId = useSelectedStudentId();
  const courses = useCourses(selectedStudentId);
  const students = useStudents();
  const student = (students.data ?? []).find((s) => s.id === selectedStudentId);

  return (
    <Screen>
      <WitsLogoHeader onBellPress={() => router.push('/(parent)/(tabs)/more' as never)}
        onAvatarPress={() => router.push('/(parent)/(tabs)/more' as never)}/>
      <Text style={styles.screenTitle}>Academics</Text>
      <Text style={styles.screenSub}>{student ? `${student.name} • Grade ${student.grade}` : 'Your student'}</Text>

      <SectionHeader title="Current Classes" icon={<IconStats size={20} />} actionLabel="Q1 ⌄" />
      <Card>
        {(courses.data ?? []).map((c) => (
          <ListRow
            key={c.id}
            title={c.name}
            subtitle={`${c.teacher} • Period ${c.period}\n${c.meetingTime}`}
            chevron
            onPress={() => router.push(`/(student)/course/${c.id}` as never)}
            right={c.gradePercent != null ? <ScorePill percent={c.gradePercent} /> : null}
            left={<View style={[styles.colorBar, { backgroundColor: c.color }]} />}
          />
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenTitle: { fontSize: 30, fontWeight: '700', color: colors.text, marginTop: space.sm },
  screenSub: { fontSize: 15, color: colors.textSecondary, marginTop: space.xs, marginBottom: space.md },
  colorBar: { width: 4, height: 44, borderRadius: 2 },
});
