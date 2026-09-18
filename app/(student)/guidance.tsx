import { router } from 'expo-router';
import React from 'react';
import { AppHeader, Card, EmptyState, ListRow, Screen, SectionHeader } from '@/components/ui';
import { useGuidance } from '@/queries/useWits';
import { useSession } from '@/state/appState';
import { formatIsoDateShort } from '@/utils/format';

export default function Guidance() {
  const { selectedStudentId } = useSession();
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
            />
          ))
        )}
      </Card>
      <SectionHeader title="Guidance Resources" />
      <Card>
        <ListRow title="Naviance" subtitle="College & career planning" chevron />
        <ListRow title="PSAT/SAT Information" subtitle="Testing dates and registration" chevron />
        <ListRow title="Transcript Requests" subtitle="Request official transcripts" chevron />
        <ListRow title="Meet Your Counselor" subtitle="Counselor assignments and contact" chevron />
      </Card>
    </Screen>
  );
}
