import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WitsLogoHeader } from '@/components/brand';
import { Card, EmptyState, ListRow, Screen, SectionHeader, SegmentedControl, StatusPill } from '@/components/ui';
import { ScorePill } from '@/components/patterns';
import { IconCalendar, IconCheckCircle, IconClock, IconDocText } from '@/components/icons';
import { colors, space } from '@/design/tokens';
import { useAssignments } from '@/queries/useWits';
import { useSession } from '@/state/appState';
import { dueLabel } from '@/utils/format';

const VIEWS = ['All', 'Upcoming', 'Missing', 'Completed'] as const;
const CHIP_FILTERS = ['All Classes', 'Due Date', 'Type'] as const;

export default function StudentAssignments() {
  const { selectedStudentId } = useSession();
  const assignments = useAssignments(selectedStudentId);
  const [view, setView] = useState<(typeof VIEWS)[number]>('All');

  const data = assignments.data;
  const { all, tomorrow, nextWeek, noDue, completed, missing } = useMemo(() => {
    const list = data ?? [];
    return {
      all: list,
      tomorrow: list.filter((a) => a.status === 'upcoming' && a.dueDate === '2026-09-18'),
      nextWeek: list.filter(
        (a) => a.status === 'upcoming' && a.dueDate !== null && a.dueDate > '2026-09-18'
      ),
      noDue: list.filter((a) => a.status === 'no-due-date'),
      completed: list.filter((a) => a.status === 'graded'),
      missing: list.filter((a) => a.status === 'missing'),
    };
  }, [data]);

  const filtered = useMemo(() => {
    if (view === 'Upcoming') return [...tomorrow, ...nextWeek, ...noDue];
    if (view === 'Missing') return missing;
    if (view === 'Completed') return completed;
    return all;
  }, [view, all, tomorrow, nextWeek, noDue, missing, completed]);

  const showGroups = view === 'All';

  return (
    <Screen>
      <WitsLogoHeader initials="PG" />
      <Text style={styles.screenTitle}>Assignments</Text>
      <Text style={styles.screenSub}>Stay on top of your work.</Text>
      <SegmentedControl options={[...VIEWS]} value={view} onChange={(v) => setView(v as (typeof VIEWS)[number])} />

      <View style={styles.chipRow}>
        {CHIP_FILTERS.map((c) => (
          <View key={c} style={styles.chip}>
            <Text style={styles.chipText}>{c} ⌄</Text>
          </View>
        ))}
      </View>

      {filtered.length === 0 && <EmptyState title="No assignments" message="Nothing here right now." />}

      {showGroups && (
        <>
          {tomorrow.length > 0 && (
            <SectionHeader title="Due Tomorrow" icon={<IconCalendar size={20} />} actionLabel="1 item" />
          )}
          {tomorrow.map((a) => (
            <AssignmentRow key={a.id} id={a.id} title={a.title} subtitle={a.courseName} pill={<StatusPill label="Due Tomorrow" tone="danger" />} />
          ))}

          {nextWeek.length > 0 && (
            <SectionHeader title="Due Next Week" icon={<IconCalendar size={20} />} actionLabel={`${nextWeek.length} items`} />
          )}
          {nextWeek.map((a) => (
            <AssignmentRow
              key={a.id}
              id={a.id}
              title={a.title}
              subtitle={a.courseName}
              pill={<StatusPill label={dueLabel(a.dueDate).replace('Due ', '')} tone="neutral" />}
            />
          ))}

          {noDue.length > 0 && (
            <SectionHeader title="No Due Date" icon={<IconClock size={20} />} actionLabel={`${noDue.length} item`} />
          )}
          {noDue.map((a) => (
            <AssignmentRow
              key={a.id}
              id={a.id}
              title={a.title}
              subtitle={a.courseName}
              pill={<StatusPill label="No Due Date" tone="neutral" />}
            />
          ))}

          {missing.length > 0 && (
            <SectionHeader title="Missing" icon={<IconClock size={20} />} actionLabel={`${missing.length} item`} />
          )}
          {missing.map((a) => (
            <AssignmentRow
              key={a.id}
              id={a.id}
              title={a.title}
              subtitle={a.courseName}
              pill={<StatusPill label="Missing" tone="danger" />}
            />
          ))}

          {completed.length > 0 && (
            <SectionHeader title="Completed" icon={<IconCheckCircle size={20} />} actionLabel={`${completed.length} items`} />
          )}
          {completed.map((a) => (
            <AssignmentRow
              key={a.id}
              id={a.id}
              title={a.title}
              subtitle={a.courseName}
              left={<IconCheckCircle size={22} />}
              pill={
                a.earnedPoints != null && a.points ? (
                  <ScorePill percent={Math.round((a.earnedPoints / a.points) * 100)} />
                ) : null
              }
            />
          ))}

          <Card style={{ backgroundColor: colors.warningBg }}>
            <View style={styles.caughtUpRow}>
              <Text style={{ fontSize: 24 }}>💡</Text>
              <View style={{ flex: 1, marginLeft: space.md }}>
                <Text style={styles.caughtUpTitle}>{"You're all caught up!"}</Text>
                <Text style={styles.caughtUpBody}>Keep up the great work.</Text>
              </View>
            </View>
          </Card>
        </>
      )}

      {!showGroups && filtered.length > 0 && (
        <Card>
          {filtered.map((a) => (
            <AssignmentRow
              key={a.id}
              id={a.id}
              title={a.title}
              subtitle={a.courseName}
              pill={
                a.status === 'graded' && a.earnedPoints != null && a.points ? (
                  <ScorePill percent={Math.round((a.earnedPoints / a.points) * 100)} />
                ) : a.status === 'missing' ? (
                  <StatusPill label="Missing" tone="danger" />
                ) : (
                  <StatusPill label={dueLabel(a.dueDate)} tone="neutral" />
                )
              }
            />
          ))}
        </Card>
      )}
    </Screen>
  );
}

function AssignmentRow({
  id,
  title,
  subtitle,
  pill,
  left,
}: {
  id: string;
  title: string;
  subtitle: string;
  pill?: React.ReactNode;
  left?: React.ReactNode;
}) {
  return (
    <Card>
      <ListRow
        title={title}
        subtitle={subtitle}
        left={left ?? <IconDocText size={22} color={colors.textSecondary} />}
        chevron
        onPress={() => router.push(`/(student)/assignment/${id}` as never)}
        right={pill}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  screenTitle: { fontSize: 30, fontWeight: '700', color: colors.text, marginTop: space.sm },
  screenSub: { fontSize: 15, color: colors.textSecondary, marginTop: space.xs, marginBottom: space.md },
  chipRow: { flexDirection: 'row', gap: space.sm, marginBottom: space.md },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.text },
  caughtUpRow: { flexDirection: 'row', alignItems: 'center' },
  caughtUpTitle: { fontSize: 16, fontWeight: '700', color: colors.warning },
  caughtUpBody: { fontSize: 13, color: colors.warning, marginTop: 2 },
});
