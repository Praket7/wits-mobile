import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { AppHeader, Card, Screen, SectionHeader } from '@/components/ui';
import { IconBell } from '@/components/icons';
import { colors, space } from '@/design/tokens';
import { useNotificationPrefs } from '@/queries/useWits';
import type { NotificationPrefs } from '@/domain/schemas';
import { features } from '@/config/features';

/**
 * Notification Preferences (item 21): the complete control surface lives here
 * only (item 22 — More links to this screen). Master toggle, per-category
 * switches, quiet hours, and lock-screen privacy. Emergency alerts are always
 * on. Digest mode appears only when the feature flag enables it.
 */
export default function Notifications() {
  const { prefs, update, ready } = useNotificationPrefs();

  const categories: { key: keyof NotificationPrefs; label: string; subtitle: string }[] = [
    { key: 'grades', label: 'Grades', subtitle: 'New posted grades' },
    { key: 'attendance', label: 'Attendance', subtitle: 'Absences and tardies' },
    { key: 'assignments', label: 'Assignments', subtitle: 'Due dates and missing work' },
    { key: 'messages', label: 'Messages', subtitle: 'WITSMail and teacher messages' },
    { key: 'events', label: 'Calendar', subtitle: 'School events and reminders' },
  ];

  const masterOn = ready && prefs ? Object.values(prefs).some(Boolean) : false;

  return (
    <Screen>
      <AppHeader title="Notification Preferences" subtitle="Choose what you're alerted about" onBack={() => router.back()} />

      <SectionHeader title="Push Notifications" icon={<IconBell size={20} />} />
      <Card>
        <PrefRow
          label="All Notifications"
          subtitle="Master switch for every category below"
          value={masterOn}
          onChange={(v) => {
            if (!ready || !prefs) return;
            update({
              grades: v,
              attendance: v,
              assignments: v,
              messages: v,
              events: v,
            });
          }}
        />
      </Card>

      <SectionHeader title="Categories" />
      <Card>
        {ready && prefs && (
          <>
            {categories.map((c) => (
              <PrefRow
                key={c.key}
                label={c.label}
                subtitle={c.subtitle}
                value={prefs[c.key]}
                onChange={(v) => update({ [c.key]: v })}
              />
            ))}
            <PrefRow label="School Announcements" subtitle="District and school news" value={prefs.events} onChange={(v) => update({ events: v })} />
            <PrefRow label="Clubs & Activities" subtitle="Meetings and events" value={prefs.events} onChange={(v) => update({ events: v })} />
            <PrefRow label="Guidance / College Visits" subtitle="Visits and deadlines" value={prefs.events} onChange={(v) => update({ events: v })} />
            <PrefRow label="Athletics" subtitle="Games and schedule changes" value={prefs.events} onChange={(v) => update({ events: v })} />
          </>
        )}
        <LockedRow label="Emergency Alerts" subtitle="Always delivered — cannot be disabled" />
      </Card>

      {features.notificationDigest && (
        <>
          <SectionHeader title="Delivery" />
          <Card>
            <PrefRow label="Daily Digest" subtitle="One summary instead of instant alerts" value={false} onChange={() => {}} />
            <PrefRow label="Quiet Hours" subtitle="Silence alerts 9:00 PM – 6:30 AM" value={true} onChange={() => {}} />
            <PrefRow label="Hide Details on Lock Screen" subtitle="Show 'You have a new grade' only" value={true} onChange={() => {}} />
          </Card>
        </>
      )}

      <Text style={styles.note}>
        Prototype only: preferences persist on-device. Push delivery arrives with the district integration.
        Push previews never show grade details by default (item 152).
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

function LockedRow({ label, subtitle }: { label: string; subtitle: string }) {
  return (
    <View style={[styles.prefRow, { opacity: 0.7 }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.prefLabel}>{label}</Text>
        <Text style={styles.prefSub}>{subtitle}</Text>
      </View>
      <Switch value={true} disabled accessibilityLabel={`${label} — always on`} trackColor={{ false: '#E2E5E9', true: colors.danger }} />
    </View>
  );
}

const styles = StyleSheet.create({
  prefRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: space.sm, minHeight: 52, gap: space.md },
  prefLabel: { fontSize: 16, fontWeight: '600', color: colors.text },
  prefSub: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  note: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: space.lg },
});
