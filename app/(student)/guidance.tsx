import { router } from 'expo-router';
import React from 'react';
import { Linking } from 'react-native';
import { AppHeader, Card, EmptyState, ListRow, Screen, SectionHeader } from '@/components/ui';
import { useGuidance } from '@/queries/useWits';
import { useSelectedStudentId } from '@/state/appState';
import { formatIsoDateShort } from '@/utils/format';

export default function Guidance() {
  const selectedStudentId = useSelectedStudentId();
  const guidance = useGuidance(selectedStudentId);

  return (
    <Screen>
      <AppHeader title="Guidance & Counseling" subtitle="Your future starts here." onBack={() => router.back()} />
      <SectionHeader title="Upcoming Guidance Events" />
      <Card>
        {(guidance.data ?? []).length === 0 ? (
          <EmptyState title="No upcoming guidance events" />
        ) : (
          (guidance.data ?? []).map((g) => (
            <ListRow
              key={g.id}
              title={g.title}
              subtitle={`${formatIsoDateShort(g.date)} • ${g.location ?? ''}\n${g.description}`}
              chevron
              onPress={() => router.push('/(student)/(tabs)/calendar' as never)}
            />
          ))
        )}
      </Card>
      <SectionHeader title="Guidance Resources" />
      <Card>
        <ListRow title="Naviance" subtitle="College & career planning" chevron onPress={() => Linking.openURL('https://student.naviance.com').catch(() => {})} />
        <ListRow title="PSAT/SAT Information" subtitle="Testing dates and registration" chevron onPress={() => Linking.openURL('https://satsuite.collegeboard.org').catch(() => {})} />
        <ListRow title="Transcript Requests" subtitle="Request official transcripts" chevron onPress={() => Linking.openURL('https://www.parchment.com').catch(() => {})} />
        <ListRow title="Meet Your Counselor" subtitle="Counselor assignments and contact" chevron onPress={() => router.push('/(parent)/(tabs)/messages' as never)} />
      </Card>
    </Screen>
  );
}
