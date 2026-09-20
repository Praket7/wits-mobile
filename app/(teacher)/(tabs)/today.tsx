import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { BrandBand, WitsLogoHeader } from '@/components/brand';
import { Card, EmptyState, ErrorState, ListRow, Screen, SectionHeader, StatusPill } from '@/components/ui';
import {
  IconBell,
  IconCalendar,
  IconClipboard,
  IconDocText,
  IconMail,
  IconPeople,
  IconPin,
  IconStats,
} from '@/components/icons';
import { colors, space } from '@/design/tokens';
import { useTeacherClasses, useTeacherToday, useUnreadCount } from '@/queries/useWits';

/**
 * Teacher Today (P0.12, §10.1): renders the repository-composed
 * TeacherTodayPayload only — no screen-local bell blocks, identity, or fake
 * action counts. Phase line and unread badge derive from live queries.
 */
export default function TeacherToday() {
  const today = useTeacherToday();
  const classes = useTeacherClasses();
  const unread = useUnreadCount();

  if (today.isLoading) return <Screen><EmptyState title="Loading…" /></Screen>;
  if (today.isError || !today.data) {
    return <Screen><ErrorState message={String(today.error ?? 'Unavailable')} onRetry={() => today.refetch()} /></Screen>;
  }

  const t = today.data;
  const totalStudents = (classes.data ?? []).reduce((sum, c) => sum + c.studentCount, 0);
  const phaseLabel = (() => {
    if (t.currentBlock) return `Now: ${t.currentBlock.label} (${t.currentBlock.time})`;
    if (t.nextBlock) return `Next: ${t.nextBlock.label} at ${t.nextBlock.time}`;
    return 'School day finished';
  })();

  return (
    <Screen>
      <WitsLogoHeader

        unread={unread}
        onBellPress={() => router.push('/(teacher)/(tabs)/more' as never)}
        onAvatarPress={() => router.push('/(teacher)/(tabs)/more' as never)}
      />
      <Text style={styles.title}>Good morning, {t.teacherName}.</Text>
      <Text style={styles.subtitle}>
        {t.dateLabel} · {t.dayLabel}
      </Text>
      <Text style={styles.phase}>{phaseLabel}</Text>

      <SectionHeader title="Today's Classes" icon={<IconCalendar size={20} />} />
      <Card>
        {t.blocks.map((b) => {
          const cls = b.classId ? (classes.data ?? []).find((c) => c.id === b.classId) : undefined;
          const isNow = t.currentBlock && b.period === t.currentBlock.period && b.kind === 'class';
          return (
            <ListRow
              key={`${b.period}-${b.label}`}
              title={b.kind === 'class' ? b.label : `${b.label} (Period ${b.period})`}
              subtitle={
                b.kind === 'planning'
                  ? `${b.time} — grading and prep time`
                  : `${b.time}${cls ? ` • Room ${cls.room} • ${cls.studentCount} students` : ''}`
              }
              left={<IconPin size={22} />}
              chevron={!!cls}
              onPress={cls ? () => router.push(`/(teacher)/class/${cls.id}` as never) : undefined}
              right={isNow ? <StatusPill label="Now" tone="brand" /> : undefined}
            />
          );
        })}
      </Card>

      <SectionHeader title="Action Items" icon={<IconClipboard size={20} />} />
      <Card>
        {t.actions.map((a) => (
          <ListRow
            key={a.id}
            title={a.label}
            subtitle={a.context ?? undefined}
            left={<IconDocText size={22} />}
            right={a.count != null ? <StatusPill label={String(a.count)} tone="brand" /> : undefined}
            chevron
            onPress={() =>
              a.kind === 'message'
                ? router.push('/(teacher)/(tabs)/messages' as never)
                : router.push('/(teacher)/(tabs)/classes' as never)
            }
          />
        ))}
        {t.actions.length === 0 && <Text style={styles.allCaught}>{"You're all caught up."}</Text>}
      </Card>

      <SectionHeader title="Quick Actions" icon={<IconStats size={20} />} />
      <Card>
        <ListRow
          title="Message a Class"
          subtitle="Send an announcement to students or families"
          left={<IconBell size={22} />}
          chevron
          onPress={() => router.push('/(teacher)/compose' as never)}
        />
        <ListRow
          title="View Rosters"
          subtitle={`${t.totalStudents} students across your sections`}
          left={<IconPeople size={22} />}
          chevron
          onPress={() => router.push('/(teacher)/(tabs)/students' as never)}
        />
        <ListRow
          title="My Classes"
          subtitle={`${(classes.data ?? []).length} sections · ${totalStudents} students`}
          left={<IconCalendar size={22} />}
          chevron
          onPress={() => router.push('/(teacher)/(tabs)/classes' as never)}
        />
        <ListRow
          title="Post Announcement"
          subtitle="Share news with your sections"
          left={<IconMail size={22} />}
          chevron
          onPress={() => router.push('/(teacher)/compose' as never)}
        />
      </Card>

      {unread > 0 && (
        <Card>
          <ListRow
            title="Unread Messages"
            subtitle={`${unread} message${unread === 1 ? '' : 's'} need${unread === 1 ? 's' : ''} attention`}
            left={<IconMail size={22} />}
            chevron
            onPress={() => router.push('/(teacher)/(tabs)/messages' as never)}
            right={<StatusPill label={String(unread)} tone="brand" />}
          />
        </Card>
      )}

      <BrandBand />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '700', color: colors.text, marginTop: space.sm },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: 4 },
  phase: { fontSize: 13, fontWeight: '600', color: colors.brandRed, marginBottom: space.lg },
  allCaught: { fontSize: 14, color: colors.textSecondary, paddingVertical: space.md },
});
