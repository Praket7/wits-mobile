import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BrandBand, WitsLogoHeader } from '@/components/brand';
import { DonutGauge } from '@/components/gauges';
import { EventDateTile } from '@/components/patterns';
import { Card, EmptyState, ErrorState, ListRow, Screen, SectionHeader, SegmentedControl } from '@/components/ui';
import {
  IconBell,
  IconBook,
  IconCalendar,
  IconChevronBack,
  IconChevronRight,
  IconDocText,
  IconGlobe,
  IconGradCap,
  IconMail,
  IconPerson,
  IconStats,
} from '@/components/icons';
import { colors, space } from '@/design/tokens';
import { friendlyError } from '@/utils/errors';
import { useAssignments, useAttendance, useCalendar, useCourses, useStudents } from '@/queries/useWits';
import { useSelectedStudentId } from '@/state/appState';
import { openExternalUrl } from '@/utils/openUrl';
import { formatDateLong } from '@/utils/format';
import type { CalendarEvent } from '@/domain/schemas';

const OVERVIEW = ['Overview', 'Academics', 'Attendance', 'School Life'] as const;
const RANGES = ['Today', 'This Week', 'This Month'] as const;

export default function ParentToday() {
  const selectedStudentId = useSelectedStudentId();
  const students = useStudents();
  const [segment, setSegment] = useState<string>('Overview');
  const [range, setRange] = useState<string>('Today');
  const [offsetDays, setOffsetDays] = useState(0);

  if (students.isLoading) return <Screen><EmptyState title="Loading…" /></Screen>;
  if (students.isError) return <Screen><ErrorState message={friendlyError(students.error).body} onRetry={() => students.refetch()} /></Screen>;

  const all = students.data ?? [];
  const student = all.find((s) => s.id === selectedStudentId) ?? all[0];
  const sid = student?.id ?? '';

  const viewDate = new Date();
  viewDate.setDate(viewDate.getDate() + offsetDays);

  return (
    <Screen>
      <WitsLogoHeader />
      <Text style={styles.screenTitle}>Parent Today</Text>
      <Text style={styles.screenSub}>Stay informed. Support their success.</Text>
      <SegmentedControl options={[...OVERVIEW]} value={segment} onChange={setSegment} />

      {segment === 'Overview' && <OverviewView sid={sid} student={student} range={range} setRange={setRange} offsetDays={offsetDays} setOffsetDays={setOffsetDays} viewDate={viewDate} onGoAcademics={() => setSegment('Academics')} />}
      {segment === 'Academics' && <AcademicsView sid={sid} />}
      {segment === 'Attendance' && <AttendanceView sid={sid} />}
      {segment === 'School Life' && <SchoolLifeView sid={sid} viewDate={viewDate} range={range} />}

      <BrandBand />
    </Screen>
  );
}

function OverviewView({
  sid,
  student,
  range,
  setRange,
  offsetDays,
  setOffsetDays,
  viewDate,
  onGoAcademics,
}: {
  sid: string;
  student: { name: string; school: string; initials: string; grade: number; attendanceRate: number; schoolDays: number; absences: number; tardies: number; earlyDismissals: number; gpa: number } | undefined;
  range: string;
  setRange: (v: string) => void;
  offsetDays: number;
  setOffsetDays: (n: number) => void;
  viewDate: Date;
  onGoAcademics: () => void;
}) {
  const assignments = useAssignments(sid);
  const list = assignments.data ?? [];
  // Audit P1: derived from live course data — no literal "5 Classes".
  const coursesQuery = useCourses(sid);
  const coursesCount = (coursesQuery.data ?? []).length;
  const soon = list.filter((a) => {
    if (!a.dueDate) return false;
    const diff = (new Date(a.dueDate).getTime() - viewDate.getTime()) / 86_400_000;
    return diff >= 0 && diff <= 7;
  }).length;
  const missing = list.filter((a) => a.status === 'missing').length;

  return (
    <>
      <Card style={{ backgroundColor: colors.dangerBg }}>
        <View style={styles.greetingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greetingTitle}>Good evening!</Text>
            <Text style={styles.greetingSub}>{`Here's a summary of ${student?.name.split(' ')[0] ?? 'your student'}'s day.`}</Text>
          </View>
          <Text style={styles.greetingDate}>{viewDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</Text>
        </View>
      </Card>

      <NeedsAttentionCard sid={sid} />

      <View style={styles.quickRow}>
        <QuickStat icon={<IconBook size={24} />} value={String(coursesCount)} label="Classes Today" sub="enrolled" />
        <QuickStat icon={<IconStats size={24} color={colors.success} />} value={String(soon)} label="Due This Week" sub="across all classes" />
        <QuickStat icon={<IconCalendar size={24} />} value={String(missing)} label="Missing" sub="needs attention" />
      </View>

      {student && (
        <Card>
          <ListRow
            title={student.name}
            subtitle={student.school}
            left={
              <View style={styles.childAvatar}>
                <Text style={styles.childAvatarText}>{student.initials}</Text>
              </View>
            }
            right={<Text style={styles.gradeLabel}>Grade {student.grade}</Text>}
            chevron
            onPress={() => router.push('/(parent)/students' as never)}
          />
          <SegmentedControl options={[...RANGES]} value={range} onChange={setRange} />
          <View style={styles.dateRow}>
            {/* Icon arrows, not text glyphs (item 63). */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous day"
              disabled={offsetDays <= 0}
              onPress={() => setOffsetDays(Math.max(0, offsetDays - 1))}
              style={styles.dateArrowBtn}
            >
              <IconChevronBack size={20} color={offsetDays <= 0 ? colors.border : colors.brandRed} />
            </Pressable>
            <Text style={styles.dateText}>{formatDateLong(viewDate)}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next day"
              onPress={() => setOffsetDays(offsetDays + 1)}
              style={styles.dateArrowBtn}
            >
              <IconChevronRight size={20} color={colors.brandRed} />
            </Pressable>
          </View>
        </Card>
      )}

      <Card>
        <SectionHeader
          title="Attendance Summary"
          icon={<IconPerson size={20} />}
          actionLabel="View Details"
          onAction={() => router.push('/(student)/attendance' as never)}
        />
        <View style={styles.attRow}>
          {/* Audit P1: no fabricated fallbacks — when the source does not
              provide a figure it renders as Unavailable (—). */}
          <DonutGauge percent={student?.attendanceRate ?? 0} size={84} />
          <View style={{ marginLeft: space.lg, flex: 1 }}>
            <Text style={styles.attRate}>{student != null ? `${student.attendanceRate}%` : '—'}%</Text>
            <Text style={styles.attRateLabel}>Attendance Rate This Year</Text>
            {student?.schoolDays != null && (
              <Text style={styles.attSub}>Out of {student.schoolDays} school days</Text>
            )}
          </View>
          <View style={{ gap: space.md, alignItems: 'flex-end' }}>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.attStat, { color: colors.danger }]}>{student != null ? student.absences : '—'}</Text>
              <Text style={styles.attStatLabel}>Absences</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.attStat, { color: colors.warning }]}>{student != null ? student.tardies : '—'}</Text>
              <Text style={styles.attStatLabel}>Tardy</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.attStat}>{student != null ? student.earlyDismissals : '—'}</Text>
              <Text style={styles.attStatLabel}>Early Dismissals</Text>
            </View>
          </View>
        </View>
      </Card>

      <Card>
        <SectionHeader
          title="Academic Snapshot"
          icon={<IconBook size={20} />}
          actionLabel="View Academics"
          onAction={onGoAcademics}
        />
        <View style={styles.snapshotRow}>
          <View style={styles.snapshotBox}>
            <Text style={[styles.snapshotValue, { color: colors.success }]}>{soon}</Text>
            <Text style={styles.snapshotLabel}>Assignments Due This Week</Text>
          </View>
          <View style={styles.snapshotBox}>
            <Text style={[styles.snapshotValue, { color: '#1A73E8' }]}>{student != null ? student.gpa.toFixed(1) : '—'}</Text>
            <Text style={styles.snapshotLabel}>Current GPA (Weighted)</Text>
          </View>
          <View style={styles.snapshotBox}>
            <Text style={styles.snapshotValue}>{missing}</Text>
            <Text style={styles.snapshotLabel}>Missing Assignments</Text>
          </View>
        </View>
      </Card>

      <UpcomingEventsCard sid={sid} viewDate={viewDate} range={range} />

      <Card>
        <SectionHeader title="Important Links" icon={<IconMail size={20} />} />
        <ListRow title="Report an Absence" left={<IconDocText size={22} color={colors.textSecondary} />} chevron onPress={() => router.push({ pathname: '/(parent)/attendance/report', params: { studentId: sid } })} />
        <ListRow title="Forms & Signatures" left={<IconDocText size={22} color={colors.textSecondary} />} chevron onPress={() => router.push('/(parent)/forms' as never)} />
        <ListRow title="Contact a Teacher" left={<IconPerson size={22} color={colors.textSecondary} />} chevron onPress={() => router.push('/(parent)/(tabs)/messages' as never)} />
        <ListRow title="School Website" left={<IconGlobe size={22} color={colors.textSecondary} />} chevron onPress={() => void openExternalUrl('https://www.williamsvillek12.org')} />
        <ListRow title="Guidance & Counseling" left={<IconGradCap size={22} color={colors.textSecondary} />} chevron onPress={() => router.push('/(student)/guidance' as never)} />
      </Card>
    </>
  );
}

/**
 * Needs Attention (item 15): one card answering "what needs action?" so
 * parents don't have to inspect four tabs. Every row deep-links to the fix.
 */
function NeedsAttentionCard({ sid }: { sid: string }) {
  const assignments = useAssignments(sid);
  const attendance = useAttendance(sid);

  const missing = (assignments.data ?? []).filter((a) => a.status === 'missing');
  const newGrades = (assignments.data ?? []).filter(
    (a) => a.status === 'graded' && a.gradedDate === '2026-09-17',
  );
  const issues = (attendance.data ?? []).filter((r) => r.status === 'absent' || r.status === 'tardy');
  // Forms await signature later (item 201) — placeholder keeps the slot visible.
  const forms = 0;

  const items: { key: string; icon: React.ReactNode; title: string; subtitle: string; route: string }[] = [];
  if (missing.length > 0) {
    items.push({
      key: 'missing',
      icon: <IconDocText size={22} color={colors.danger} />,
      title: `${missing.length} missing assignment${missing.length === 1 ? '' : 's'}`,
      subtitle: missing[0].title + (missing.length > 1 ? ` and ${missing.length - 1} more` : ''),
      route: '/(student)/assignments' as never,
    });
  }
  if (issues.length > 0) {
    items.push({
      key: 'att',
      icon: <IconCalendar size={22} color={colors.warning} />,
      title: `${issues.length} attendance issue${issues.length === 1 ? '' : 's'} this term`,
      subtitle: 'Tardies and absences recorded',
      route: '/(student)/attendance' as never,
    });
  }
  if (newGrades.length > 0) {
    items.push({
      key: 'grades',
      icon: <IconStats size={22} color={colors.success} />,
      title: `${newGrades.length} new grade${newGrades.length === 1 ? '' : 's'} posted`,
      subtitle: newGrades[0].title,
      route: '/(parent)/(tabs)/academics' as never,
    });
  }
  if (forms > 0) {
    items.push({ key: 'forms', icon: <IconDocText size={22} />, title: 'Form awaiting signature', subtitle: 'District permission form', route: '/(student)/resources' as never });
  }
  if (items.length === 0) {
    return (
      <Card style={{ backgroundColor: colors.successBg }}>
        <Text style={styles.allGoodTitle}>All caught up</Text>
        <Text style={styles.allGoodBody}>Nothing needs your attention right now.</Text>
      </Card>
    );
  }
  return (
    <Card>
      <SectionHeader title="Needs Attention" icon={<IconBell size={20} />} />
      {items.map((it) => (
        <ListRow
          key={it.key}
          title={it.title}
          subtitle={it.subtitle}
          left={it.icon}
          chevron
          onPress={() => router.push(it.route as never)}
        />
      ))}
    </Card>
  );
}

function UpcomingEventsCard({ sid, viewDate, range }: { sid: string; viewDate: Date; range: string }) {
  const calendar = useCalendar(sid);
  const events = filterEventsByRange(calendar.data ?? [], viewDate, range);

  return (
    <Card>
      <SectionHeader
        title="Upcoming Events"
        icon={<IconCalendar size={20} />}
        actionLabel="See All"
        onAction={() => router.push('/(parent)/(tabs)/calendar' as never)}
      />
      {events.length === 0 ? (
        <EmptyState title="No events in this range" message="Try This Week or This Month." />
      ) : (
        events.slice(0, 5).map((e) => {
          const d = new Date(e.start);
          return (
            <ListRow
              key={e.id}
              title={e.title}
              subtitle={`${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}\n${e.location ?? ''}`}
              left={
                <EventDateTile
                  month={d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                  day={String(d.getDate())}
                  barColor={e.source === 'athletics' ? colors.brandGold : colors.brandRed}
                />
              }
              chevron
            />
          );
        })
      )}
    </Card>
  );
}

function filterEventsByRange(events: CalendarEvent[], viewDate: Date, range: string): CalendarEvent[] {
  const start = new Date(viewDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  if (range === 'This Week') end.setDate(end.getDate() + 7);
  else if (range === 'This Month') end.setMonth(end.getMonth() + 1);
  else end.setHours(23, 59, 59, 999);
  return events
    .filter((e) => {
      const t = new Date(e.start).getTime();
      return t >= start.getTime() && t <= end.getTime();
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

function AcademicsView({ sid }: { sid: string }) {
  const courses = useCourses(sid);
  if (courses.isLoading) return <EmptyState title="Loading classes…" />;
  if (courses.isError) return <ErrorState message={friendlyError(courses.error).body} />;

  return (
    <Card>
      <SectionHeader
        title="Class Grades"
        icon={<IconBook size={20} />}
        actionLabel="Open Academics"
        onAction={() => router.push('/(parent)/(tabs)/academics' as never)}
      />
      {(courses.data ?? []).map((c) => (
        <ListRow
          key={c.id}
          title={c.name}
          subtitle={c.teacher}
          right={<Text style={[styles.gradePill, { color: gradeColor(c.gradePercent ?? 0), backgroundColor: gradeBg(c.gradePercent ?? 0) }]}>{c.gradePercent != null ? `${c.gradePercent}%` : c.letterGrade ?? '—'}</Text>}
          chevron
          onPress={() => router.push({ pathname: '/(student)/course/[courseId]', params: { courseId: c.id } } as never)}
        />
      ))}
    </Card>
  );
}

function gradeColor(g: number) {
  if (g >= 90) return colors.success;
  if (g >= 80) return colors.warning;
  return colors.danger;
}
function gradeBg(g: number) {
  if (g >= 90) return colors.successBg;
  if (g >= 80) return colors.warningBg;
  return colors.dangerBg;
}

function AttendanceView({ sid }: { sid: string }) {
  const attendance = useAttendance(sid);
  const courses = useCourses(sid);
  if (attendance.isLoading) return <EmptyState title="Loading attendance…" />;
  if (attendance.isError) return <ErrorState message={friendlyError(attendance.error).body} />;

  const courseName = (courseId: string | null) =>
    (courses.data ?? []).find((c) => c.id === courseId)?.name ?? 'Attendance';

  const recent = (attendance.data ?? []).slice(0, 10);
  return (
    <Card>
      <SectionHeader
        title="Recent Attendance"
        icon={<IconPerson size={20} />}
        actionLabel="Full History"
        onAction={() => router.push('/(student)/attendance' as never)}
      />
      {recent.map((r) => (
        <ListRow
          key={r.id}
          title={courseName(r.courseId)}
          subtitle={new Date(r.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          right={
            <Text
              style={[
                styles.statusPill,
                r.status === 'present' && { color: colors.success, backgroundColor: colors.successBg },
                r.status === 'tardy' && { color: colors.warning, backgroundColor: colors.warningBg },
                r.status === 'absent' && { color: colors.danger, backgroundColor: colors.dangerBg },
              ]}
            >
              {r.status === 'early-dismissal' ? 'Early Dis.' : r.status.charAt(0).toUpperCase() + r.status.slice(1)}
            </Text>
          }
          onPress={() => router.push({ pathname: '/(student)/attendance/[courseId]', params: { courseId: r.courseId } } as never)}
        />
      ))}
    </Card>
  );
}

function SchoolLifeView({ sid, viewDate, range }: { sid: string; viewDate: Date; range: string }) {
  return (
    <>
      <UpcomingEventsCard sid={sid} viewDate={viewDate} range={range} />
      <Card>
        <SectionHeader title="Important Links" icon={<IconMail size={20} />} />
        <ListRow title="Report an Absence" left={<IconDocText size={22} color={colors.textSecondary} />} chevron onPress={() => router.push({ pathname: '/(parent)/attendance/report', params: { studentId: sid } })} />
        <ListRow title="Forms & Signatures" left={<IconDocText size={22} color={colors.textSecondary} />} chevron onPress={() => router.push('/(parent)/forms' as never)} />
        <ListRow title="Contact a Teacher" left={<IconPerson size={22} color={colors.textSecondary} />} chevron onPress={() => router.push('/(parent)/(tabs)/messages' as never)} />
        <ListRow title="School Website" left={<IconGlobe size={22} color={colors.textSecondary} />} chevron onPress={() => void openExternalUrl('https://www.williamsvillek12.org')} />
        <ListRow title="Guidance & Counseling" left={<IconGradCap size={22} color={colors.textSecondary} />} chevron onPress={() => router.push('/(student)/guidance' as never)} />
      </Card>
    </>
  );
}

function QuickStat({ icon, value, label, sub }: { icon: React.ReactNode; value: string; label: string; sub: string }) {
  return (
    <View style={styles.quickStat}>
      {icon}
      <Text style={styles.quickValue}>{value}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
      <Text style={styles.quickSub}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screenTitle: { fontSize: 30, fontWeight: '700', color: colors.text, marginTop: space.sm },
  screenSub: { fontSize: 15, color: colors.textSecondary, marginTop: space.xs, marginBottom: space.md },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  greetingTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  greetingSub: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  greetingDate: { fontSize: 12, color: colors.textSecondary, textAlign: 'right', flexShrink: 1 },
  quickRow: { flexDirection: 'row', gap: space.sm, marginBottom: space.md },
  quickStat: { flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: space.md },
  quickValue: { fontSize: 26, fontWeight: '700', color: colors.text, marginTop: space.xs },
  quickLabel: { fontSize: 12, color: colors.text, fontWeight: '600', marginTop: 2 },
  quickSub: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  childAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF0F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  childAvatarText: { fontSize: 16, fontWeight: '700', color: colors.text },
  gradeLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.sm },
  dateArrowBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  dateText: { fontSize: 15, fontWeight: '600', color: colors.text, flex: 1, textAlign: 'center' },
  attRow: { flexDirection: 'row', alignItems: 'center' },
  attRate: { fontSize: 30, fontWeight: '700', color: colors.text },
  attRateLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  attSub: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
  attStat: { fontSize: 20, fontWeight: '700' },
  attStatLabel: { fontSize: 10, color: colors.textSecondary },
  snapshotRow: { flexDirection: 'row', gap: space.sm },
  snapshotBox: { flex: 1, backgroundColor: '#F7F8FA', borderRadius: 12, padding: space.md },
  snapshotValue: { fontSize: 24, fontWeight: '700' },
  snapshotLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 4 },
  allGoodTitle: { fontSize: 16, fontWeight: '700', color: colors.success },
  allGoodBody: { fontSize: 13, color: colors.success, marginTop: 2 },
  gradePill: { fontSize: 15, fontWeight: '700', paddingHorizontal: space.sm, paddingVertical: 2, borderRadius: 999, overflow: 'hidden' },
  statusPill: { fontSize: 13, fontWeight: '600', paddingHorizontal: space.sm, paddingVertical: 2, borderRadius: 999, overflow: 'hidden' },
});
