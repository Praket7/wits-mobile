import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { WitsLogoHeader } from '@/components/brand';
import { Card, ErrorState, ListRow, Screen, SectionHeader, SegmentedControl } from '@/components/ui';
import { EventDateTile } from '@/components/patterns';
import { CheckSquare } from '@/components/gauges';
import {
  IconBell,
  IconChevronRight,
  IconCalendar,
  IconCheckbox,
  IconCheckboxBlue,
  IconCheckboxGold,
  IconCheckboxPurple,
  IconSquareGreen,
  IconSquareOrange,
  IconStats,
} from '@/components/icons';
import { colors, space } from '@/design/tokens';
import { friendlyError } from '@/utils/errors';
import { useBellSchedule, useCalendar, useCourses, useMonthlyAttendance, useReminders, useToday } from '@/queries/useWits';
import { useSelectedStudentId } from '@/state/appState';
import { formatEventTimeRange } from '@/utils/format';
import { now } from '@/utils/clock';
import { schoolDayInfo } from '@/utils/abDay';

const WEEKDAY_HEAD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Persisted calendar-filter state (item 28).
const CALENDAR_FILTER_KEY = 'wits.calendar-filters';

/** Deduplicate aggregated events (item 101): same normalized title + start + location. */
function dedupeEvents<T extends { id: string; title: string; start: string; location: string | null }>(events: T[]): T[] {
  const seen = new Set<string>();
  return events.filter((e) => {
    const key = `${e.title.toLowerCase().trim()}|${e.start}|${(e.location ?? '').toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Calendar filter sources: key maps to hiddenSources state; on/off icons render state.
const CALENDAR_SOURCES: {
  key: 'classes' | 'school' | 'clubs' | 'guidance' | 'athletics' | 'holidays';
  label: string;
  on: React.ComponentType<{ size?: number }>;
  off: React.ComponentType<{ size?: number }>;
}[] = [
  { key: 'classes', label: 'My Classes', on: IconCheckbox, off: IconSquareOrange },
  { key: 'school', label: 'School Events', on: IconCheckboxBlue, off: IconSquareOrange },
  { key: 'clubs', label: 'Clubs & Activities', on: IconCheckboxPurple, off: IconSquareOrange },
  { key: 'guidance', label: 'Guidance / College Visits', on: IconCheckboxGold, off: IconSquareOrange },
  { key: 'athletics', label: 'Athletics', on: IconSquareGreen, off: IconSquareOrange },
  { key: 'holidays', label: 'Holidays & Breaks', on: IconSquareOrange, off: IconSquareOrange },
];

const STATUS_COLORS: Record<string, string> = {
  present: colors.success,
  tardy: colors.brandGold,
  absent: colors.brandRed,
  'no-school': '#C9CFD6',
};

export default function CalendarScreen() {
  const selectedStudentId = useSelectedStudentId();
  const today = useToday(selectedStudentId);
  const courses = useCourses(selectedStudentId);
  const calendar = useCalendar(selectedStudentId);
  const bell = useBellSchedule();
  const nowDate = now();
  const monthly = useMonthlyAttendance({
    studentId: selectedStudentId,
    year: nowDate.getFullYear(),
    month: nowDate.getMonth() + 1,
  });
  const remindersQ = useReminders();
  const [view, setView] = useState('Agenda');
  const monthlyAttendance = monthly.data ?? {};
  const bellSchedule = bell.data ?? [];
  const reminders = remindersQ.data ?? [];
  const [hiddenSources, setHiddenSources] = useState<Record<string, boolean>>({});
  const [doneReminders, setDoneReminders] = useState<Record<string, boolean>>({});

  // Load + persist filter selection (item 28).
  useEffect(() => {
    AsyncStorage.getItem(CALENDAR_FILTER_KEY)
      .then((raw) => {
        if (raw) setHiddenSources(JSON.parse(raw) as Record<string, boolean>);
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    AsyncStorage.setItem(CALENDAR_FILTER_KEY, JSON.stringify(hiddenSources)).catch(() => {});
  }, [hiddenSources]);

  const toggleSource = (key: string) =>
    setHiddenSources((prev) => ({ ...prev, [key]: !prev[key] }));

  const setAllSources = (visible: boolean) => {
    const next: Record<string, boolean> = {};
    for (const s of CALENDAR_SOURCES) next[s.key] = !visible;
    setHiddenSources(next);
  };

  const visibleEvents = dedupeEvents(
    (calendar.data ?? []).filter((e) => {
      const src = e.source as string;
      if (hiddenSources.classes && (src === 'course' || src === 'district')) return false;
      if (hiddenSources.school && src === 'school') return false;
      if (hiddenSources.clubs && (src === 'club' || src === 'athletics')) return false;
      if (hiddenSources.guidance && src === 'guidance') return false;
      return true;
    }),
  );

  // Agenda grouping derives from the demo clock (§8.5) — no literal dates.
  const todayIso = nowDate.toISOString().slice(0, 10);
  const tomorrow = new Date(nowDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = tomorrow.toISOString().slice(0, 10);
  const eventsOn = (iso: string) =>
    visibleEvents.filter((e) => e.start.slice(0, 10) === iso);
  const todayEvents = eventsOn(todayIso);
  const tomorrowEvents = eventsOn(tomorrowIso);

  const courseMap = useMemo(() => new Map((courses.data ?? []).map((c) => [c.id, c])), [courses.data]);

  if (today.isError) return <Screen><ErrorState message={friendlyError(today.error).body} /></Screen>;
  const data = today.data;

  const cells: (number | null)[] = [
    ...Array.from({ length: nowDate.getDay() }, () => null),
    ...Array.from(
      { length: new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 0).getDate() },
      (_, i) => i + 1,
    ),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <Screen>
      <WitsLogoHeader onBellPress={() => router.push('/(student)/notifications' as never)}
        onAvatarPress={() => router.push('/(student)/(tabs)/more' as never)}/>
      <Text style={styles.screenTitle}>Calendar</Text>
      <Text style={styles.screenSub}>Your schedule. Your events. Your day.</Text>
      <SegmentedControl options={['Agenda', 'Month', 'Schedules']} value={view} onChange={setView} />

      {view === 'Agenda' && data && (
        <>
          <View style={styles.dayRow}>
            <Text style={styles.dayTitle}>{data.greetingDateLabel}</Text>
            <Text style={styles.dayBadge}>{data.dayLabel}</Text>
          </View>
          <View style={styles.rowStack}>
            {data.schedule.map((b) => {
              const c = courseMap.get(b.courseId);
              if (!c) return null;
              return (
                <ScheduleRow
                  key={b.courseId}
                  time={b.startTime}
                  color={c.color}
                  title={c.name}
                  subtitle={`Period ${b.period} • Room ${c.room}\n${c.teacher}`}
                />
              );
            })}
            {todayEvents.map((e) => (
              <ScheduleRow
                key={e.id}
                time={new Date(e.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                color={e.source === 'guidance' ? colors.brandGold : e.source === 'club' ? '#7B4DAA' : '#1A73E8'}
                title={e.title}
                subtitle={e.location ?? e.category}
                chevron
                onPress={() => router.push(`/(student)/event/${e.id}` as never)}
              />
            ))}
          </View>

          {tomorrowEvents.length > 0 && (
            <>
              <View style={styles.dayRow}>
                <Text style={styles.dayTitle}>
                  Tomorrow, {tomorrow.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </Text>
                <Text style={styles.dayBadge}>{schoolDayInfo(tomorrow).label}</Text>
              </View>
              <View style={styles.rowStack}>
                {tomorrowEvents.map((e) => (
                  <ScheduleRow
                    key={e.id}
                    time={new Date(e.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    color={e.source === 'guidance' ? colors.brandGold : e.source === 'club' ? '#7B4DAA' : '#1A73E8'}
                    title={e.title}
                    subtitle={e.location ?? e.category}
                    chevron
                    onPress={() => router.push(`/(student)/event/${e.id}` as never)}
                  />
                ))}
              </View>
            </>
          )}
        </>
      )}

      {view === 'Month' && (
        <Card>
          <View style={styles.monthRow}>
            <Text style={styles.monthTitle}>
              {nowDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
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
              const isToday = day === nowDate.getDate();
              const hasEvent = (calendar.data ?? []).some((e) => {
                const d = new Date(e.start);
                return d.getMonth() === nowDate.getMonth() && d.getDate() === day;
              });
              return (
                <View key={day} style={[styles.cell, isToday && styles.cellToday]}>
                  <Text style={[styles.cellText, isToday && styles.cellTextToday]}>{day}</Text>
                  {status ? (
                    <View style={[styles.dot, { backgroundColor: STATUS_COLORS[status] }]} />
                  ) : hasEvent ? (
                    <View style={[styles.dot, { backgroundColor: colors.brandRed, opacity: 0.5 }]} />
                  ) : (
                    <View style={styles.dotSpacer} />
                  )}
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
      )}

      {view === 'Schedules' && (
        <Card>
          <SectionHeader title="Bell Schedule" icon={<IconCalendar size={20} />} />
          {bellSchedule.map((b) => (
            <ListRow
              key={b.period}
              title={`Period ${b.period}`}
              subtitle={`${b.start} – ${b.end}`}
            />
          ))}
        </Card>
      )}

      <SectionHeader title="Upcoming Events" icon={<IconCalendar size={20} />} actionLabel="See All" />
      <Card>
        {visibleEvents.length === 0 ? (
          <Text style={styles.emptyEvents}>No events match your selected calendars.</Text>
        ) : (
          visibleEvents.map((e) => {
            const d = new Date(e.start);
            return (
              <ListRow
                key={e.id}
                title={e.title}
                subtitle={`${formatEventTimeRange(e.start, e.end)}\n${e.location ?? ''}`}
                left={
                  <EventDateTile
                    month={d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                    day={String(d.getDate())}
                    barColor={e.source === 'guidance' ? colors.brandGold : e.source === 'club' ? '#7B4DAA' : colors.brandRed}
                  />
                }
                chevron
                onPress={() => router.push(`/(student)/event/${e.id}` as never)}
              />
            );
          })
        )}
      </Card>

      <Card>
        <SectionHeader title="Calendars" icon={<IconStats size={20} />} />
        <View style={styles.selectAllRow}>
          <Pressable accessibilityRole="button" accessibilityLabel="Select all calendars" onPress={() => setAllSources(true)} hitSlop={6}>
            <Text style={styles.selectAllText}>Select All</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Clear all calendars" onPress={() => setAllSources(false)} hitSlop={6}>
            <Text style={styles.selectAllText}>Clear</Text>
          </Pressable>
        </View>
        {CALENDAR_SOURCES.map((s) => {
          const on = !hiddenSources[s.key];
          const CheckIcon = s.on;
          const OffIcon = s.off;
          return (
            <ListRow
              key={s.key}
              title={s.label}
              left={<Pressable onPress={() => toggleSource(s.key)} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={`Show ${s.label}`} hitSlop={8} style={styles.checkHit}> <CheckIcon size={20} /> </Pressable>}
              right={!on ? <OffIcon size={20} /> : null}
              onPress={() => toggleSource(s.key)}
              style={on ? undefined : styles.rowOff}
            />
          );
        })}
      </Card>

      <Card style={{ backgroundColor: colors.dangerBg }}>
        <View style={styles.remindersHeader}>
          <IconBell size={20} />
          <Text style={styles.remindersTitle}>{"Today's Reminders"}</Text>
          <View style={styles.reminderBadge}>
            <Text style={styles.reminderBadgeText}>{reminders.length}</Text>
          </View>
        </View>
        {reminders.map((r) => {
          const done = !!doneReminders[r.id];
          return (
            <Pressable
              key={r.id}
              onPress={() => setDoneReminders((prev) => ({ ...prev, [r.id]: !prev[r.id] }))}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: done }}
              accessibilityLabel={`Reminder: ${r.text}`}
              style={styles.reminderRow}
            >
              <CheckSquare color="#C9CFD6" checked={done} />
              <Text style={[styles.reminderText, done && styles.reminderDone]}>{r.text}</Text>
            </Pressable>
          );
        })}
      </Card>

      <Card>
        <SectionHeader title="Schedule Information" icon={<IconCheckbox size={20} />} />
        <ListRow
          title="View Bell Schedule"
          left={<IconCalendar size={22} />}
          chevron
          onPress={() => setView('Schedules')}
        />
        <ListRow
          title="Add to Personal Calendar"
          left={<IconCalendar size={22} />}
          chevron
          onPress={() =>
            Alert.alert('Add to Personal Calendar', 'Subscribing to district calendars arrives with the district integration.')
          }
        />
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

// One agenda row: bordered time box, colored period bar, title/meta. Matches
// the reference mockup: each row is its own card, bar sits left of the text.
function ScheduleRow({
  time,
  color,
  title,
  subtitle,
  onPress,
  chevron = false,
}: {
  time: string;
  color: string;
  title: string;
  subtitle: string;
  onPress?: () => void;
  chevron?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${title}, ${time}`}
      style={({ pressed }) => [styles.scheduleRow, pressed && { opacity: 0.7 }]}
    >
      <View style={styles.timeBox}>
        <Text style={styles.timeTextTop}>{time.split(' ')[0]}</Text>
        <Text style={styles.timeTextBottom}>{time.slice(-2)}</Text>
      </View>
      <View style={[styles.colorBar, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      {chevron ? <IconChevronRight size={18} color="#9AA2AE" /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screenTitle: { fontSize: 30, fontWeight: '700', color: colors.text, marginTop: space.sm },
  screenSub: { fontSize: 15, color: colors.textSecondary, marginTop: space.xs, marginBottom: space.md },
  dayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm, marginTop: space.xs },
  dayTitle: { fontSize: 17, fontWeight: '700', color: colors.text, flex: 1 },
  dayBadge: {
    backgroundColor: colors.warningBg,
    color: colors.warning,
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  timeBox: {
    width: 56,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    minHeight: 44,
  },
  rowStack: { gap: 10 },
  rowTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  rowSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
  timeTextTop: { fontSize: 14, fontWeight: '700', color: colors.text },
  timeTextBottom: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  colorBar: { width: 4, height: 40, borderRadius: 2 },
  monthRow: { marginBottom: space.md },
  monthTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
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
  checkHit: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginLeft: -6 },
  rowOff: { opacity: 0.45 },
  emptyEvents: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', paddingVertical: space.md },
  selectAllRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: space.lg, marginBottom: space.xs, minHeight: 44, alignItems: 'center' },
  selectAllText: { fontSize: 14, fontWeight: '600', color: colors.brandRed },
  reminderDone: { textDecorationLine: 'line-through', color: colors.textSecondary },
  remindersHeader: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.sm },
  remindersTitle: { fontSize: 17, fontWeight: '700', color: colors.text, flex: 1 },
  reminderBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.brandRed,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  reminderBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm, minHeight: 44 },
  reminderText: { fontSize: 15, color: colors.text, flex: 1 },
});
