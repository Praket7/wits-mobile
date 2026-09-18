import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { WitsLogoHeader } from '@/components/brand';
import { Card, ListRow, Screen, SectionHeader } from '@/components/ui';
import { EventDateTile } from '@/components/patterns';
import { IconCalendar } from '@/components/icons';
import { colors, space } from '@/design/tokens';
import { useCalendar } from '@/queries/useWits';
import { useSession } from '@/state/appState';
import { formatEventTimeRange } from '@/utils/format';

export default function ParentCalendar() {
  const { selectedStudentId } = useSession();
  const calendar = useCalendar(selectedStudentId);
  return (
    <Screen>
      <WitsLogoHeader initials="PG" />
      <Text style={styles.screenTitle}>Calendar</Text>
      <SectionHeader title="Upcoming Events" icon={<IconCalendar size={20} />} />
      <Card>
        {(calendar.data ?? []).map((e) => {
          const d = new Date(e.start);
          return (
            <ListRow
              key={e.id}
              title={e.title}
              subtitle={`${formatEventTimeRange(e.start, e.end)}\n${e.location ?? ''}`}
              left={
                <EventDateTile
                  month={d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                  day={String(d.getDate())}
                  barColor={e.source === 'athletics' ? colors.brandGold : colors.brandRed}
                />
              }
            />
          );
        })}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenTitle: { fontSize: 30, fontWeight: '700', color: colors.text, marginTop: space.sm, marginBottom: space.md },
});
