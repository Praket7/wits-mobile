import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DonutGauge } from '@/components/gauges';
import { AppHeader, Card, EmptyState, ErrorState, ListRow, Screen, SectionHeader, SegmentedControl, StatusPill } from '@/components/ui';
import { IconBook, IconChevronBack, IconChevronRight, IconMail, IconPerson, IconPin } from '@/components/icons';
import { colors, space } from '@/design/tokens';
import { useClassAttendance, useCourse, useMonthlyAttendance } from '@/queries/useWits';
import { useSelectedStudentId } from '@/state/appState';
import { openMailto } from '@/utils/openUrl';
import { now } from '@/utils/clock';
import type { AttendanceRecord } from '@/domain/schemas';

function formatDayLabel(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** "Tardy · Arrived 8:12 AM", "Absent · Excused (Illness)", etc. (plan item 9). */
function historySubtitle(r: AttendanceRecord): string | undefined {
  const parts: string[] = [];
  if (r.status === 'tardy' && r.arrivalTime) parts.push(`Arrived ${r.arrivalTime}`);
  if (r.excused) parts.push('Excused');
  if (r.reason) parts.push(r.reason);
  else if (r.note && !parts.length) parts.push(r.note);
  return parts.length ? parts.join(' · ') : undefined;
}

const WEEKDAY_HEAD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const STATUS_COLORS: Record<string, string> = {
  present: colors.success,
  tardy: colors.brandGold,
  absent: colors.brandRed,
  'no-school': '#C9CFD6',
};

export default function CourseAttendanceDetail() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const selectedStudentId = useSelectedStudentId();
  const course = useCourse(courseId);
  // Per-class rows from the repository (audit P1) — the school-day log no
  // longer stands in for class-specific attendance.
  const attendance = useClassAttendance(courseId);
  const [term, setTerm] = useState('This Quarter');

  // Live month navigation (P0.6): viewed month starts at the (demo) clock and
  // the arrows actually move it. The grid derives from Date math — no
  // hard-coded first-weekday/day-count/today.
  const [viewed, setViewed] = useState(() => {
    const d = now();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });
  const monthly = useMonthlyAttendance({ studentId: selectedStudentId, courseId, year: viewed.year, month: viewed.month });
  const monthlyAttendance = monthly.data ?? {};

  const todayIso = `${now().getFullYear()}-${String(now().getMonth() + 1).padStart(2, '0')}-${String(now().getDate()).padStart(2, '0')}`;
  const viewIsCurrentMonth =
    viewed.year === now().getFullYear() && viewed.month === now().getMonth() + 1;
  const todayDay = Number(todayIso.slice(8, 10));

  const shiftMonth = (delta: number) => {
    setViewed((v) => {
      const d = new Date(v.year, v.month - 1 + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    });
  };

  if (course.isLoading) return <Screen><EmptyState title="Loading…" /></Screen>;
  if (!course.data) return <Screen><ErrorState message="Course not found" /></Screen>;

  const c = course.data;
  const records = attendance.data ?? [];
  const absences = records.filter((r) => r.status === 'absent').length;
  const tardies = records.filter((r) => r.status === 'tardy').length;
  // Derive the rate from per-class rows; with no rows yet, show —, not a
  // fabricated 100% (audit P1).
  const rate = records.length
    ? Math.round(((records.length - absences) / records.length) * 100)
    : null;

  // Calendar grid derived from real Date math for the viewed month.
  const firstDow = new Date(viewed.year, viewed.month - 1, 1).getDay();
  const daysInMonth = new Date(viewed.year, viewed.month, 0).getDate();
  const prevMonthDays = new Date(viewed.year, viewed.month - 1, 0).getDate();
  const leadCells = Array.from({ length: firstDow }, (_, i) => ({
    day: prevMonthDays - firstDow + 1 + i,
    muted: true,
  }));
  const mainCells = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, muted: false }));
  const cells: { day: number; muted: boolean }[] = [...leadCells, ...mainCells];
  let trailing = 1;
  while (cells.length % 7 !== 0) cells.push({ day: trailing++, muted: true });
  const monthName = new Date(viewed.year, viewed.month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Screen>
      <AppHeader
        title={c.name}
        subtitle="Attendance Details"
        onBack={() => router.back()}
        right={
          <View style={styles.bookBadge}>
            <IconBook size={22} color="#FFFFFF" />
          </View>
        }
      />
      <SegmentedControl options={['This Quarter', 'Semester', 'Year']} value={term} onChange={setTerm} />

      <Card>
        <View style={styles.statsRow}>
          {rate != null ? <DonutGauge percent={rate} size={74} stroke={9} showLabel={false} /> : <View style={styles.gaugePlaceholder} />}
          <View style={styles.rateCol}>
            <Text style={styles.rateBig}>{rate != null ? `${rate}%` : '—'}</Text>
            <Text style={styles.rateLabel}>Attendance Rate</Text>
          </View>
          <View style={styles.trioRow}>
            <View style={styles.statCol}>
              <Text style={[styles.statValue, { color: colors.danger }]}>{absences}</Text>
              <Text style={styles.statLabel}>Absence</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={[styles.statValue, { color: colors.warning }]}>{tardies}</Text>
              <Text style={styles.statLabel}>Tardy</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>{records.filter((r) => r.status === 'early-dismissal').length}</Text>
              <Text style={styles.statLabel}>Early{'\n'}Dismissals</Text>
            </View>
          </View>
        </View>
      </Card>

      <Card>
        <View style={styles.monthRow}>
          <Text style={styles.monthTitle}>Monthly View</Text>
          <View style={styles.monthNav}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous month"
              style={styles.monthArrow}
              onPress={() => shiftMonth(-1)}
            >
              <IconChevronBack size={22} color={colors.textSecondary} />
            </Pressable>
            <Text style={styles.monthName}>{monthName}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next month"
              style={styles.monthArrow}
              onPress={() => shiftMonth(1)}
            >
              <IconChevronRight size={22} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>
        <View style={styles.weekHead}>
          {WEEKDAY_HEAD.map((d) => (
            <Text key={d} style={styles.weekHeadText}>{d}</Text>
          ))}
        </View>
        <View style={styles.grid}>
          {cells.map(({ day, muted }, i) => {
            const status = monthlyAttendance[String(day)];
            const isToday = !muted && viewIsCurrentMonth && day === todayDay;
            return (
              <View key={`${day}-${i}`} style={[styles.cell, isToday && styles.cellToday]}>
                <Text style={[styles.cellText, isToday && styles.cellTextToday, muted && styles.cellTextMuted]}>{day}</Text>
                {status && !muted ? <View style={[styles.dot, { backgroundColor: STATUS_COLORS[status] }]} /> : <View style={styles.dotSpacer} />}
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
            title={`${WEEKDAYS[new Date(r.date + 'T12:00:00').getDay()]}  ${formatDayLabel(r.date)}`}
            subtitle={historySubtitle(r)}
            // Audit: no detail route exists for a single attendance record —
            // no actionless affordance is drawn.
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
        <View style={styles.infoRow}>
          <IconPerson size={18} color={colors.textSecondary} />
          <Text style={styles.infoLabel}>Teacher</Text>
          <Text style={styles.infoValue}>{c.teacher}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Email ${c.teacher}`}
            onPress={() => void openMailto(c.teacherEmail)}
          >
            <IconMail size={20} color={colors.brandRed} />
          </Pressable>
        </View>
        <View style={styles.infoRow}>
          <IconPin size={18} color={colors.textSecondary} />
          <Text style={styles.infoLabel}>Room</Text>
          <Text style={styles.infoValue}>{c.room}</Text>
        </View>
        <View style={styles.infoRow}>
          <IconBook size={18} color={colors.textSecondary} />
          <Text style={styles.infoLabel}>Periods</Text>
          <Text style={styles.infoValue}>{c.period}</Text>
        </View>
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
  rateCol: { flex: 1, minWidth: 0, marginLeft: 12 },
  gaugePlaceholder: { width: 74, height: 74, borderRadius: 37, backgroundColor: '#EEF0F3' },
  trioRow: { flexDirection: 'row', alignItems: 'flex-start' },
  statCol: { width: 52, alignItems: 'center' },
  rateBig: { fontSize: 32, fontWeight: '700', color: colors.text },
  rateLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 9, color: colors.textSecondary, lineHeight: 12, textAlign: 'center' },
  monthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.md },
  monthNav: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  monthArrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  monthTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  monthName: { fontSize: 14, color: colors.textSecondary },
  weekHead: { flexDirection: 'row', marginBottom: space.xs },
  weekHeadText: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  cellToday: { backgroundColor: '#EEF0F3' },
  cellText: { fontSize: 13, color: colors.text },
  cellTextMuted: { color: '#C9CFD6' },
  cellTextToday: { fontWeight: '700' },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 2 },
  dotSpacer: { height: 8 },
  legend: { flexDirection: 'row', justifyContent: 'space-around', marginTop: space.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendText: { fontSize: 11, color: colors.textSecondary },
  bookBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brandRed, alignItems: 'center', justifyContent: 'center' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, minHeight: 44 },
  infoLabel: { fontSize: 14, color: colors.textSecondary, width: 70 },
  infoValue: { fontSize: 14, fontWeight: '600', color: colors.text, flex: 1 },
});
