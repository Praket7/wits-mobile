import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { WitsLogoHeader } from '@/components/brand';
import { Card, EmptyState, ListRow, Screen, SectionHeader } from '@/components/ui';
import { ThreadAvatar } from '@/components/patterns';
import { IconMail } from '@/components/icons';
import { colors, space } from '@/design/tokens';
import { useMessages, useTeacherClasses } from '@/queries/useWits';

/**
 * Teacher WITSMail (item 33): a teacher's mailbox is their sent log — every
 * announcement they authored, one row per class it was sent to, with the
 * recipient class shown. Compose opens the multi-class checklist.
 */
export default function TeacherMessages() {
  const messages = useMessages();
  const classes = useTeacherClasses();
  const threads = messages.data ?? [];

  const recipientLabel = (courseIds: string[]) => {
    const names = courseIds
      .map((id) => classes.data?.find((c) => c.id === id)?.name)
      .filter((n): n is string => !!n);
    return names.length > 0 ? names.join(', ') : 'All classes';
  };

  return (
    <Screen>
      <WitsLogoHeader onBellPress={() => router.push('/(teacher)/(tabs)/more' as never)}
        onAvatarPress={() => router.push('/(teacher)/(tabs)/more' as never)} />
      <Text style={styles.screenTitle}>Messages</Text>
      <Text style={styles.screenSub}>{"Announcements you've sent to your classes."}</Text>

      <SectionHeader
        title="Sent"
        icon={<IconMail size={20} />}
        actionLabel="New Message"
        onAction={() => router.push('/(teacher)/compose' as never)}
      />
      {threads.length === 0 ? (
        <EmptyState title="No announcements yet" message="Send your first class announcement." />
      ) : (
        <Card>
          {threads.map((t) => (
            <ListRow
              key={t.id}
              title={t.subject}
              subtitle={`${recipientLabel(t.courseIds)}\n${t.preview}`}
              left={<ThreadAvatar kind="book" label={t.participants.split(' ').map((w) => w[0]).slice(0, 2).join('')} />}
              right={<Text style={styles.timeLabel}>{t.timeLabel}</Text>}
              chevron
              onPress={() => router.push(`/(teacher)/messages/${t.id}` as never)}
            />
          ))}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenTitle: { fontSize: 30, fontWeight: '700', color: colors.text, marginTop: space.sm },
  screenSub: { fontSize: 15, color: colors.textSecondary, marginTop: space.xs, marginBottom: space.md },
  timeLabel: { fontSize: 12, color: colors.textSecondary },
});
