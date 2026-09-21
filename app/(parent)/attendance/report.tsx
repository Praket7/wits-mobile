import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppHeader, Card, ListRow, Screen, SectionHeader, StatusPill , ErrorState } from '@/components/ui';
import { IconCheckCircle } from '@/components/icons';
import { colors, space } from '@/design/tokens';
import { useStudents, useSubmitAbsenceReport } from '@/queries/useWits';
import { useSelectedStudentId } from '@/state/appState';
import { now } from '@/utils/clock';
import { getCapabilities } from '@/config/capabilities';

type AbsenceType = 'full-day' | 'late-arrival' | 'early-dismissal';

const TYPE_OPTIONS: { key: AbsenceType; label: string; subtitle: string }[] = [
  { key: 'full-day', label: 'Full Day', subtitle: 'Absent for the entire school day' },
  { key: 'late-arrival', label: 'Late Arrival', subtitle: 'Arriving after the school day begins' },
  { key: 'early-dismissal', label: 'Early Dismissal', subtitle: 'Leaving before the school day ends' },
];

const REASONS = ['Illness', 'Medical appointment', 'Family emergency', 'Religious observance', 'Other'];

/**
 * Report an Absence (P0.8): a complete synthetic submission flow. In demo
 * mode the report is stored in the in-memory demo database and shown as
 * "Submitted — demo only". Production keeps this capability hidden unless
 * /v1/capabilities reports attendanceReporting.
 */
export default function ReportAbsence() {
  const params = useLocalSearchParams<{ studentId?: string }>();
  const selectedStudentId = useSelectedStudentId();
  const studentId = params.studentId ?? selectedStudentId;
  const students = useStudents();
  const submit = useSubmitAbsenceReport();
  const [type, setType] = useState<AbsenceType>('full-day');
  const [date, setDate] = useState(() => {
    const d = now();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate() + 1).padStart(2, '0')}`;
  });
  const [reason, setReason] = useState<string>('Illness');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const student = (students.data ?? []).find((s) => s.id === studentId);

  const dateValid = useMemo(() => /^\d{4}-\d{2}-\d{2}$/.test(date), [date]);
  const canSubmit = dateValid && reason.length > 0 && !submit.isPending;

  // Capability gate (plan §11/P0.8): production hides this flow unless the
  // district backend declares attendanceReporting. All hooks run before this
  // branch so hook order stays stable.
  if (!getCapabilities().attendanceReporting) {
    return (
      <Screen>
        <AppHeader title="Report an Absence" onBack={() => router.back()} />
        <ErrorState message="Absence reporting is not available yet. Please call the school's front office." />
      </Screen>
    );
  }

  const onSubmit = () => {
    if (!canSubmit) return;
    submit.mutate(
      { studentId, date, type, reason, note: note.trim() || undefined },
      { onSuccess: () => setSubmitted(true) },
    );
  };

  if (submitted) {
    return (
      <Screen>
        <AppHeader title="Report an Absence" onBack={() => router.back()} />
        <Card style={{ backgroundColor: colors.successBg, alignItems: 'center', paddingVertical: space.xl }}>
          <IconCheckCircle size={48} />
          <Text style={styles.confirmTitle}>Absence Submitted</Text>
          <Text style={styles.confirmBody}>
            {type === 'full-day' ? 'Full-day absence' : type === 'late-arrival' ? 'Late arrival' : 'Early dismissal'} for{' '}
            {student?.name ?? 'your student'} on {date}.
          </Text>
          <Text style={styles.confirmNote}>Submitted — demo only. The front office is not notified in the prototype.</Text>
        </Card>
        <Card>
          <ListRow title="Back to Today" onPress={() => router.replace('/(parent)/(tabs)/today' as never)} chevron />
          <ListRow title="Submit Another" onPress={() => { setSubmitted(false); setNote(''); }} chevron />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title="Report an Absence" subtitle={student ? `For ${student.name}` : undefined} onBack={() => router.back()} />

      <SectionHeader title="Absence Type" />
      <Card>
        {TYPE_OPTIONS.map((o) => (
          <ListRow
            key={o.key}
            title={o.label}
            subtitle={o.subtitle}
            right={type === o.key ? <StatusPill label="Selected" tone="brand" /> : undefined}
            onPress={() => setType(o.key)}
            chevron={false}
          />
        ))}
      </Card>

      <SectionHeader title="Details" />
      <Card>
        <Text style={styles.fieldLabel}>Date (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="2026-09-18"
          placeholderTextColor={colors.textSecondary}
          accessibilityLabel="Absence date"
          autoCapitalize="none"
        />
        {!dateValid && date.length > 0 && <Text style={styles.fieldError}>Enter a date as YYYY-MM-DD.</Text>}

        <Text style={styles.fieldLabel}>Reason</Text>
        <View style={styles.reasonRow}>
          {REASONS.map((r) => {
            const active = reason === r;
            return (
              <Pressable
                key={r}
                onPress={() => setReason(r)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[styles.reasonChip, active && styles.reasonChipActive]}
              >
                <Text style={[styles.reasonText, active && styles.reasonTextActive]}>{r}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.fieldLabel}>Note (optional)</Text>
        <TextInput
          style={[styles.input, styles.noteInput]}
          value={note}
          onChangeText={setNote}
          placeholder="Details the school should know…"
          placeholderTextColor={colors.textSecondary}
          accessibilityLabel="Additional note"
          multiline
        />
      </Card>

      <Card>
        <Pressable
          style={[styles.submitBtn, !canSubmit && styles.submitDisabled]}
          onPress={onSubmit}
          disabled={!canSubmit}
          accessibilityRole="button"
          accessibilityLabel="Submit absence report"
        >
          <Text style={styles.submitText}>{submit.isPending ? 'Submitting…' : 'Submit Report'}</Text>
        </Pressable>
        <Text style={styles.demoNote}>
          Demo mode: reports are stored on-device only. In production this flow appears only when the district backend
          supports absence reporting.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  confirmTitle: { fontSize: 22, fontWeight: '700', color: colors.success, marginTop: space.md },
  confirmBody: { fontSize: 15, color: colors.text, textAlign: 'center', marginTop: space.sm, paddingHorizontal: space.lg },
  confirmNote: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginTop: space.md, paddingHorizontal: space.lg },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: space.md, marginBottom: space.xs },
  fieldError: { fontSize: 12, color: colors.danger, marginTop: space.xs },
  input: {
    borderWidth: 1,
    borderColor: '#E2E5E9',
    borderRadius: 10,
    paddingHorizontal: space.md,
    minHeight: 48,
    fontSize: 15,
    color: colors.text,
  },
  noteInput: { minHeight: 80, paddingVertical: space.md, textAlignVertical: 'top' },
  reasonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.sm },
  reasonChip: {
    backgroundColor: '#EEF0F3',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 40,
  },
  reasonChipActive: { backgroundColor: colors.brandRed },
  reasonText: { fontSize: 13, fontWeight: '600', color: colors.text },
  reasonTextActive: { color: '#FFFFFF' },
  submitBtn: {
    backgroundColor: colors.brandRed,
    borderRadius: 12,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  demoNote: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginTop: space.md },
});
