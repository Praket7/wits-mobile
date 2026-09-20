import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WitsLogoHeader } from '@/components/brand';
import { Card, EmptyState, ListRow, Screen, SectionHeader } from '@/components/ui';
import { ThreadAvatar, UnreadDot } from '@/components/patterns';
import { IconMail } from '@/components/icons';
import { colors, space } from '@/design/tokens';
import { useMessages, useCourses } from '@/queries/useWits';
import { useSelectedStudentId, useSession } from '@/state/appState';

/**
 * Parent WITSMail: the mailbox of the currently selected child (plan item 14).
 * Class-targeted announcements addressed to that child's classes appear here
 * as real unread threads; read state is per viewer, so reading as the parent
 * never clears the student's own badge.
 */
export default function ParentMessages() {
  const messages = useMessages();
  const courses = useCourses(useSelectedStudentId());
  const { userId } = useSession();
  const threads = messages.data ?? [];

  const displayParticipants = (t: (typeof threads)[number]) => {
    if (t.category === 'Classes' && t.courseIds.length > 0) {
      const c = (courses.data ?? []).find((cc) => cc.id === t.courseIds[0]);
      if (c) return c.name;
    }
    return t.participants;
  };

  return (
    <Screen>
      <WitsLogoHeader onBellPress={() => router.push('/(parent)/(tabs)/more' as never)}
        onAvatarPress={() => router.push('/(parent)/(tabs)/more' as never)} />
      <Text style={styles.screenTitle}>Messages</Text>
      <SectionHeader title="Inbox" icon={<IconMail size={20} />} />
      {threads.length === 0 ? (
        <EmptyState title="No messages" message="The selected child's mailbox is empty." />
      ) : (
        <Card>
          {threads.map((t) => (
            <ListRow
              key={t.id}
              title={displayParticipants(t)}
              subtitle={`${t.subject}\n${t.preview}`}
              left={
                <ThreadAvatar
                  kind="initials"
                  label={displayParticipants(t).split(' ').map((w) => w[0]).slice(0, 2).join('')}
                />
              }
              right={
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Text style={styles.timeLabel}>{t.timeLabel}</Text>
                  {t.unread && <UnreadDot />}
                </View>
              }
              chevron
              onPress={() => router.push({ pathname: '/(parent)/messages/[threadId]', params: { threadId: t.id, viewerId: userId } } as never)}
            />
          ))}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenTitle: { fontSize: 30, fontWeight: '700', color: colors.text, marginTop: space.sm, marginBottom: space.md },
  timeLabel: { fontSize: 12, color: colors.textSecondary },
});
