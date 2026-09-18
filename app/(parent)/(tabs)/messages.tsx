import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WitsLogoHeader } from '@/components/brand';
import { Card, ListRow, Screen, SectionHeader } from '@/components/ui';
import { ThreadAvatar, UnreadDot } from '@/components/patterns';
import { IconMail } from '@/components/icons';
import { colors, space } from '@/design/tokens';
import { useMessages } from '@/queries/useWits';

export default function ParentMessages() {
  const messages = useMessages();
  return (
    <Screen>
      <WitsLogoHeader initials="PG" />
      <Text style={styles.screenTitle}>Messages</Text>
      <SectionHeader title="Inbox" icon={<IconMail size={20} />} />
      <Card>
        {(messages.data ?? []).map((t) => (
          <ListRow
            key={t.id}
            title={t.participants}
            subtitle={`${t.subject}\n${t.preview}`}
            left={<ThreadAvatar kind="initials" label={t.participants.split(' ').map((w) => w[0]).slice(0, 2).join('')} />}
            right={
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Text style={styles.timeLabel}>{t.timeLabel}</Text>
                {t.unread && <UnreadDot />}
              </View>
            }
          />
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenTitle: { fontSize: 30, fontWeight: '700', color: colors.text, marginTop: space.sm, marginBottom: space.md },
  timeLabel: { fontSize: 12, color: colors.textSecondary },
});
