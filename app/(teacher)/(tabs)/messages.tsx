import React from 'react';
import { Text } from 'react-native';
import { WitsLogoHeader } from '@/components/BrandBand';
import { Card, ListRow, Screen } from '@/components/ui';
import { useMessages } from '@/queries/useWits';

export default function TeacherMessages() {
  const messages = useMessages();
  return (
    <Screen>
      <WitsLogoHeader initials="MB" />
      <Text style={{ fontSize: 30, fontWeight: '700', marginTop: 8, marginBottom: 16 }}>Messages</Text>
      <Card>
        {(messages.data ?? []).map((t) => (
          <ListRow key={t.id} title={t.participants} subtitle={t.subject} right={t.unread ? <Text style={{ color: '#C8102E', fontWeight: '700' }}>●</Text> : null} />
        ))}
      </Card>
    </Screen>
  );
}
