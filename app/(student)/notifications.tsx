import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { AppHeader, Card, Screen, SectionHeader } from '@/components/ui';
import { IconBell } from '@/components/icons';
import { colors, space } from '@/design/tokens';
import { useNotificationPrefs } from '@/queries/useWits';

export default function Notifications() {
  const { prefs, update, ready } = useNotificationPrefs();

  return (
    <Screen>
      <AppHeader title="Notification Preferences" subtitle="Choose what you're alerted about" onBack={() => router.back()} />
      <SectionHeader title="Alerts" icon={<IconBell size={20} />} />
      <Card>
        {ready && prefs && (
          <>
            <PrefRow label="Grades" subtitle="New posted grades" value={prefs.grades} onChange={(v) => update({ grades: v })} />
            <PrefRow label="Attendance" subtitle="Absences and tardies" value={prefs.attendance} onChange={(v) => update({ attendance: v })} />
            <PrefRow label="Assignments" subtitle="Due dates and missing work" value={prefs.assignments} onChange={(v) => update({ assignments: v })} />
            <PrefRow label="Messages" subtitle="WITSMail and teacher messages" value={prefs.messages} onChange={(v) => update({ messages: v })} />
            <PrefRow label="School Events" subtitle="Calendar events and reminders" value={prefs.events} onChange={(v) => update({ events: v })} />
          </>
        )}
      </Card>
      <Text style={styles.note}>
        Prototype only: preferences persist on-device. Push delivery arrives with the district integration.
      </Text>
    </Screen>
  );
}

function PrefRow({
  label,
  subtitle,
  value,
  onChange,
}: {
  label: string;
  subtitle: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.prefRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.prefLabel}>{label}</Text>
        <Text style={styles.prefSub}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={`${label} notifications`}
        trackColor={{ false: '#E2E5E9', true: colors.brandRed }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  prefRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: space.sm, minHeight: 52, gap: space.md },
  prefLabel: { fontSize: 16, fontWeight: '600', color: colors.text },
  prefSub: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  note: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: space.lg },
});
