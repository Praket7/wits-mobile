import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { AppHeader, Card, ListRow, Screen, SectionHeader, StatusPill } from '@/components/ui';
import { teacherRoster } from '@/data/fixtures/data';

export default function ClassDetail() {
  const { classId } = useLocalSearchParams<{ classId: string }>();
  return (
    <Screen>
      <AppHeader title="Class Roster" subtitle={String(classId)} onBack={() => router.back()} />
      <SectionHeader title="Students" />
      <Card>
        {teacherRoster.map((s) => (
          <ListRow
            key={s.id}
            title={s.name}
            subtitle={`${s.absences} absence${s.absences === 1 ? '' : 's'}`}
            right={<StatusPill label={`${s.gradePercent}%`} tone={s.gradePercent >= 90 ? 'success' : s.gradePercent >= 80 ? 'warning' : 'danger'} />}
          />
        ))}
      </Card>
    </Screen>
  );
}
