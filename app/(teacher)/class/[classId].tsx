import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppHeader, Card, EmptyState, ListRow, Screen, SectionHeader, StatusPill } from '@/components/ui';
import { IconClipboard } from '@/components/icons';
import { colors, space } from '@/design/tokens';
import { useMarkGradingComplete, useSubmitClassAttendance, useTeacherClasses, useTeacherRoster } from '@/queries/useWits';
import { getCapabilities } from '@/config/capabilities';
import { friendlyError } from '@/utils/errors';
import { now } from '@/utils/clock';
import type { TeacherRosterEntry } from '@/domain/schemas';

/**
 * Teacher Class Detail (§10.2/§10.6): overview + roster with repository
 * missing counts, plus the two demo writes — Take Attendance and Mark
 * Grading Complete. Production shows them only when capabilities approve.
 */
const P = ['present', 'tardy', 'absent'] as const;
type Mark = (typeof P)[number];

export default function ClassDetail() {
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const classes = useTeacherClasses();
  const roster = useTeacherRoster(classId ?? '');
  const caps = getCapabilities();
  const submitAttendance = useSubmitClassAttendance();
  const grading = useMarkGradingComplete();

  const cls = (classes.data ?? []).find((c) => c.id === classId);

  // Demo attendance state: per-student marks defaulting to present.
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [takingAttendance, setTakingAttendance] = useState(false);

  const entries: TeacherRosterEntry[] = roster.data ?? [];
  // Memoize the reference so the totals useMemo sees a stable dependency
  // (audit P2: react-hooks/exhaustive-deps).
  const entriesKey = roster.data;
  const totals = useMemo(() => {
    const t: Record<Mark, number> = { present: 0, tardy: 0, absent: 0 };
    for (const s of entries) t[marks[s.id] ?? 'present'] += 1;
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- entries derives from entriesKey
  }, [entriesKey, marks]);

  const canAttendance = caps.teacherAttendanceWrite;

  if (roster.isError) {
    return (
      <Screen>
        <AppHeader title="Class" onBack={() => router.back()} />
        <EmptyState title="Class unavailable" message={friendlyError(roster.error).body} />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader
        title={cls?.course ?? 'Class Roster'}
        subtitle={cls ? `Period ${cls.period ?? '—'} · Room ${cls.room}` : 'Class'}
        onBack={() => router.back()}
      />

      <SectionHeader title="Overview" />
      <Card>
        <ListRow title="Students" subtitle={`${cls?.studentCount ?? entries.length} enrolled`} />
        <ListRow title="Next meeting" subtitle={cls?.nextMeeting ?? '—'} />
        <ListRow
          title="Pending grading"
          subtitle={`${cls?.pendingGrading ?? 0} submission${(cls?.pendingGrading ?? 0) === 1 ? '' : 's'}`}
          right={
            cls && (cls.pendingGrading ?? 0) > 0 && caps.teacherAnnouncements ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Mark grading complete"
                onPress={() => grading.mutate(cls.id)}
                disabled={grading.isPending}
                style={({ pressed }) => [styles.smallButton, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.smallButtonText}>{grading.isPending ? 'Saving…' : 'Mark Done'}</Text>
              </Pressable>
            ) : (cls?.pendingGrading ?? 0) === 0 ? (
              <StatusPill label="All graded" tone="success" />
            ) : null
          }
        />
      </Card>

      <SectionHeader title="Attendance" icon={<IconClipboard size={20} />} />
      <Card>
        {!canAttendance ? (
          <Text style={styles.demoNote}>Attendance submission requires district approval and arrives with WCSD integration.</Text>
        ) : !takingAttendance ? (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Take attendance for this class"
              onPress={() => setTakingAttendance(true)}
              style={({ pressed }) => [styles.takeButton, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.takeButtonText}>Take Attendance</Text>
            </Pressable>
            <Text style={styles.demoNote}>Demo write — attendance records are synthetic.</Text>
          </>
        ) : (
          <>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsText}>P {totals.present} · T {totals.tardy} · A {totals.absent}</Text>
            </View>
            {entries.map((s) => (
              <View key={s.id} style={styles.markRow}>
                <Text style={styles.markName} numberOfLines={1}>{s.name}</Text>
                <View style={styles.markChips}>
                  {P.map((m) => {
                    const selected = (marks[s.id] ?? 'present') === m;
                    return (
                      <Pressable
                        key={m}
                        accessibilityRole="button"
                        accessibilityLabel={`${m} for ${s.name}`}
                        accessibilityState={{ selected }}
                        onPress={() => setMarks((prev) => ({ ...prev, [s.id]: m }))}
                        style={[styles.markChip, selected && styles.markChipOn]}
                      >
                        <Text style={[styles.markChipText, selected && styles.markChipTextOn]}>
                          {m === 'present' ? 'P' : m === 'tardy' ? 'T' : 'A'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Submit attendance"
              onPress={() => {
                submitAttendance.mutate(
                  {
                    classId: classId ?? '',
                    date: now().toISOString().slice(0, 10),
                    submissions: entries.map((s) => ({ studentId: s.id, status: marks[s.id] ?? 'present' })),
                  },
                  { onSuccess: () => setTakingAttendance(false) },
                );
              }}
              disabled={submitAttendance.isPending}
              style={({ pressed }) => [styles.takeButton, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.takeButtonText}>{submitAttendance.isPending ? 'Submitting…' : 'Submit Attendance'}</Text>
            </Pressable>
          </>
        )}
      </Card>

      <SectionHeader title="Students" />
      <Card>
        {entries.length === 0 && roster.isLoading ? (
          <Text style={styles.demoNote}>Loading roster…</Text>
        ) : (
          entries.map((s) => (
            <ListRow
              key={s.id}
              title={s.name}
              subtitle={`${s.absences} absence${s.absences === 1 ? '' : 's'}${s.missingCount > 0 ? ` · ${s.missingCount} missing` : ''}`}
              onPress={() => router.push({ pathname: '/(teacher)/student/[studentId]', params: { studentId: s.id } } as never)}
              right={
                <StatusPill
                  label={`${s.gradePercent}%`}
                  tone={s.gradePercent >= 90 ? 'success' : s.gradePercent >= 80 ? 'warning' : 'danger'}
                />
              }
            />
          ))
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  takeButton: {
    backgroundColor: colors.brandRed,
    borderRadius: 10,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  takeButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  smallButton: {
    borderWidth: 1,
    borderColor: colors.brandRed,
    borderRadius: 8,
    paddingHorizontal: 10,
    minHeight: 32,
    justifyContent: 'center',
  },
  smallButtonText: { color: colors.brandRed, fontWeight: '700', fontSize: 12 },
  demoNote: { fontSize: 12, color: colors.textSecondary, marginTop: space.sm, lineHeight: 17 },
  totalsRow: { marginBottom: space.sm },
  totalsText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  markRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  markName: { flex: 1, fontSize: 14, color: colors.text, marginRight: space.sm },
  markChips: { flexDirection: 'row', gap: 6 },
  markChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markChipOn: { backgroundColor: colors.brandRed, borderColor: colors.brandRed },
  markChipText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  markChipTextOn: { color: '#fff' },
});
