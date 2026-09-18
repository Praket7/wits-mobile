import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppHeader, Card, ListRow, Screen, SectionHeader } from '@/components/ui';
import { IconChevronRight } from '@/components/icons';
import { colors } from '@/design/tokens';
import { useStudents } from '@/queries/useWits';
import { useSession } from '@/state/appState';

export default function ParentStudents() {
  const { selectedStudentId, setSelectedStudentId } = useSession();
  const students = useStudents();

  return (
    <Screen>
      <AppHeader title="My Students" subtitle="Switch between children" onBack={() => router.back()} />
      <SectionHeader title="Students" />
      <Card>
        {(students.data ?? []).map((s) => {
          const active = s.id === selectedStudentId;
          return (
            <ListRow
              key={s.id}
              title={s.name}
              subtitle={`Grade ${s.grade} • ${s.school}\nGPA ${s.gpa.toFixed(2)} • ${s.attendanceRate}% attendance`}
               
              left={
                <View style={[styles.avatar, active && styles.avatarActive]}>
                  <Text style={[styles.avatarText, active && styles.avatarTextActive]}>{s.initials}</Text>
                </View>
              }
              right={active ? <Text style={styles.check}>✓</Text> : <IconChevronRight size={16} />}
              onPress={() => setSelectedStudentId(s.id)}
            />
          );
        })}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EEF0F3', alignItems: 'center', justifyContent: 'center' },
  avatarActive: { backgroundColor: colors.brandRed },
  avatarText: { fontSize: 16, fontWeight: '700', color: colors.text },
  avatarTextActive: { color: '#FFFFFF' },
  check: { color: colors.brandRed, fontWeight: '700', fontSize: 16 },
});
