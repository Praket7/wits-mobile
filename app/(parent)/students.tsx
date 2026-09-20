import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WitsLogoHeader } from '@/components/brand';
import { Card, ErrorState, ListRow, Screen, SectionHeader, StatusPill } from '@/components/ui';
import { IconBook, IconCalendar, IconChevronRight, IconDocText, IconPeople } from '@/components/icons';
import { colors, radius, space } from '@/design/tokens';
import { friendlyError } from '@/utils/errors';
import { useAssignments, useAttendance, useCourses, useStudents, useToday } from '@/queries/useWits';
import { useSession } from '@/state/appState';

// My Students (plan item 13): district lockup header, big title, a clear
// "Currently viewing" selected-child card with academic + attendance
// snapshots, then the switcher list. The Add Student affordance is reserved
// but intentionally disabled until an approved parent-linking API exists.
export default function ParentStudents() {
  const { selectedStudentId, setSelectedStudentId } = useSession();
  const students = useStudents();

  if (students.isLoading) {
    return (
      <Screen>
        <WitsLogoHeader initials="PG" />
        <Text style={styles.screenTitle}>My Students</Text>
        <Card>
          <Text style={styles.loading}>Loading…</Text>
        </Card>
      </Screen>
    );
  }
  if (students.isError) {
    return (
      <Screen>
        <WitsLogoHeader initials="PG" />
        <Text style={styles.screenTitle}>My Students</Text>
        <ErrorState message={friendlyError(students.error).body} />
      </Screen>
    );
  }

  const all = students.data ?? [];
  const selected = all.find((s) => s.id === selectedStudentId);

  return (
    <Screen>
      <WitsLogoHeader
        initials="PG"
        onBellPress={() => router.push('/(student)/notifications' as never)}
        onAvatarPress={() => router.push('/(parent)/(tabs)/more' as never)}
      />
      <Text style={styles.screenTitle}>My Students</Text>
      <Text style={styles.screenSub}>{"Choose the student whose information you're viewing."}</Text>

      {/* Currently viewing — the selected child's snapshot (plan item 13). */}
      {selected ? (
        <SelectedChildCard studentId={selected.id} name={selected.name} grade={selected.grade} school={selected.school} />
      ) : null}

      <SectionHeader title="Switch Student" icon={<IconPeople size={20} />} />
      <Card>
        {all.map((s) => {
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
              right={
                active ? (
                  <Text style={styles.check} accessibilityLabel="Currently viewing">✓</Text>
                ) : (
                  <IconChevronRight size={16} />
                )
              }
              onPress={() => setSelectedStudentId(s.id)}
            />
          );
        })}
        {/* Reserved for the approved parent-linking flow (plan item 13). */}
        <ListRow
          title="Add Student"
          subtitle="Linking additional students requires district approval."
          left={<View style={[styles.avatar, styles.avatarAdd]}><Text style={styles.avatarAddText}>+</Text></View>}
          right={<Text style={styles.comingSoon}>Coming later</Text>}
        />
      </Card>
    </Screen>
  );
}

function SelectedChildCard({
  studentId,
  name,
  grade,
  school,
}: {
  studentId: string;
  name: string;
  grade: number;
  school: string;
}) {
  const today = useToday(studentId);
  const courses = useCourses(studentId);
  const assignments = useAssignments(studentId);
  const attendance = useAttendance(studentId);

  const missing = (assignments.data ?? []).filter((a) => a.status === 'missing').length;
  const dueSoon = (assignments.data ?? []).filter((a) => a.status === 'upcoming').length;
  const tardies = (attendance.data ?? []).filter((r) => r.status === 'tardy').length;
  const absences = (attendance.data ?? []).filter((r) => r.status === 'absent').length;
  const nextBlock = (today.data?.schedule ?? []).find((b) => b.attended === 'upcoming');
  const nextCourse = nextBlock
    ? (courses.data ?? []).find((c) => c.id === nextBlock.courseId)
    : undefined;

  return (
    <Card>
      <View style={styles.viewingRow}>
        <Text style={styles.viewingLabel}>CURRENTLY VIEWING</Text>
        <StatusPill label="Active" tone="success" />
      </View>
      <Text style={styles.childName}>{name}</Text>
      <Text style={styles.childMeta}>
        Grade {grade} • {school}
      </Text>

      <View style={styles.snapshotGrid}>
        <SnapshotTile icon={<IconDocText size={18} />} value={String(missing)} label="Missing work" tone={missing > 0 ? 'danger' : 'success'} />
        <SnapshotTile icon={<IconBook size={18} />} value={String(dueSoon)} label="Due soon" />
        <SnapshotTile icon={<IconCalendar size={18} />} value={String(absences)} label="Absences" tone={absences > 0 ? 'warning' : 'success'} />
        <SnapshotTile icon={<IconCalendar size={18} />} value={String(tardies)} label="Tardies" tone={tardies > 0 ? 'warning' : 'success'} />
      </View>

      <View style={styles.nextRow}>
        <View style={styles.nextBar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.nextLabel}>Next class today</Text>
          <Text style={styles.nextValue}>
            {nextCourse
              ? `${nextCourse.name} · ${nextBlock!.startTime} – ${nextBlock!.endTime}`
              : 'No more classes today'}
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open academics for ${name}`}
        style={({ pressed }) => [styles.academicsBtn, pressed && { opacity: 0.7 }]}
        onPress={() => router.push('/(parent)/(tabs)/academics' as never)}
      >
        <Text style={styles.academicsBtnText}>View Academics</Text>
        <IconChevronRight size={14} color="#FFFFFF" />
      </Pressable>
    </Card>
  );
}

function SnapshotTile({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  tone?: 'success' | 'warning' | 'danger';
}) {
  const color =
    tone === 'danger' ? colors.danger : tone === 'warning' ? colors.warning : tone === 'success' ? colors.success : colors.text;
  return (
    <View style={styles.tile}>
      <View style={styles.tileIcon}>{icon}</View>
      <Text style={[styles.tileValue, { color }]}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screenTitle: { fontSize: 30, fontWeight: '700', color: colors.text, marginTop: space.sm },
  screenSub: { fontSize: 15, color: colors.textSecondary, marginTop: space.xs, marginBottom: space.lg },
  loading: { fontSize: 15, color: colors.textSecondary, paddingVertical: space.lg, textAlign: 'center' },
  viewingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm },
  viewingLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: colors.brandRed },
  childName: { fontSize: 24, fontWeight: '700', color: colors.text },
  childMeta: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  snapshotGrid: { flexDirection: 'row', gap: space.sm, marginTop: space.lg },
  tile: { flex: 1, backgroundColor: '#F7F8FA', borderRadius: radius.control, paddingVertical: space.md, alignItems: 'center' },
  tileIcon: { marginBottom: 4 },
  tileValue: { fontSize: 20, fontWeight: '700' },
  tileLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2, textAlign: 'center' },
  nextRow: { flexDirection: 'row', gap: space.md, alignItems: 'center', marginTop: space.lg },
  nextBar: { width: 4, height: 36, borderRadius: 2, backgroundColor: colors.brandRed },
  nextLabel: { fontSize: 12, color: colors.textSecondary },
  nextValue: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 2 },
  academicsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.brandRed,
    borderRadius: radius.control,
    minHeight: 44,
    marginTop: space.lg,
    paddingVertical: 10,
  },
  academicsBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EEF0F3', alignItems: 'center', justifyContent: 'center' },
  avatarActive: { backgroundColor: colors.brandRed },
  avatarText: { fontSize: 16, fontWeight: '700', color: colors.text },
  avatarTextActive: { color: '#FFFFFF' },
  avatarAdd: { backgroundColor: '#F1F3F6' },
  avatarAddText: { fontSize: 22, color: colors.textSecondary, fontWeight: '600' },
  check: { color: colors.brandRed, fontWeight: '700', fontSize: 16 },
  comingSoon: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
});
