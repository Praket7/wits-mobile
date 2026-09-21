import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppHeader, Card, EmptyState, ErrorState, ListRow, Screen, SectionHeader, StatusPill } from '@/components/ui';
import { IconCalendar, IconMail, IconStats } from '@/components/icons';
import { colors, space } from '@/design/tokens';
import { useTeacherRoster } from '@/queries/useWits';

/**
 * Teacher Student Detail (P0.4): every roster row opens a real detail screen
 * with class grade, missing work, and attendance. The note field is explicitly
 * local/demo-only — production notes require an approved backend capability.
 */
export default function TeacherStudentDetail() {
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const [note, setNote] = useState('');

  // Find the student across all authorized rosters (prototype: fetch each).
  const chem = useTeacherRoster('c-chem');
  const chem2 = useTeacherRoster('c-chem2');
  const forensic = useTeacherRoster('c-forensic');

  if (chem.isLoading || chem2.isLoading || forensic.isLoading) {
    return <Screen><EmptyState title="Loading…" /></Screen>;
  }
  if (chem.isError || chem2.isError || forensic.isError) {
    return <Screen><ErrorState message="Roster unavailable" onRetry={() => chem.refetch()} /></Screen>;
  }

  const all = [
    ...(chem.data ?? []).map((s) => ({ ...s, className: 'AP Chemistry – Period 3' })),
    ...(chem2.data ?? []).map((s) => ({ ...s, className: 'AP Chemistry – Period 7' })),
    ...(forensic.data ?? []).map((s) => ({ ...s, className: 'Forensic Science – Period 5' })),
  ];
  const student = all.find((s) => s.id === studentId);
  if (!student) return <Screen><ErrorState message="Student not found" onRetry={() => router.back()} /></Screen>;

  const gradeTone = student.gradePercent >= 90 ? 'success' : student.gradePercent >= 80 ? 'warning' : 'danger';

  return (
    <Screen>
      <AppHeader title={student.name} subtitle={student.className} onBack={() => router.back()} />

      <Card>
        <View style={styles.gradeRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.gradeLabel}>Current Grade</Text>
            <Text style={styles.gradeValue}>{student.gradePercent}%</Text>
          </View>
          <StatusPill
            label={student.gradePercent >= 90 ? 'On Track' : student.gradePercent >= 80 ? 'Monitor' : 'Needs Support'}
            tone={gradeTone}
          />
        </View>
      </Card>

      <SectionHeader title="Summary" icon={<IconStats size={20} />} />
      <Card>
        <ListRow
          title="Missing Work"
          subtitle={
            student.missingCount > 0
              ? `${student.missingCount} assignment${student.missingCount === 1 ? '' : 's'} overdue`
              : 'Nothing missing — all caught up'
          }
          right={
            <StatusPill
              label={String(student.missingCount)}
              tone={student.missingCount > 0 ? 'danger' : 'success'}
            />
          }
        />
        <ListRow
          title="Attendance"
          subtitle={`${student.absences} absence${student.absences === 1 ? '' : 's'} in this class`}
          right={
            <StatusPill
              label={String(student.absences)}
              tone={student.absences >= 3 ? 'danger' : student.absences >= 1 ? 'warning' : 'success'}
            />
          }
        />
      </Card>

      <SectionHeader title="Contact" icon={<IconMail size={20} />} />
      <Card>
        <ListRow
          title="Message Student"
          subtitle={`WITSMail to ${student.name}`}
          chevron
          onPress={() => router.push('/(teacher)/(tabs)/messages' as never)}
        />
        <ListRow
          title="Email Family"
          subtitle="Requires district-approved contact data (not in prototype)"
          onPress={undefined}
        />
      </Card>

      <SectionHeader title="Notes" icon={<IconCalendar size={20} />} />
      <Card>
        <Text style={styles.noteDisclaimer}>
          Notes are local to this device in the prototype — they are not synced or visible to the student or family.
        </Text>
        <TextInput
          style={styles.noteInput}
          placeholder="Add a private note…"
          placeholderTextColor={colors.textSecondary}
          value={note}
          onChangeText={setNote}
          multiline
          accessibilityLabel="Private note about student"
        />
        {note.length > 0 && (
          <Pressable
            style={styles.noteClear}
            onPress={() => setNote('')}
            accessibilityRole="button"
            accessibilityLabel="Clear note"
          >
            <Text style={styles.noteClearText}>Clear Note</Text>
          </Pressable>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gradeRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  gradeLabel: { fontSize: 13, color: colors.textSecondary },
  gradeValue: { fontSize: 36, fontWeight: '700', color: colors.text },
  noteDisclaimer: { fontSize: 12, color: colors.textSecondary, marginBottom: space.sm },
  noteInput: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#E2E5E9',
    borderRadius: 10,
    padding: space.md,
    fontSize: 14,
    color: colors.text,
    textAlignVertical: 'top',
  },
  noteClear: { alignSelf: 'flex-end', marginTop: space.sm, minHeight: 44, justifyContent: 'center' },
  noteClearText: { fontSize: 14, fontWeight: '600', color: colors.brandRed },
});
