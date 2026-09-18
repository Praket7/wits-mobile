import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BrandBand, WitsLogoHeader } from '@/components/BrandBand';
import { DonutGauge } from '@/components/gauges';
import { EventDateTile } from '@/components/patterns';
import { Card, EmptyState, ErrorState, ListRow, Screen, SectionHeader, SegmentedControl } from '@/components/ui';
import {
  IconBook,
  IconCalendar,
  IconGlobe,
  IconGradCap,
  IconMail,
  IconPerson,
  IconStats,
} from '@/components/icons';
import { colors, space } from '@/design/tokens';
import { useCalendar, useStudents } from '@/queries/useWits';
import { useSession } from '@/state/appState';

export default function ParentToday() {
  const { selectedStudentId } = useSession();
  const students = useStudents();
  const calendar = useCalendar(selectedStudentId);
  const [segment, setSegment] = useState('Today');

  if (students.isLoading) return <Screen><EmptyState title="Loading…" /></Screen>;
  if (students.isError) return <Screen><ErrorState message={String(students.error)} /></Screen>;

  const all = students.data ?? [];
  const student = all.find((s) => s.id === selectedStudentId) ?? all[0];

  return (
    <Screen>
      <WitsLogoHeader initials="PG" />
      <Text style={styles.screenTitle}>Parent Today</Text>
      <Text style={styles.screenSub}>Stay informed. Support their success.</Text>
      <SegmentedControl options={['Overview', 'Academics', 'Attendance', 'School Life']} value="Overview" onChange={setSegment} />

      <Card style={{ backgroundColor: colors.dangerBg }}>
        <View style={styles.greetingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greetingTitle}>Good evening!</Text>
            <Text style={styles.greetingSub}>{`Here's a summary of ${student?.name.split(' ')[0]}'s day.`}</Text>
          </View>
          <Text style={styles.greetingDate}>Thu, Sep 17, 2026</Text>
        </View>
      </Card>

      <View style={styles.quickRow}>
        <QuickStat icon={<IconBook size={24} />} value="5" label="Classes Today" sub="1 upcoming" />
        <QuickStat icon={<IconStats size={24} color={colors.success} />} value="3" label="Assignments Due" sub="1 tomorrow" />
        <QuickStat icon={<IconCalendar size={24} />} value="1" label="Event Today" sub="Student Council" />
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
          <SegmentedControl options={['Today', 'This Week', 'This Month']} value={segment} onChange={setSegment} />
          <View style={styles.dateRow}>
            <Text style={styles.dateArrow}>‹</Text>
            <Text style={styles.dateText}>Thursday, September 17, 2026</Text>
            <Text style={styles.dateArrow}>›</Text>
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
          <DonutGauge percent={student?.attendanceRate ?? 98} size={84} />
          <View style={{ marginLeft: space.lg, flex: 1 }}>
            <Text style={styles.attRate}>{student?.attendanceRate ?? 98}%</Text>
            <Text style={styles.attRateLabel}>Attendance Rate This Year</Text>
            <Text style={styles.attSub}>Out of {student?.schoolDays ?? 98} school days</Text>
          </View>
          <View style={{ gap: space.md, alignItems: 'flex-end' }}>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.attStat, { color: colors.danger }]}>{student?.absences ?? 2}</Text>
              <Text style={styles.attStatLabel}>Absences</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.attStat, { color: colors.warning }]}>{student?.tardies ?? 1}</Text>
              <Text style={styles.attStatLabel}>Tardy</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.attStat}>{student?.earlyDismissals ?? 0}</Text>
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
          onAction={() => router.push('/(parent)/(tabs)/academics' as never)}
        />
        <View style={styles.snapshotRow}>
          <View style={styles.snapshotBox}>
            <Text style={[styles.snapshotValue, { color: colors.success }]}>3</Text>
            <Text style={styles.snapshotLabel}>Assignments Due This Week</Text>
          </View>
          <View style={styles.snapshotBox}>
            <Text style={[styles.snapshotValue, { color: '#1A73E8' }]}>{student?.gpa.toFixed(1) ?? '3.9'}</Text>
            <Text style={styles.snapshotLabel}>Current GPA (Weighted)</Text>
          </View>
          <View style={styles.snapshotBox}>
            <Text style={styles.snapshotValue}>0</Text>
            <Text style={styles.snapshotLabel}>Missing Assignments</Text>
          </View>
        </View>
      </Card>

      <Card>
        <SectionHeader
          title="Upcoming Events"
          icon={<IconCalendar size={20} />}
          actionLabel="See All"
          onAction={() => router.push('/(parent)/(tabs)/calendar' as never)}
        />
        {(calendar.data ?? []).slice(0, 3).map((e) => {
          const d = new Date(e.start);
          return (
            <ListRow
              key={e.id}
              title={e.title}
              subtitle={`${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} – ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}\n${e.location ?? ''}`}
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
        })}
      </Card>

      <Card>
        <SectionHeader title="Important Links" icon={<IconMail size={20} />} />
        <ListRow title="Report an Absence" left={<IconDocIcon />} chevron />
        <ListRow title="Contact a Teacher" left={<IconPerson size={22} color={colors.textSecondary} />} chevron />
        <ListRow title="School Website" left={<IconGlobe size={22} color={colors.textSecondary} />} chevron />
        <ListRow title="Guidance & Counseling" left={<IconGradCap size={22} color={colors.textSecondary} />} chevron />
      </Card>

      <BrandBand />
    </Screen>
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

function IconDocIcon() {
  return <IconStats size={22} color={colors.textSecondary} />;
}

const styles = StyleSheet.create({
  screenTitle: { fontSize: 30, fontWeight: '700', color: colors.text, marginTop: space.sm },
  screenSub: { fontSize: 15, color: colors.textSecondary, marginTop: space.xs, marginBottom: space.md },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  greetingTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  greetingSub: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  greetingDate: { fontSize: 12, color: colors.textSecondary },
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
  dateArrow: { fontSize: 20, color: colors.textSecondary, paddingHorizontal: space.md },
  dateText: { fontSize: 15, fontWeight: '600', color: colors.text },
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
});
