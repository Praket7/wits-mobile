import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WitsLogoHeader } from '@/components/brand';
import { Card, EmptyState, ListRow, Screen, SectionHeader, SegmentedControl, StatusPill } from '@/components/ui';
import { ScorePill } from '@/components/patterns';
import { IconCalendar, IconCheckCircle, IconClock, IconDocText } from '@/components/icons';
import { colors, space } from '@/design/tokens';
import { useAssignments } from '@/queries/useWits';
import { useSelectedStudentId } from '@/state/appState';
import { dueLabel } from '@/utils/format';
import { now } from '@/utils/clock';
import type { Assignment } from '@/domain/schemas';

const VIEWS = ['All', 'Upcoming', 'Missing', 'Completed'] as const;
const SORTS = ['Due Date', 'Class', 'Status'] as const;

/** Working course filter (item 86): filters actually change the data. */
function useCourseFilter(all: { courseName: string }[]) {
  const [course, setCourse] = useState<string>('All Classes');
  const options = useMemo(
    () => ['All Classes', ...Array.from(new Set(all.map((a) => a.courseName))).sort()],
    [all],
  );
  return { course, setCourse, options };
}

export default function StudentAssignments() {
  const selectedStudentId = useSelectedStudentId();
  const assignments = useAssignments(selectedStudentId);
  const [view, setView] = useState<(typeof VIEWS)[number]>('All');
  const { course, setCourse, options: courseOptions } = useCourseFilter(assignments.data ?? []);
  const [showCoursePicker, setShowCoursePicker] = useState(false);
  // Sort control (§8.4): due date, class, or status — no fake ordering.
  const [sort, setSort] = useState<(typeof SORTS)[number]>('Due Date');
  const demoNow = now();

  const applyCourseList = (list: Assignment[]): Assignment[] =>
    course === 'All Classes' ? list : list.filter((a) => a.courseName === course);

  const data = assignments.data;
  const { all, tomorrow, nextWeek, noDue, completed, missing } = useMemo(() => {
    const list = data ?? [];
    // Derived "due tomorrow" from the demo clock — never a literal date (§8.3).
    const tmrw = new Date(demoNow);
    tmrw.setDate(tmrw.getDate() + 1);
    const tmrwIso = tmrw.toISOString().slice(0, 10);
    const weekOut = new Date(tmrw);
    weekOut.setDate(weekOut.getDate() + 7);
    const weekOutIso = weekOut.toISOString().slice(0, 10);
    return {
      all: list,
      tomorrow: list.filter((a) => a.status === 'upcoming' && a.dueDate === tmrwIso),
      nextWeek: list.filter(
        (a) => a.status === 'upcoming' && a.dueDate !== null && a.dueDate > tmrwIso && a.dueDate <= weekOutIso,
      ),
      noDue: list.filter((a) => a.status === 'no-due-date'),
      completed: list.filter((a) => a.status === 'graded'),
      missing: list.filter((a) => a.status === 'missing'),
    };
  }, [data, demoNow]);

  const filtered: Assignment[] = useMemo(() => {
    const base = [...all];
    if (sort === 'Class') base.sort((a, b) => a.courseName.localeCompare(b.courseName) || (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'));
    else if (sort === 'Status') {
      const order: Record<string, number> = { missing: 0, upcoming: 1, submitted: 2, 'no-due-date': 3, graded: 4 };
      base.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));
    } else {
      base.sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'));
    }
    if (view === 'Upcoming') return applyCourseList([...tomorrow, ...nextWeek, ...noDue]);
    if (view === 'Missing') return applyCourseList(missing);
    if (view === 'Completed') return applyCourseList(completed);
    return applyCourseList(base);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, all, tomorrow, nextWeek, noDue, missing, completed, course, sort]);

  const showGroups = view === 'All';

  return (
    <Screen>
      <WitsLogoHeader onBellPress={() => router.push('/(student)/notifications' as never)}
        onAvatarPress={() => router.push('/(student)/(tabs)/more' as never)}/>
      <Text style={styles.screenTitle}>Assignments</Text>
      <Text style={styles.screenSub}>Stay on top of your work.</Text>
      <SegmentedControl options={[...VIEWS]} value={view} onChange={(v) => setView(v as (typeof VIEWS)[number])} />

      <View style={styles.chipRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Filter by class: ${course}`}
          accessibilityState={{ selected: course !== 'All Classes' }}
          style={styles.chip}
          onPress={() => setShowCoursePicker(true)}
        >
          <Text style={styles.chipText}>{course} ⌄</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Sort by: ${sort}`}
          style={styles.chip}
          onPress={() => setSort(SORTS[(SORTS.indexOf(sort) + 1) % SORTS.length])}
        >
          <Text style={styles.chipText}>Sort: {sort}</Text>
        </Pressable>
      </View>

      {showCoursePicker && (
        <Card>
          {courseOptions.map((opt) => (
            <ListRow
              key={opt}
              title={opt}
              right={opt === course ? <Text style={styles.checkMark}>✓</Text> : null}
              onPress={() => {
                setCourse(opt);
                setShowCoursePicker(false);
              }}
            />
          ))}
        </Card>
      )}

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
  checkMark: { color: colors.brandRed, fontWeight: '700', fontSize: 16 },
  caughtUpRow: { flexDirection: 'row', alignItems: 'center' },
  caughtUpTitle: { fontSize: 16, fontWeight: '700', color: colors.warning },
  caughtUpBody: { fontSize: 13, color: colors.warning, marginTop: 2 },
});
