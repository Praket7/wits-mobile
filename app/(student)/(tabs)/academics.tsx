import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WitsLogoHeader } from '@/components/brand';
import { Card, EmptyState, ErrorState, ListRow, Screen, SectionHeader, SegmentedControl, StatusPill } from '@/components/ui';
import { ScorePill } from '@/components/patterns';
import {
  IconBook,
  IconClipboard,
  IconCompass,
  IconDocText,
  IconFolder,
  IconGoogle,
  IconPeople,
  IconStats,
} from '@/components/icons';
import { colors, space } from '@/design/tokens';
import { friendlyError } from '@/utils/errors';
import { useAssignments, useCourses, useGrades } from '@/queries/useWits';
import { useSelectedStudentId } from '@/state/appState';
import { courseRoomLabel, courseTeacherLabel, dueLabel, scoreLabel } from '@/utils/format';
import { openExternalUrl } from '@/utils/openUrl';

export default function Academics() {
  const selectedStudentId = useSelectedStudentId();
  const courses = useCourses(selectedStudentId);
  const grades = useGrades(selectedStudentId);
  const assignments = useAssignments(selectedStudentId);
  const [view, setView] = useState('Classes');

  if (courses.isLoading) return <Screen><EmptyState title="Loading…" /></Screen>;
  if (courses.isError) return <Screen><ErrorState message={friendlyError(courses.error).body} /></Screen>;

  const dueSoon = (assignments.data ?? []).filter((a) => a.status === 'upcoming').slice(0, 4);

  return (
    <Screen>
      <WitsLogoHeader onBellPress={() => router.push('/(student)/notifications' as never)}
        onAvatarPress={() => router.push('/(student)/(tabs)/more' as never)}/>
      <Text style={styles.screenTitle}>Academics</Text>
      <Text style={styles.screenSub}>Your classes. Your progress. Your future.</Text>
      <SegmentedControl options={['Classes', 'Grades', 'Assignments']} value={view} onChange={setView} />

      {view === 'Classes' && (
        <>
          <Card>
            <SectionHeader title="Current Classes" />
            {(courses.data ?? []).map((c) => (
              <ListRow
                key={c.id}
                title={c.name}
                subtitle={`${courseTeacherLabel(c.teacher)} • Room ${courseRoomLabel(c.room)}\nPeriod ${c.period} • ${c.meetingTime}`}
                chevron
                onPress={() => router.push(`/(student)/course/${c.id}` as never)}
                right={
                  c.gradePercent != null ? <ScorePill percent={c.gradePercent} /> : null
                }
                left={<View style={[styles.colorBar, { backgroundColor: c.color }]} />}
              />
            ))}
          </Card>

          <Card>
            <SectionHeader title="Class Resources" icon={<IconFolder size={20} />} />
            <View style={styles.tilesRow}>
              <ResourceTile icon={<IconDocText size={26} color={colors.brandRed} />} title="Class Links" subtitle="Syllabi, websites, files" onPress={() => router.push('/(student)/resources' as never)} />
              <ResourceTile icon={<IconPeople size={26} color={colors.brandRed} />} title="Contact a Teacher" subtitle="Open your school messages" onPress={() => router.push('/(student)/(tabs)/messages' as never)} />
              <ResourceTile icon={<IconFolder size={26} color={colors.brandRed} />} title="School Resources" subtitle="Library, tutoring, more" onPress={() => router.push('/(student)/resources' as never)} />
            </View>
          </Card>
        </>
      )}

      {view === 'Grades' && (
        <Card>
          <SectionHeader title="Recent Grades" icon={<IconStats size={20} />} />
          {(grades.data ?? []).map((g) => (
            <ListRow
              key={g.id}
              title={g.assignmentTitle}
              subtitle={g.courseName}
              right={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                  <Text style={styles.scoreText}>{scoreLabel(g.earned, g.total)}</Text>
                  <ScorePill percent={g.percent} />
                </View>
              }
            />
          ))}
        </Card>
      )}

      {view === 'Assignments' && (
        <Card>
          <SectionHeader title="Assignments" icon={<IconDocText size={20} />} actionLabel="See All" onAction={() => router.push('/(student)/assignments')} />
          {dueSoon.map((a) => (
            <ListRow
              key={a.id}
              title={a.title}
              subtitle={a.courseName}
              chevron
              onPress={() => router.push(`/(student)/assignment/${a.id}` as never)}
              right={<StatusPill label={dueLabel(a.dueDate)} tone="danger" />}
            />
          ))}
        </Card>
      )}

      <SectionHeader title="Academic Tools" icon={<IconClipboard size={20} />} />
      <Card>
        <View style={styles.gridWrap}>
          <ToolTile icon={<IconGoogle size={24} />} title="Google Classroom" subtitle="Open your classes" onPress={() => void openExternalUrl('https://classroom.google.com')} />
          <ToolTile icon={<IconStats size={24} color="#1A73E8" />} title="eSchoolData" subtitle="Check district resources for access" onPress={() => router.push('/(student)/resources' as never)} />
          <ToolTile icon={<IconCompass size={24} color="#1A73E8" />} title="Naviance" subtitle="College & career planning" onPress={() => void openExternalUrl('https://student.naviance.com')} />
          <ToolTile icon={<IconBook size={24} color={colors.brandRed} />} title="Library Resources" subtitle="Research, databases, more" onPress={() => router.push('/(student)/resources' as never)} />
          <ToolTile icon={<IconPeople size={24} color={colors.brandRed} />} title="Tutoring" subtitle="NHS, peer tutoring, support" onPress={() => router.push('/(student)/guidance' as never)} />
          <ToolTile icon={<IconClipboard size={24} color={colors.brandGold} />} title="Course Requests" subtitle="View and plan for next year" onPress={() => router.push('/(student)/guidance-topic/catalog' as never)} />
        </View>
      </Card>
    </Screen>
  );
}

function ResourceTile({ icon, title, subtitle, onPress }: { icon: React.ReactNode; title: string; subtitle: string; onPress: () => void }) {
  return (
    <Pressable style={styles.tile} accessibilityRole="button" accessibilityLabel={`${title}: ${subtitle}`} onPress={onPress}>
      <View style={{ height: 32, justifyContent: 'center' }}>{icon}</View>
      <Text style={styles.tileTitle}>{title}</Text>
      <Text style={styles.tileSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

function ToolTile({ icon, title, subtitle, onPress }: { icon: React.ReactNode; title: string; subtitle: string; onPress: () => void }) {
  return (
    <Pressable style={styles.toolTile} accessibilityRole="button" accessibilityLabel={title} onPress={onPress}>
      <View style={{ height: 30, justifyContent: 'center', width: 30 }}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.toolTitle}>{title}</Text>
        <Text style={styles.tileSubtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screenTitle: { fontSize: 30, fontWeight: '700', color: colors.text, marginTop: space.sm },
  screenSub: { fontSize: 15, color: colors.textSecondary, marginTop: space.xs, marginBottom: space.md },
  scoreText: { fontSize: 14, color: colors.textSecondary },
  colorBar: { width: 4, height: 44, borderRadius: 2 },
  tilesRow: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tile: {
    width: '48%',
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: '#F7F8FA',
    borderRadius: 12,
    padding: space.md,
    alignItems: 'center',
  },
  tileTitle: { fontSize: 12, fontWeight: '700', color: colors.text, textAlign: 'center', marginTop: 4 },
  tileSubtitle: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginTop: 2, lineHeight: 16 },
  gridWrap: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  toolTile: {
    width: '48%',
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: '#F7F8FA',
    borderRadius: 12,
    padding: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: 64,
  },
  toolTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
});
