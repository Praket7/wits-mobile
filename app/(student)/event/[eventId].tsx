import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader, Card, EmptyState, ErrorState, ListRow, Screen, SectionHeader, StatusPill } from '@/components/ui';
import { IconBell, IconCalendar, IconGlobe, IconPerson, IconPin } from '@/components/icons';
import { colors, space } from '@/design/tokens';
import { useEvent } from '@/queries/useWits';
import { friendlyError } from '@/utils/errors';
import { formatEventTimeRange, formatIsoDateLabel } from '@/utils/format';
import { openExternalUrl } from '@/utils/openUrl';

/**
 * Event detail (plan item 27 / §8.5): a real screen replacing Alert.alert.
 * Shows full provenance — Source · <origin> — plus the guidance-visit fields
 * (registration, eligible grades) from item 20, and a demo personal reminder.
 */
export default function EventDetail() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const event = useEvent(eventId ?? '');
  const [reminder, setReminder] = useState<string | null>(null);

  if (event.isLoading) {
    return (
      <Screen>
        <AppHeader title="Event" onBack={() => router.back()} />
        <Card>
          <Text style={styles.loading}>Loading…</Text>
        </Card>
      </Screen>
    );
  }
  if (event.isError) {
    return (
      <Screen>
        <AppHeader title="Event" onBack={() => router.back()} />
        <ErrorState message={friendlyError(event.error).body} />
      </Screen>
    );
  }
  const e = event.data;
  if (!e) {
    return (
      <Screen>
        <AppHeader title="Event" onBack={() => router.back()} />
        <EmptyState title="Event not found" message="This event may have been removed from the calendar." />
      </Screen>
    );
  }

  const isGuidanceVisit = e.source === 'guidance';
  const barColor = isGuidanceVisit ? colors.brandGold : e.source === 'club' ? '#7B4DAA' : colors.brandRed;

  return (
    <Screen>
      <AppHeader title={e.category} onBack={() => router.back()} />

      <Card>
        <View style={styles.titleRow}>
          <View style={[styles.dateBar, { backgroundColor: barColor }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{e.title}</Text>
            <Text style={styles.when}>
              {formatIsoDateLabel(e.start)}
              {e.allDay ? ' · All day' : ` · ${formatEventTimeRange(e.start, e.end)}`}
            </Text>
          </View>
        </View>
        {e.location ? (
          <View style={styles.metaRow}>
            <IconPin size={18} />
            <Text style={styles.metaText}>{e.location}</Text>
          </View>
        ) : null}
        <View style={styles.metaRow}>
          <IconPerson size={18} />
          <Text style={styles.metaText}>Audience · {e.audience}</Text>
        </View>
      </Card>

      <SectionHeader title="Details" icon={<IconCalendar size={20} />} />
      <Card>
        <Text style={styles.description}>
          {e.description || 'No additional details were provided for this event.'}
        </Text>
        {isGuidanceVisit && (
          <View style={styles.visitNote}>
            <StatusPill label="Guidance / College Visit" tone="warning" />
          </View>
        )}
      </Card>

      <SectionHeader title="Source" icon={<IconGlobe size={20} />} />
      <Card>
        <ListRow title={`Source · ${e.sourceLabel}`} subtitle={`Category · ${e.category}`} />
        {e.registrationUrl ? (
          <ListRow
            title="Register online"
            subtitle={e.registrationUrl.replace(/^https:\/\//, '')}
            left={<IconGlobe size={22} color={colors.brandRed} />}
            right={<Text style={styles.external}>↗</Text>}
            chevron
            onPress={() => openExternalUrl(e.registrationUrl as string).catch(() => {})}
          />
        ) : null}
      </Card>

      <SectionHeader title="My Reminder" icon={<IconBell size={20} />} />
      <Card>
        {reminder ? (
          <ListRow
            title={`Reminder set · ${reminder}`}
            subtitle="Personal to this device (demo)"
            onPress={() => setReminder(null)}
            right={<Text style={styles.removeReminder}>Remove</Text>}
          />
        ) : (
          <View style={styles.reminderRow}>
            {['10 min before', '1 hour before', '1 day before'].map((opt) => (
              <Pressable
                key={opt}
                accessibilityRole="button"
                accessibilityLabel={`Remind me ${opt}`}
                onPress={() => setReminder(opt)}
                style={({ pressed }) => [styles.reminderChip, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.reminderChipText}>{opt}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row' },
  dateBar: { width: 4, borderRadius: 2, marginRight: space.md },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  when: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: space.sm },
  metaText: { fontSize: 14, color: colors.textSecondary, marginLeft: space.sm },
  description: { fontSize: 15, color: colors.text, lineHeight: 22 },
  visitNote: { marginTop: space.md },
  external: { color: colors.brandRed, fontSize: 16, fontWeight: '700' },
  reminderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  reminderChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  reminderChipText: { fontSize: 13, fontWeight: '600', color: colors.text },
  removeReminder: { color: colors.brandRed, fontSize: 14, fontWeight: '600' },
  loading: { color: colors.textSecondary, fontSize: 15, textAlign: 'center', paddingVertical: space.md },
});
