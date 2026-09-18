import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BrandBand, WitsLogoHeader, SchoolBackdrop } from '@/components/brand';
import { EventDateTile, ScorePill, UnreadDot } from '@/components/patterns';
import {
  Card,
  EmptyState,
  ErrorState,
  ListRow,
  Screen,
  SectionHeader,
  StatusPill,
} from '@/components/ui';
import {
  IconBook,
  IconCalendar,
  IconChevronRight,
  IconDocText,
  IconFlask,
  IconMail,
  IconMega,
  IconStats,
} from '@/components/icons';

import { colors, radius, space } from '@/design/tokens';
import { useAssignments, useCalendar, useCourses, useMessages, useToday } from '@/queries/useWits';
import { useSession } from '@/state/appState';
import { dueLabel } from '@/utils/format';

const EAST_IMG = require('@/assets/branding/east.png');

export default function StudentToday() {
  const { selectedStudentId } = useSession();
  const today = useToday(selectedStudentId);
  const courses = useCourses(selectedStudentId);
  const assignments = useAssignments(selectedStudentId);
  const calendar = useCalendar(selectedStudentId);
  const messages = useMessages();

  if (today.isLoading) return <Screen><EmptyState title="Loading…" /></Screen>;
  if (today.isError) return <Screen><ErrorState message={String(today.error)} /></Screen>;

  const data = today.data!;
  const courseMap = new Map((courses.data ?? []).map((c) => [c.id, c]));
  const nowIdx = data.schedule.findIndex((b) => b.attended === 'upcoming');
  const currentBlock = nowIdx >= 0 ? data.schedule[nowIdx] : undefined;
  const currentCourse = currentBlock ? courseMap.get(currentBlock.courseId) : undefined;
  const nextBlock = nowIdx >= 0 ? data.schedule[nowIdx + 1] : undefined;
  const nextCourse = nextBlock ? courseMap.get(nextBlock.courseId) : undefined;
  const dueSoon = (assignments.data ?? []).filter((a) => a.status === 'upcoming').slice(0, 2);
  const recentGrades = (assignments.data ?? []).filter((a) => a.status === 'graded').slice(0, 2);
  const unread = (messages.data ?? []).filter((m) => m.unread).slice(0, 3);
  const upcomingEvents = (calendar.data ?? []).slice(0, 3);

  return (
    <Screen>
      <WitsLogoHeader initials="PG" unread={data.unreadMessagesCount} />

      {/* Hero: date + greeting over faded East High photo (top-right) */}
      <View style={styles.hero}>
        <SchoolBackdrop source={EAST_IMG} height={172} opacity={0.45} />
        <View style={styles.heroOverlay}>
          <View style={styles.heroDateRow}>
            <Text style={styles.heroDate}>{data.greetingDateLabel}</Text>
            <View style={styles.dayPill}>
              <Text style={styles.dayPillText}>{data.dayLabel}</Text>
            </View>
          </View>
          <Text style={styles.heroGreeting}>Good afternoon,{'\n'}Praket.</Text>
          <Text style={styles.heroMotto}>BELONG. ACHIEVE. MAKE A DIFFERENCE.</Text>
        </View>
      </View>

      {/* Next Class red card */}
      {currentCourse && currentBlock && (
        <View style={styles.nextClassCard}>
          <View style={styles.nextClassTopRow}>
            <Text style={styles.nextClassLabel}>Next Class</Text>
            <Text style={styles.nextClassLabel}>Period {currentBlock.period}</Text>
          </View>
          <View style={styles.nextClassBody}>
            <View style={styles.nextClassIconBox}>
              <IconFlask size={26} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nextClassName}>{currentCourse.name}</Text>
              <Text style={styles.nextClassMeta}>{currentCourse.teacher}</Text>
              <Text style={styles.nextClassMeta}>Room {currentCourse.room}</Text>
              <Text style={styles.nextClassTime}>{currentBlock.startTime} – {currentBlock.endTime} (34 min)</Text>
            </View>
            <View style={styles.nextClassChevron}>
              <IconChevronRight size={16} color="#FFFFFF" />
            </View>
          </View>
        </View>
      )}

      {/* Upcoming Class row */}
      {nextCourse && nextBlock && (
        <Card>
          <ListRow
            title={nextCourse.name}
            subtitle={`${nextCourse.teacher} • Room ${nextCourse.room}`}
            left={
              <View style={styles.upcomingIconBox}>
                <IconBook size={22} color={colors.brandRed} />
              </View>
            }
            right={
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.upcomingPeriod}>Period {nextBlock.period}</Text>
                <Text style={styles.upcomingTime}>{nextBlock.startTime}</Text>
              </View>
            }
            chevron
          />
          <Text style={styles.upcomingLabel}>Upcoming Class</Text>
        </Card>
      )}

      {/* Today at a Glance */}
      <Card>
        <SectionHeader
          title="Today at a Glance"
          icon={<IconDocText size={20} />}
        />
        <ListRow
          title="2"
          subtitle="Assignments Due"
          left={<IconDocText size={22} />}
          chevron
          onPress={() => router.push('/(student)/assignments')}
        />
        <ListRow
          title="2"
          subtitle="School Events"
          left={<IconCalendar size={22} />}
          chevron
          onPress={() => router.push('/(student)/(tabs)/calendar')}
        />
        <ListRow
          title="3"
          subtitle="Unread Messages"
          left={<IconMail size={22} />}
          chevron
          onPress={() => router.push('/(student)/(tabs)/messages')}
        />
      </Card>

      {/* Assignments Due Soon */}
      <SectionHeader
        title="Assignments Due Soon"
        icon={<IconStats size={20} />}
        actionLabel="See All"
        onAction={() => router.push('/(student)/assignments')}
      />
      {dueSoon.length === 0 ? (
        <EmptyState title="Nothing due soon" message="You're all caught up." />
      ) : (
        <Card>
          {dueSoon.map((a) => (
            <ListRow
              key={a.id}
              title={a.title}
              subtitle={a.courseName}
              left={<IconDocText size={22} color={colors.textSecondary} />}
              chevron
              onPress={() => router.push(`/(student)/assignment/${a.id}` as never)}
              right={
                a.id === dueSoon[0].id ? (
                  <StatusPill label="Due Tomorrow" tone="danger" />
                ) : (
                  <StatusPill label={dueLabel(a.dueDate)} tone="neutral" />
                )
              }
            />
          ))}
        </Card>
      )}

      {/* Recent Grades */}
      <SectionHeader
        title="Recent Grades"
        icon={<IconStats size={20} />}
        actionLabel="See All"
        onAction={() => router.push('/(student)/(tabs)/academics')}
      />
      <Card>
        {recentGrades.map((a) => (
          <ListRow
            key={a.id}
            title={a.title}
            subtitle={a.courseName}
            left={<IconDocText size={22} color={colors.textSecondary} />}
            chevron
            onPress={() => router.push(`/(student)/assignment/${a.id}` as never)}
            right={
              a.earnedPoints != null && a.points ? (
                <View style={{ alignItems: 'flex-end' }}>
                  <ScorePill percent={Math.round((a.earnedPoints / a.points) * 100)} />
                </View>
              ) : null
            }
          />
        ))}
      </Card>

      {/* Today's Schedule — timeline */}
      <SectionHeader
        title="Today's Schedule"
        icon={<IconCalendar size={20} />}
        actionLabel="See Full Schedule"
        onAction={() => router.push('/(student)/(tabs)/calendar')}
      />
      <Card>
        {data.schedule.map((b, i) => {
          const c = courseMap.get(b.courseId);
          if (!c) return null;
          const isNow = i === nowIdx;
          return (
            <View key={b.courseId} style={[styles.timelineRow, isNow && styles.timelineRowNow]}>
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineDot, isNow && styles.timelineDotNow]} />
                {i < data.schedule.length - 1 && <View style={styles.timelineLine} />}
              </View>
              <View style={styles.timelineTime}>
                <Text style={[styles.timelinePeriodLabel, isNow && { color: colors.brandRed }]}>
                  Period {b.period}
                </Text>
                <Text style={[styles.timelineTimeText, isNow && { color: colors.brandRed }]}>
                  {b.startTime} – {b.endTime}
                </Text>
              </View>
              <View style={styles.timelineBody}>
                <Text style={styles.timelineCourse}>{c.name}</Text>
                <Text style={styles.timelineMeta}>{c.teacher}</Text>
                <Text style={styles.timelineMeta}>Room {c.room}</Text>
              </View>
            </View>
          );
        })}
      </Card>

      {/* Upcoming Events */}
      <SectionHeader
        title="Upcoming Events"
        icon={<IconCalendar size={20} />}
        actionLabel="See All"
        onAction={() => router.push('/(student)/(tabs)/calendar')}
      />
      <Card>
        {upcomingEvents.map((e) => {
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
                  barColor={e.source === 'guidance' ? colors.brandGold : colors.brandRed}
                />
              }
              chevron
            />
          );
        })}
      </Card>

      {/* Messages */}
      <SectionHeader
        title="Messages"
        icon={<IconMail size={20} />}
        actionLabel="See All"
        onAction={() => router.push('/(student)/(tabs)/messages')}
      />
      <Card>
        {unread.length === 0 ? (
          <EmptyState title="No unread messages" />
        ) : (
          unread.map((t) => (
            <ListRow
              key={t.id}
              title={t.participants}
              subtitle={t.preview}
              chevron
              onPress={() => router.push(`/(student)/messages/${t.id}` as never)}
              right={
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Text style={styles.msgTime}>{t.timeLabel}</Text>
                  <UnreadDot />
                </View>
              }
            />
          ))
        )}
      </Card>

      {/* Important Announcements */}
      {data.announcements.map((an) => (
        <Card key={an.id}>
          <SectionHeader title="Important Announcements" icon={<IconMega size={20} />} actionLabel="See All" />
          <View style={styles.announcementRow}>
            <View style={styles.announcementBar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.announcementTitle}>{an.title}</Text>
              <Text style={styles.announcementBody}>{an.body}</Text>
            </View>
            <IconChevronRight size={16} />
          </View>
        </Card>
      ))}

      <BrandBand />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: radius.card, overflow: 'hidden', marginBottom: space.lg },
  heroOverlay: { padding: space.lg },
  heroDateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroDate: { fontSize: 14, color: colors.textSecondary },
  dayPill: { backgroundColor: colors.warningBg, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5 },
  dayPillText: { color: colors.warning, fontSize: 13, fontWeight: '700' },
  heroGreeting: { fontSize: 30, fontWeight: '700', color: colors.text, marginTop: space.md },
  heroMotto: { fontSize: 11, letterSpacing: 1, color: colors.textSecondary, marginTop: space.sm },
  nextClassCard: { backgroundColor: colors.brandRed, borderRadius: radius.card, padding: space.lg, marginBottom: space.md },
  nextClassTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: space.md },
  nextClassLabel: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', opacity: 0.9 },
  nextClassBody: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  nextClassIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.brandRedDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextClassName: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  nextClassMeta: { color: '#FFFFFF', fontSize: 13, opacity: 0.9, marginTop: 1 },
  nextClassTime: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', marginTop: space.xs },
  nextClassChevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brandRedDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginTop: space.sm },
  upcomingPeriod: { fontSize: 13, fontWeight: '600', color: colors.text },
  upcomingTime: { fontSize: 13, color: colors.textSecondary },
  msgTime: { fontSize: 12, color: colors.textSecondary },
  timelineRow: { flexDirection: 'row', minHeight: 56, borderRadius: radius.control, marginBottom: 2 },
  timelineRowNow: { backgroundColor: colors.dangerBg },
  timelineLeft: { width: 20, alignItems: 'center', paddingTop: 18 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#9AA2AE', marginTop: 4 },
  timelineDotNow: { backgroundColor: colors.brandRed },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#E2E5E9', marginTop: 2 },
  timelineTime: { width: 128, paddingTop: 14, paddingLeft: space.sm },
  timelinePeriodLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  timelineTimeText: { fontSize: 12, color: colors.textSecondary },
  timelineBody: { flex: 1, paddingTop: 14, paddingRight: space.sm, paddingBottom: 10 },
  timelineCourse: { fontSize: 15, fontWeight: '700', color: colors.text },
  timelineMeta: { fontSize: 12, color: colors.textSecondary },
  announcementRow: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  announcementBar: { width: 4, alignSelf: 'stretch', backgroundColor: colors.brandRed, borderRadius: 2 },
  announcementTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  announcementBody: { fontSize: 14, color: colors.textSecondary, marginTop: space.xs },
});
