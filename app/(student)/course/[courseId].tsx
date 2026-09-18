import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SchoolBackdrop } from '@/components/brand';
import { ScorePill } from '@/components/patterns';
import { AppHeader, Card, EmptyState, ErrorState, ListRow, Screen, SectionHeader, SegmentedControl, StatusPill } from '@/components/ui';
import {
  IconBook,
  IconCalendar,
  IconClock,
  IconDocText,
  IconFolder,
  IconFlask,
  IconLink,
  IconMail,
  IconMega,
  IconOpenExternal,
  IconPerson,
  IconPin,
  IconStats,
} from '@/components/icons';
import { colors, radius, space } from '@/design/tokens';
import { useAssignments, useCourse } from '@/queries/useWits';
import { dueLabel } from '@/utils/format';

const EAST_IMG = require('@/assets/branding/east.png');

const BREAKDOWN = [
  { label: 'Tests', percent: 92 },
  { label: 'Quizzes', percent: 88 },
  { label: 'Labs', percent: 93 },
  { label: 'Homework', percent: 87 },
  { label: 'Participation', percent: 100 },
];

export default function CourseDetail() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const course = useCourse(courseId);
  const assignments = useAssignments('stu-praket');
  const [view, setView] = useState('Overview');
  const [mpId, setMpId] = useState('q1');

  if (course.isLoading) return <Screen><EmptyState title="Loading…" /></Screen>;
  if (course.isError || !course.data) return <Screen><ErrorState message={String(course.error)} /></Screen>;

  const c = course.data;
  const periods = c.markingPeriods ?? [{ id: 'q1', label: 'Q1', gradePercent: c.gradePercent, letterGrade: c.letterGrade, updated: 'Sep 16, 2026' }];
  const selectedMp = periods.find((p) => p.id === mpId) ?? periods[0];
  const courseAssignments = (assignments.data ?? []).filter((a) => a.courseId === courseId);
  const nextAssignment = courseAssignments.find((a) => a.status === 'upcoming');
  const gradedAssignments = courseAssignments.filter((a) => a.status === 'graded');

  return (
    <Screen>
      <AppHeader title={c.name} onBack={() => router.back()} />

      {/* Hero */}
      <View style={styles.hero}>
        <SchoolBackdrop source={EAST_IMG} height={140} opacity={0.42} />
        <View style={styles.heroOverlay}>
          <Text style={styles.heroTeacher}>{c.teacher}</Text>
          <Text style={styles.heroRoom}>Room {c.room} • Period {c.period}</Text>
          <Text style={styles.heroTime}>{c.meetingTime}</Text>
        </View>
        <View style={styles.heroBadge}>
          <IconFlask size={30} />
        </View>
      </View>

      <SegmentedControl options={['Overview', 'Assignments', 'Grades', 'Info']} value={view} onChange={setView} />

      {view === 'Overview' && (
        <>
          <Card>
            <View style={styles.gradeRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.gradeLabel}>Current Grade</Text>
                <Text style={styles.gradeValue}>{selectedMp?.gradePercent ?? c.gradePercent}%</Text>
                <Text style={styles.letterGrade}>{selectedMp?.letterGrade ?? c.letterGrade}</Text>
              </View>
              <View style={styles.mpBox}>
                <MarkingPeriodPicker
                  periods={c.markingPeriods ?? [{ id: 'q1', label: 'Q1', gradePercent: c.gradePercent, letterGrade: c.letterGrade, updated: 'Sep 16, 2026' }]}
                  onSelect={(mp) => setMpId(mp.id)}
                  selectedId={mpId}
                />
                <Text style={styles.mpUpdated}>{selectedMp?.updated ?? 'Sep 16, 2026'}</Text>
              </View>
            </View>
          </Card>

          {nextAssignment && (
            <Card style={{ backgroundColor: colors.dangerBg }}>
              <ListRow
                title="Next Assignment"
                subtitle={nextAssignment.title}
                left={<IconCalendar size={24} />}
                right={<View style={{ alignItems: 'flex-end' }}><Text style={styles.nextDue}>{dueLabel(nextAssignment.dueDate)}</Text><Text style={styles.nextDue}>11:59 PM</Text></View>}
                onPress={() => router.push(`/(student)/assignment/${nextAssignment.id}` as never)}
                chevron
              />
            </Card>
          )}

          <SectionHeader title="Recent Assignments" actionLabel="See All" onAction={() => setView('Assignments')} />
          <Card>
            {gradedAssignments.slice(0, 3).map((a) => (
              <ListRow
                key={a.id}
                title={a.title}
                subtitle={a.gradedDate ?? ''}
                chevron
                onPress={() => router.push(`/(student)/assignment/${a.id}` as never)}
                right={
                  a.earnedPoints != null && a.points ? (
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Text style={styles.scoreFraction}>{a.earnedPoints} / {a.points}</Text>
                      <ScorePill percent={Math.round((a.earnedPoints / a.points) * 100)} />
                    </View>
                  ) : null
                }
              />
            ))}
          </Card>

          <SectionHeader title="Class Announcements" icon={<IconMega size={20} />} />
          <Card>
            <ExpandableAnnouncement teacher={c.teacher} />
          </Card>

          <SectionHeader title="Course Resources" icon={<IconFolder size={20} />} />
          <Card>
            <View style={styles.tilesRow}>
              <Tile icon={<IconDocText size={26} color="#1A73E8" />} title="Class Drive" subtitle="Notes, files, labs" onPress={() => Linking.openURL('https://drive.google.com').catch(() => {})} />
              <Tile icon={<IconLink size={26} color="#1A73E8" />} title="Course Links" subtitle="Helpful resources" onPress={() => router.push('/(student)/resources' as never)} />
              <Tile icon={<IconBook size={26} color={colors.brandRed} />} title="Textbook" subtitle="View online" onPress={() => Linking.openURL('https://www.williamsvillek12.org').catch(() => {})} />
            </View>
          </Card>
        </>
      )}

      {view === 'Assignments' && (
        <Card>
          <SectionHeader title="All Assignments" actionLabel="Filter" />
          {courseAssignments.map((a) => (
            <ListRow
              key={a.id}
              title={a.title}
              subtitle={a.status === 'graded' ? `Graded ${a.gradedDate}` : dueLabel(a.dueDate)}
              chevron
              onPress={() => router.push(`/(student)/assignment/${a.id}` as never)}
              right={
                <StatusPill
                  label={
                    a.status === 'graded'
                      ? `${Math.round(((a.earnedPoints ?? 0) / (a.points ?? 1)) * 100)}%`
                      : a.status === 'missing'
                        ? 'Missing'
                        : a.status === 'no-due-date'
                          ? 'No Due Date'
                          : a.dueDate === '2026-09-18'
                            ? 'Due Tomorrow'
                            : 'Not Submitted'
                  }
                  tone={a.status === 'graded' ? 'success' : a.status === 'missing' ? 'danger' : a.dueDate === '2026-09-18' ? 'danger' : 'neutral'}
                />
              }
            />
          ))}
        </Card>
      )}

      {view === 'Grades' && (
        <>
          <Card>
            <SectionHeader title="Grade Breakdown" icon={<IconStats size={20} />} />
            {BREAKDOWN.map((b) => (
              <View key={b.label} style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>{b.label}</Text>
                <Text style={styles.breakdownPercent}>{b.percent}%</Text>
                <View style={styles.breakdownBarWrap}>
                  <View style={[styles.breakdownBar, { width: `${b.percent}%`, backgroundColor: b.percent >= 90 ? colors.success : colors.brandGold }]} />
                </View>
              </View>
            ))}
          </Card>
          <Card>
            <SectionHeader title="Recent Grades" />
            {gradedAssignments.map((a) => (
              <ListRow
                key={a.id}
                title={a.title}
                subtitle={`Graded ${a.gradedDate}`}
                right={
                  a.earnedPoints != null && a.points ? (
                    <ScorePill percent={Math.round((a.earnedPoints / a.points) * 100)} />
                  ) : null
                }
              />
            ))}
          </Card>
        </>
      )}

      {view === 'Info' && (
        <>
          <Card>
            <SectionHeader title="Class Information" icon={<IconBook size={20} />} />
            <ListRow title="Teacher" subtitle={c.teacher} left={<IconPerson size={22} />} right={<IconMail size={22} />} />
            <ListRow title="Room" subtitle={c.room} left={<IconPin size={22} />} />
            <ListRow title="Period" subtitle={`${c.period}`} left={<IconClock size={22} />} />
            <ListRow title="Meeting Time" subtitle={c.meetingTime} left={<IconCalendar size={22} />} />
          </Card>
          {c.description ? (
            <Card>
              <SectionHeader title="Course Description" icon={<IconDocText size={20} />} />
              <Text style={styles.description}>{c.description}</Text>
            </Card>
          ) : null}
          <Card style={{ backgroundColor: colors.dangerBg }}>
            <ListRow title="View in Course Catalog" left={<IconOpenExternal />} chevron />
          </Card>
        </>
      )}
    </Screen>
  );
}

function Tile({ icon, title, subtitle, onPress }: { icon: React.ReactNode; title: string; subtitle: string; onPress: () => void }) {
  return (
    <Pressable style={styles.tile} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${title}: ${subtitle}`}>
      <View style={{ height: 32, justifyContent: 'center' }}>{icon}</View>
      <Text style={styles.tileTitle}>{title}</Text>
      <Text style={styles.tileSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

function ExpandableAnnouncement({ teacher }: { teacher: string }) {
  const [expanded, setExpanded] = useState(false);
  const full = 'Please make sure to bring your lab notebook, calculator, and safety goggles tomorrow. We will be performing the equilibrium lab, so closed-toe shoes are required.';
  return (
    <ListRow
      title="Lab Tomorrow"
      subtitle={`${teacher} • Sep 15, 2026\n${expanded ? full : `${full.slice(0, 84)}…`}`}
      chevron
      onPress={() => setExpanded((e) => !e)}
    />
  );
}

function MarkingPeriodPicker({
  periods,
  selectedId,
  onSelect,
}: {
  periods: { id: string; label: string; gradePercent: number | null; letterGrade: string | null; updated: string }[];
  selectedId: string;
  onSelect: (mp: { id: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = periods.find((p) => p.id === selectedId) ?? periods[0];
  return (
    <View>
      <Pressable
        style={styles.mpChip}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Marking period ${selected?.label ?? 'Q1'}, opens picker`}
      >
        <Text style={styles.mpChipText}>{`${selected?.label ?? 'Q1'} ⌄`}</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.mpModalBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.mpModalCard} onPress={() => {}}>
            <Text style={styles.mpModalTitle}>Marking Period</Text>
            {periods.map((p) => (
              <Pressable
                key={p.id}
                style={styles.mpOption}
                onPress={() => {
                  onSelect(p);
                  setOpen(false);
                }}
                accessibilityRole="button"
                accessibilityLabel={`${p.label}: ${p.gradePercent != null ? `${p.gradePercent}%` : 'No grade yet'}`}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.mpOptionLabel}>{p.label}</Text>
                  <Text style={styles.mpOptionSub}>
                    {p.gradePercent != null ? `${p.gradePercent}% ${p.letterGrade ?? ''} · ${p.updated}` : p.updated}
                  </Text>
                </View>
                {p.id === selectedId ? <Text style={styles.mpCheck}>✓</Text> : null}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: radius.card, overflow: 'hidden', marginBottom: space.md },
  heroOverlay: { padding: space.lg, paddingRight: 96 },
  heroTeacher: { fontSize: 26, fontWeight: '700', color: colors.text },
  heroRoom: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  heroTime: { fontSize: 14, color: colors.textSecondary },
  heroBadge: {
    position: 'absolute',
    right: 20,
    top: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brandRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeRow: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  gradeLabel: { fontSize: 13, color: colors.textSecondary },
  gradeValue: { fontSize: 40, fontWeight: '700', color: colors.text },
  letterGrade: { fontSize: 15, color: colors.textSecondary },
  mpBox: { alignItems: 'flex-end' },
  mpChip: { backgroundColor: colors.dangerBg, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  mpChipText: { color: colors.brandRed, fontWeight: '700', fontSize: 14 },
  mpUpdated: { fontSize: 11, color: colors.textSecondary, marginTop: 6 },
  mpModalBackdrop: { flex: 1, backgroundColor: 'rgba(22,24,29,0.45)', alignItems: 'center', justifyContent: 'center', padding: space.xl },
  mpModalCard: { backgroundColor: colors.surface, borderRadius: radius.card, padding: space.lg, width: '100%', maxWidth: 320 },
  mpModalTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: space.sm },
  mpOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: space.md, minHeight: 44 },
  mpOptionLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  mpOptionSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  mpCheck: { color: colors.brandRed, fontSize: 17, fontWeight: '700', paddingLeft: space.sm },
  nextDue: { fontSize: 13, fontWeight: '600', color: colors.brandRed },
  scoreFraction: { fontSize: 14, color: colors.textSecondary },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.sm },
  breakdownLabel: { width: 100, fontSize: 14, color: colors.text },
  breakdownPercent: { width: 44, fontSize: 14, fontWeight: '700', color: colors.text, textAlign: 'right' },
  breakdownBarWrap: { flex: 1, height: 8, borderRadius: 4, backgroundColor: '#E2E5E9', overflow: 'hidden' },
  breakdownBar: { height: 8, borderRadius: 4 },
  description: { fontSize: 15, color: colors.text, lineHeight: 22 },
  tilesRow: { flexDirection: 'row', gap: space.sm },
  tile: { flex: 1, backgroundColor: '#F7F8FA', borderRadius: 12, padding: space.md, alignItems: 'center' },
  tileTitle: { fontSize: 12, fontWeight: '700', color: colors.text, marginTop: 4, textAlign: 'center' },
  tileSubtitle: { fontSize: 10, color: colors.textSecondary, textAlign: 'center', marginTop: 2 },
});
