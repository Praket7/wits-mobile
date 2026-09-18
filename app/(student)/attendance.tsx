import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DonutGauge } from '@/components/gauges';
import { AppHeader, Card, EmptyState, ErrorState, ListRow, Screen, SectionHeader, SegmentedControl, StatusPill } from '@/components/ui';
import { IconCheckCircle, IconDocText, IconMail, IconStats } from '@/components/icons';
import { colors, space } from '@/design/tokens';
import { useAttendance, useCourses, useStudents } from '@/queries/useWits';
import { useSession } from '@/state/appState';
import { formatGradeColor, formatIsoDateShort } from '@/utils/format';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AttendanceOverview() {
  const { selectedStudentId } = useSession();
  const attendance = useAttendance(selectedStudentId);
  const courses = useCourses(selectedStudentId);
  const students = useStudents();
  const [view, setView] = useState('Overview');

  if (attendance.isLoading) return <Screen><EmptyState title="Loading…" /></Screen>;
  if (attendance.isError) return <Screen><ErrorState message={String(attendance.error)} /></Screen>;

  const records = attendance.data ?? [];
  const profile = (students.data ?? []).find((s) => s.id === selectedStudentId);
  const yearRate = profile?.attendanceRate ?? 98;
  const yearAbsences = profile?.absences ?? 2;
  const yearTardies = profile?.tardies ?? 1;
  const yearDays = profile?.schoolDays ?? 98;

  const byClass = (courses.data ?? []).map((c) => {
    const classRecords = records.filter((r) => r.courseId === c.id);
    const a = classRecords.filter((r) => r.status === 'absent').length;
    const t = classRecords.filter((r) => r.status === 'tardy').length;
    return { course: c, absences: a, tardies: t, rate: Math.max(90, 100 - a * 2 - t) };
  });

  return (
    <Screen>
      <AppHeader title="Attendance" subtitle="Be present. Make the most of every day." onBack={() => router.back()} />
      <SegmentedControl options={['Overview', 'By Class', 'History', 'Reports']} value={view} onChange={setView} />

      <Card>
        <View style={styles.statsRow}>
          <DonutGauge percent={yearRate} size={92} />
          <View style={{ flex: 1, marginLeft: space.lg }}>
            <Text style={styles.rateBig}>{yearRate}%</Text>
            <Text style={styles.rateLabel}>Attendance Rate This Year</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: space.md }}>
            <Stat value={String(yearAbsences)} label="Absences" color={colors.danger} />
            <Stat value={String(yearTardies)} label="Tardies" color={colors.warning} />
            <Stat value={String(profile?.earlyDismissals ?? 0)} label="Early Dismissals" color={colors.text} />
          </View>
        </View>
        <Text style={styles.outOf}>Out of {yearDays} school days</Text>
      </Card>

      {view === 'Overview' && (
        <>
          <Card style={{ backgroundColor: colors.successBg }}>
            <View style={styles.onTrackRow}>
              <IconCheckCircle size={26} />
              <View style={{ flex: 1, marginLeft: space.md }}>
                <Text style={styles.onTrackTitle}>{"You're on track!"}</Text>
                <Text style={styles.onTrackBody}>Keep up the great attendance.</Text>
              </View>
            </View>
          </Card>

          <SectionHeader title="Recent Attendance" icon={<IconCalendarSmall />} actionLabel="See All" />
          <Card>
            {records.map((r) => (
              <ListRow
                key={r.id}
                title={`${WEEKDAYS[new Date(r.date + 'T12:00:00').getDay()]}  ${formatIsoDateShort(r.date)}`}
                subtitle={r.note ?? undefined}
                chevron
                onPress={() => router.push('/(student)/attendance/c-chem' as never)}
                right={
                  <StatusPill
                    label={r.status === 'present' ? 'Present' : r.status === 'tardy' ? 'Tardy' : 'Absent'}
                    tone={r.status === 'present' ? 'success' : r.status === 'tardy' ? 'warning' : 'danger'}
                  />
                }
              />
            ))}
          </Card>

          <SectionHeader title="Attendance by Class" icon={<IconStats size={20} />} />
          <Card>
            {byClass.map(({ course, absences: a, tardies: t, rate: r }) => (
              <ListRow
                key={course.id}
                title={course.name}
                subtitle={`${a} absence${a === 1 ? '' : 's'} • ${t} ${t === 1 ? 'tardy' : 'tardies'}`}
                chevron
                onPress={() => router.push(`/(student)/attendance/${course.id}` as never)}
                right={<Text style={[styles.classRate, { color: formatGradeColor(r) }]}>{r}%</Text>}
              />
            ))}
          </Card>
        </>
      )}

      {view === 'By Class' && (
        <Card>
          {byClass.map(({ course, absences: a, tardies: t, rate: r }) => (
            <ListRow
              key={course.id}
              title={course.name}
              subtitle={`${a} absence${a === 1 ? '' : 's'} • ${t} ${t === 1 ? 'tardy' : 'tardies'}`}
              chevron
              onPress={() => router.push(`/(student)/attendance/${course.id}` as never)}
              right={<Text style={[styles.classRate, { color: formatGradeColor(r) }]}>{r}%</Text>}
            />
          ))}
        </Card>
      )}

      {view === 'History' && (
        <Card>
          <SectionHeader title="Full History" />
          {records.map((r) => (
            <ListRow
              key={r.id}
              title={formatIsoDateShort(r.date)}
              subtitle={r.note ?? undefined}
              right={
                <StatusPill
                  label={r.status === 'present' ? 'Present' : r.status === 'tardy' ? 'Tardy' : 'Absent'}
                  tone={r.status === 'present' ? 'success' : r.status === 'tardy' ? 'warning' : 'danger'}
                />
              }
            />
          ))}
        </Card>
      )}

      {view === 'Reports' && (
        <Card>
          <SectionHeader title="Reports" icon={<IconDocText size={20} />} />
          <ListRow title="Quarterly Attendance Report" subtitle="PDF summary by period" chevron />
          <ListRow title="Attendance Letters" subtitle="Official district correspondence" chevron />
        </Card>
      )}

      <Card style={{ backgroundColor: colors.dangerBg }}>
        <ListRow
          title="Need to Report an Absence?"
          subtitle="Notify the school of a planned or unplanned absence."
          left={<IconMail size={24} color={colors.danger} />}
          chevron
        />
      </Card>
    </Screen>
  );
}

function Stat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={{ alignItems: 'flex-end' }}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function IconCalendarSmall() {
  return <IconStats size={20} />;
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  rateBig: { fontSize: 36, fontWeight: '700', color: colors.text },
  rateLabel: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  outOf: { fontSize: 12, color: colors.textSecondary, marginTop: space.md, textAlign: 'right' },
  onTrackRow: { flexDirection: 'row', alignItems: 'center' },
  onTrackTitle: { fontSize: 17, fontWeight: '700', color: colors.success },
  onTrackBody: { fontSize: 14, color: colors.success, marginTop: 2 },
  classRate: { fontSize: 16, fontWeight: '700' },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11, color: colors.textSecondary },
});
