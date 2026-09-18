import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { BrandBand, WitsLogoHeader } from '@/components/brand';
import { Card, ListRow, Screen, SectionHeader, StatusPill } from '@/components/ui';
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
import { useTeacherClasses, useUnreadCount } from '@/queries/useWits';
import { useSession } from '@/state/appState';
import { formatDateLong } from '@/utils/format';
import { now } from '@/utils/clock';
import { classifySchedule, blockMinutes } from '@/utils/schedule';
import { schoolDayInfo } from '@/utils/abDay';

// Teacher bell times mirror the student bell schedule (mock, item 76).
const TEACHER_BLOCKS = [
  { period: 1, startTime: '8:05 AM', endTime: '8:47 AM', label: 'Hall Duty' },
  { period: 3, startTime: '10:05 AM', endTime: '10:47 AM', label: 'AP Chemistry – Period 3' },
  { period: 5, startTime: '12:18 PM', endTime: '1:00 PM', label: 'Forensic Science – Period 5' },
  { period: 7, startTime: '1:05 PM', endTime: '1:47 PM', label: 'AP Chemistry – Period 7' },
];

export default function TeacherToday() {
  const classes = useTeacherClasses();
  const unread = useUnreadCount();
  const { userId } = useSession();

  // Derived day/phase context (items 16, 77–78) — no hard-coded date strings.
  const todayDate = now();
  const dayInfo = schoolDayInfo(todayDate);
  const currentMinutes = todayDate.getHours() * 60 + todayDate.getMinutes();
  const phase = classifySchedule(TEACHER_BLOCKS, currentMinutes);

  const phaseLabel = (() => {
    switch (phase.kind) {
      case 'before-school':
        return phase.nextBlock ? `School starts at ${phase.nextBlock.startTime}` : 'Before school';
      case 'passing-period':
        return `Passing period — next class in ${phase.minutesUntil} min`;
      case 'in-class': {
        const mins = blockMinutes(phase.currentBlock.startTime, phase.currentBlock.endTime);
        return `In class${mins ? ` · ${mins} min period` : ''}`;
      }
      case 'day-finished':
        return 'School day finished';
    }
  })();

  const totalStudents = (classes.data ?? []).reduce((sum, c) => sum + c.studentCount, 0);

  return (
    <Screen>
      <WitsLogoHeader
        initials="MB"
        unread={unread}
        onBellPress={() => router.push('/(teacher)/(tabs)/more' as never)}
        onAvatarPress={() => router.push('/(teacher)/(tabs)/more' as never)}
      />
      <Text style={styles.title}>Good morning, {userId === 'tea-bernard' ? 'Mr. Bernard' : 'Teacher'}.</Text>
      <Text style={styles.subtitle}>
        {formatDateLong(todayDate)} · {dayInfo.label}
      </Text>
      <Text style={styles.phase}>{phaseLabel}</Text>

      <SectionHeader title="Today's Classes" icon={<IconCalendar size={20} />} />
      <Card>
        {TEACHER_BLOCKS.map((b) => {
          const cls = (classes.data ?? []).find((c) => c.name.startsWith(b.label.split(' – ')[0]));
          const isNow = phase.kind === 'in-class' && phase.currentBlock === b;
          return (
            <ListRow
              key={`${b.period}-${b.label}`}
              title={b.label}
              subtitle={`${b.startTime} – ${b.endTime}${cls ? ` • Room ${cls.room}` : ''}${
                cls ? ` • ${cls.studentCount} students` : ''
              }`}
              left={<IconPin size={22} />}
              chevron={!!cls}
              onPress={cls ? () => router.push(`/(teacher)/class/${cls.id}` as never) : undefined}
              right={isNow ? <StatusPill label="Now" tone="brand" /> : undefined}
            />
          );
        })}
        <ListRow
          title="Planning / Free Periods"
          subtitle="Periods 2, 4, 6 — grading and prep time"
          left={<IconClipboard size={22} />}
        />
      </Card>

      <SectionHeader title="Action Items" icon={<IconClipboard size={20} />} />
      <Card>
        {(classes.data ?? []).map((c) => (
          <ListRow
            key={c.id}
            title={c.nextAction}
            subtitle={c.name}
            left={<IconDocText size={22} />}
            right={<StatusPill label={String(c.studentCount > 24 ? '12' : '4')} tone="brand" />}
            chevron
            onPress={() => router.push(`/(teacher)/class/${c.id}` as never)}
          />
        ))}
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
          subtitle="Students by class"
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
  title: { fontSize: 30, fontWeight: '700', marginTop: space.sm },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: 4 },
  phase: { fontSize: 13, fontWeight: '600', color: colors.brandRed, marginBottom: space.lg },
});
