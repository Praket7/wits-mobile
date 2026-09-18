import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DonutGauge } from '@/components/gauges';
import { AppHeader, Card, EmptyState, ErrorState, ListRow, Screen, SectionHeader, SegmentedControl, StatusPill } from '@/components/ui';
import { IconBook, IconMail, IconPerson, IconPin } from '@/components/icons';
import { colors, space } from '@/design/tokens';
import { monthlyAttendance } from '@/data/fixtures/data';
import { useAttendance, useCourse } from '@/queries/useWits';
import { formatIsoDateShort } from '@/utils/format';

const WEEKDAY_HEAD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const STATUS_COLORS: Record<string, string> = {
  present: colors.success,
  tardy: colors.brandGold,
  absent: colors.brandRed,
  'no-school': '#C9CFD6',
};

export default function CourseAttendanceDetail() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const course = useCourse(courseId);
  const attendance = useAttendance('stu-praket');
  const [term, setTerm] = useState('This Quarter');

  if (course.isLoading) return <Screen><EmptyState title="Loading…" /></Screen>;
  if (!course.data) return <Screen><ErrorState message="Course not found" /></Screen>;

  const c = course.data;
  const records = (attendance.data ?? []).filter(
    (r) => r.courseId === courseId || r.courseId === null
  );
  const absences = records.filter((r) => r.status === 'absent').length;
  const tardies = records.filter((r) => r.status === 'tardy').length;

  // September 2026 starts on a Tuesday (Sep 1 = Tuesday).
  const firstDow = 2;
  const daysInMonth = 30;
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <Screen>
      <AppHeader title={c.name} subtitle="Attendance Details" onBack={() => router.back()} />
      <SegmentedControl options={['This Quarter', 'Semester', 'Year']} value={term} onChange={setTerm} />

      <Card>
        <View style={styles.statsRow}>
          <DonutGauge percent={97} size={92} />
          <View style={{ flex: 1, marginLeft: space.lg }}>
            <Text style={styles.rateBig}>97%</Text>
            <Text style={styles.rateLabel}>Attendance Rate</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: space.md }}>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.statValue, { color: colors.danger }]}>{absences}</Text>
              <Text style={styles.statLabel}>Absence</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.statValue, { color: colors.warning }]}>{tardies}</Text>
              <Text style={styles.statLabel}>Tardy</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Early Dismissals</Text>
            </View>
          </View>
        </View>
      </Card>

      <Card>
        <View style={styles.monthRow}>
          <Text style={styles.monthTitle}>Monthly View</Text>
          <Text style={styles.monthName}>September 2026</Text>
        </View>
        <View style={styles.weekHead}>
          {WEEKDAY_HEAD.map((d) => (
            <Text key={d} style={styles.weekHeadText}>{d}</Text>
          ))}
        </View>
        <View style={styles.grid}>
          {cells.map((day, i) => {
            if (day === null) return <View key={`e${i}`} style={styles.cell} />;
            const status = monthlyAttendance[day];
            const isToday = day === 17;
            return (
              <View key={day} style={[styles.cell, isToday && styles.cellToday]}>
                <Text style={[styles.cellText, isToday && styles.cellTextToday]}>{day}</Text>
                {status ? <View style={[styles.dot, { backgroundColor: STATUS_COLORS[status] }]} /> : <View style={styles.dotSpacer} />}
              </View>
            );
          })}
        </View>
        <View style={styles.legend}>
          <LegendDot color={colors.success} label="Present" />
          <LegendDot color={colors.brandGold} label="Tardy" />
          <LegendDot color={colors.brandRed} label="Absent" />
          <LegendDot color="#C9CFD6" label="No School" />
        </View>
      </Card>

      <SectionHeader title="Attendance Log" />
      <Card>
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

      <SectionHeader title="Class Information" icon={<IconBook size={20} />} />
      <Card>
        <ListRow title="Teacher" subtitle={c.teacher} left={<IconPerson size={22} />} right={<IconMail size={22} color={colors.brandRed} />} />
        <ListRow title="Room" subtitle={c.room} left={<IconPin size={22} />} />
        <ListRow title="Periods" subtitle={`${c.period}`} left={<IconBook size={22} />} />
      </Card>
    </Screen>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  rateBig: { fontSize: 36, fontWeight: '700', color: colors.text },
  rateLabel: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11, color: colors.textSecondary },
  monthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.md },
  monthTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  monthName: { fontSize: 14, color: colors.textSecondary },
  weekHead: { flexDirection: 'row', marginBottom: space.xs },
  weekHeadText: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  cellToday: { backgroundColor: '#EEF0F3' },
  cellText: { fontSize: 13, color: colors.text },
  cellTextToday: { fontWeight: '700' },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 2 },
  dotSpacer: { height: 8 },
  legend: { flexDirection: 'row', justifyContent: 'space-around', marginTop: space.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendText: { fontSize: 11, color: colors.textSecondary },
});
