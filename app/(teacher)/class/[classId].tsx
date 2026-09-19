import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { AppHeader, Card, ListRow, Screen, SectionHeader, StatusPill } from '@/components/ui';
import { useTeacherClasses, useTeacherRoster } from '@/queries/useWits';

export default function ClassDetail() {
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const classes = useTeacherClasses();
  const roster = useTeacherRoster(classId ?? '');

  const cls = (classes.data ?? []).find((c) => c.id === classId);

  return (
    <Screen>
      <AppHeader
        title="Class Roster"
        subtitle={cls ? `${cls.name} · Room ${cls.room}` : 'Class'}
        onBack={() => router.back()}
      />
      <SectionHeader title="Students" />
      <Card>
        {(roster.data ?? []).map((s) => (
          <ListRow
            key={s.id}
            title={s.name}
            subtitle={`${s.absences} absence${s.absences === 1 ? '' : 's'}`}
            right={
              <StatusPill
                label={`${s.gradePercent}%`}
                tone={s.gradePercent >= 90 ? 'success' : s.gradePercent >= 80 ? 'warning' : 'danger'}
              />
            }
          />
        ))}
      </Card>
    </Screen>
  );
}
