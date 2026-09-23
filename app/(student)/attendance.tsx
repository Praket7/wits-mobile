import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DonutGauge } from '@/components/gauges';
import { WitsLogoHeader } from '@/components/brand';
import { Card, EmptyState, ErrorState, ListRow, Screen, SectionHeader, SegmentedControl, StatusPill } from '@/components/ui';
import { IconCalendar, IconCheckCircle, IconDocText, IconMail, IconStats } from '@/components/icons';
import { colors, space } from '@/design/tokens';
import { friendlyError } from '@/utils/errors';
import { useAttendance, useAttendanceSummary, useCourses } from '@/queries/useWits';
import { getCapabilities } from '@/config/capabilities';
import { useSelectedStudentId, useSession } from '@/state/appState';
import { formatGradeColor, formatIsoDateShort } from '@/utils/format';
import { openMailto } from '@/utils/openUrl';
import type { AttendanceRecord } from '@/domain/schemas';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Attendance-office contact for the student "report an absence" flow. The
 * prototype uses the district's synthetic mail domain; production serves the
 * real per-school office address from the school profile resource.
 */
const ATTENDANCE_OFFICE_EMAIL = 'attendance@williamsville.example';

/** Nullable stat → text: unknown real data shows —, never a fabricated metric. */
const statText = (n: number | null | undefined): string => (n == null ? '—' : String(n));

export default function AttendanceOverview() {
  const selectedStudentId = useSelectedStudentId();
  const { role } = useSession();
  const attendance = useAttendance(selectedStudentId);
  const summary = useAttendanceSummary(selectedStudentId);
  const courses = useCourses(selectedStudentId);
  const [view, setView] = useState('Overview');

  if (attendance.isLoading || summary.isLoading) return <Screen><EmptyState title="Loading…" /></Screen>;
  const refreshing = attendance.isRefetching || summary.isRefetching;
  if (attendance.isError) return <Screen><ErrorState message={friendlyError(attendance.error).body} onRetry={() => attendance.refetch()} /></Screen>;
  if (summary.isError) return <Screen><ErrorState message={friendlyError(summary.error).body} onRetry={() => summary.refetch()} /></Screen>;

  const records = attendance.data ?? [];
  const courseMap = new Map((courses.data ?? []).map((c) => [c.id, c]));

  // Repository-served stats (audit P1): no screen-local CLASS_STATS table and
  // no fabricated fallbacks — a missing figure renders as Unavailable.
  const overall = summary.data?.overall;
  const yearRate = overall?.attendanceRate ?? null;
  const yearAbsences = overall?.absences ?? null;
  const yearTardies = overall?.tardies ?? null;
  const yearDays = overall?.schoolDays ?? null;

  // Per-class rows come from the summary, ordered by the course list (period
  // order) so switching children reorders rows instead of hiding them.
  const byClass = (summary.data?.byClass ?? [])
    .map((row) => ({ row, course: courseMap.get(row.courseId) }))
    .filter((entry): entry is { row: typeof entry.row; course: NonNullable<typeof entry.course> } => !!entry.course)
    .sort((a, b) => a.course.period - b.course.period);

  return (
    <Screen
      onRefresh={() => {
        void attendance.refetch();
        void summary.refetch();
      }}
      refreshing={refreshing}
    >
      <WitsLogoHeader
        onBellPress={() => router.push('/(student)/notifications' as never)}
        onAvatarPress={() => router.push('/(student)/(tabs)/more' as never)}/>
      <Text style={styles.screenTitle}>Attendance</Text>
      <Text style={styles.screenSub}>Be present. Make the most of every day.</Text>
      <SegmentedControl options={['Overview', 'By Class', 'History', 'Reports']} value={view} onChange={setView} />

      <Card>
        <View style={styles.statsRow}>
          {yearRate != null ? <DonutGauge percent={yearRate} size={64} stroke={8} showLabel={false} /> : <View style={styles.gaugePlaceholder} />}
          <View style={styles.rateCol}>
            <Text style={styles.rateBig}>{yearRate != null ? `${yearRate}%` : '—'}</Text>
            <Text style={styles.rateLabel}>Attendance Rate{'\n'}This Year</Text>
          </View>
          <View style={styles.trioRow}>
            <Stat value={statText(yearAbsences)} label="Absences" color={colors.danger} />
            <Stat value={statText(yearTardies)} label="Tardies" color={colors.warning} />
            <Stat value={statText(overall?.earlyDismissals)} label="Early Dismissals" color={colors.text} />
          </View>
        </View>
        {/* School-days line only when the source provides it (audit P1: no
            believable fake totals in HTTP mode). */}
        {yearDays != null && <Text style={styles.outOf}>Out of {yearDays} school days</Text>}
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

          <SectionHeader title="Recent Attendance" icon={<IconCalendar size={20} />} actionLabel="See All" />
          <Card>
            {records.map((r) => {
              const course = r.courseId ? courseMap.get(r.courseId) : undefined;
              return (
                <ListRow
                  key={r.id}
                  title={dateRowLabel(r.date)}
                  subtitle={course ? course.name : 'School-wide'}
                  chevron={!!r.courseId}
                  onPress={
                    r.courseId
                      ? () =>
                          router.push({
                            pathname: '/(student)/attendance/[courseId]',
                            params: { courseId: r.courseId! },
                          })
                      : undefined
                  }
                  right={
                    <StatusPill
                      label={r.status === 'present' ? 'Present' : r.status === 'tardy' ? 'Tardy' : 'Absent'}
                      tone={r.status === 'present' ? 'success' : r.status === 'tardy' ? 'warning' : 'danger'}
                    />
                  }
                />
              );
            })}
          </Card>

          <SectionHeader title="Attendance by Class" icon={<IconStats size={20} />} />
          <Card>
            {byClass.map(({ course, row }) => (
              <ListRow
                key={course.id}
                title={course.name}
                subtitle={`${statText(row.absences)} absence${row.absences === 1 ? '' : 's'} • ${statText(row.tardies)} ${row.tardies === 1 ? 'tardy' : 'tardies'}`}
                chevron
                onPress={() => router.push(`/(student)/attendance/${course.id}` as never)}
                right={
                  row.attendanceRate != null ? (
                    <Text style={[styles.classRate, { color: formatGradeColor(row.attendanceRate) }]}>{row.attendanceRate}%</Text>
                  ) : (
                    <Text style={[styles.classRate, styles.classRateUnknown]}>—</Text>
                  )
                }
              />
            ))}
          </Card>
        </>
      )}

      {view === 'By Class' && (
        <Card>
          {byClass.map(({ course, row }) => (
            <ListRow
              key={course.id}
              title={course.name}
              subtitle={`${statText(row.absences)} absence${row.absences === 1 ? '' : 's'} • ${statText(row.tardies)} ${row.tardies === 1 ? 'tardy' : 'tardies'}`}
              chevron
              onPress={() => router.push(`/(student)/attendance/${course.id}` as never)}
              right={
                row.attendanceRate != null ? (
                  <Text style={[styles.classRate, { color: formatGradeColor(row.attendanceRate) }]}>{row.attendanceRate}%</Text>
                ) : (
                  <Text style={[styles.classRate, styles.classRateUnknown]}>—</Text>
                )
              }
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
              subtitle={historySubtitle(r)}
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
          {/* Audit P1: official district report/letter exports are not part of
              the approved prototype scope — rows show an explicit unavailable
              state instead of fake chevrons. */}
          <ListRow
            title="Quarterly Attendance Report"
            subtitle="PDF summary by period — available after district integration"
            right={<StatusPill label="Not Available" tone="neutral" />}
          />
          <ListRow
            title="Attendance Letters"
            subtitle="Official district correspondence — available after district integration"
            right={<StatusPill label="Not Available" tone="neutral" />}
          />
        </Card>
      )}

      {getCapabilities().attendanceReporting && (
        <Card style={{ backgroundColor: colors.dangerBg }}>
          {/* Routing fix (audit interaction bug #4): this screen is shared by
              student and parent viewers, but /report lives in the parent group
              whose layout guard bounces students. Each role gets a valid
              action: parents keep the reporting flow; students contact the
              attendance office by email. */}
          {role === 'parent' ? (
            <ListRow
              title="Need to Report an Absence?"
              subtitle={`Notify the school of a planned or unplanned absence for ${selectedStudentId === 'stu-maya' ? 'Maya' : 'Alex'}.`}
              left={<IconMail size={24} color={colors.danger} />}
              chevron
              onPress={() =>
                router.push({
                  pathname: '/(parent)/attendance/report',
                  params: { studentId: selectedStudentId },
                })
              }
            />
          ) : (
            <ListRow
              title="Need to Report an Absence?"
              subtitle="Students: contact the attendance office — a parent or guardian must file the official report."
              left={<IconMail size={24} color={colors.danger} />}
              chevron
              onPress={() => void openMailto(ATTENDANCE_OFFICE_EMAIL)}
            />
          )}
        </Card>
      )}
    </Screen>
  );
}

function Stat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={styles.statCol}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function dateRowLabel(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  const rest = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${WEEKDAYS[d.getDay()]} ${rest}`;
}

/** "Tardy · Arrived 8:12 AM", "Absent · Excused", etc. (plan item 9). */
function historySubtitle(r: AttendanceRecord): string | undefined {
  const parts: string[] = [];
  if (r.status === 'tardy' && r.arrivalTime) parts.push(`Arrived ${r.arrivalTime}`);
  if (r.excused) parts.push('Excused');
  if (r.reason) parts.push(r.reason);
  else if (r.note && !parts.length) parts.push(r.note);
  return parts.length ? parts.join(' · ') : undefined;
}

const styles = StyleSheet.create({
  screenTitle: { fontSize: 30, fontWeight: '700', color: colors.text, marginTop: space.sm },
  screenSub: { fontSize: 15, color: colors.textSecondary, marginTop: space.xs, marginBottom: space.md },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  gaugePlaceholder: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#EEF0F3' },
  rateCol: { flex: 1, minWidth: 0 },
  trioRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  statCol: { width: 54, alignItems: 'center' },
  rateBig: { fontSize: 28, fontWeight: '700', color: colors.text },
  rateLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 16 },
  outOf: { fontSize: 11, color: colors.textSecondary, marginTop: space.sm, textAlign: 'right' },
  onTrackRow: { flexDirection: 'row', alignItems: 'center' },
  onTrackTitle: { fontSize: 17, fontWeight: '700', color: colors.success },
  onTrackBody: { fontSize: 14, color: colors.success, marginTop: 2 },
  classRate: { fontSize: 16, fontWeight: '700' },
  classRateUnknown: { color: colors.textSecondary },
  statValue: { fontSize: 24, fontWeight: '700' },
  statLabel: { fontSize: 10, color: colors.textSecondary, lineHeight: 13, textAlign: 'center' },
});
