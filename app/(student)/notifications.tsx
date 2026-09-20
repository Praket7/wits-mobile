import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { AppHeader, Card, Screen, SectionHeader } from '@/components/ui';
import { IconBell } from '@/components/icons';
import { colors, space } from '@/design/tokens';
import { useNotificationPrefs } from '@/queries/useWits';
import type { NotificationPrefs } from '@/domain/schemas';

/** Only the boolean toggles are master-switchable. */
type BooleanPrefKey = {
  [K in keyof NotificationPrefs]: NotificationPrefs[K] extends boolean ? K : never;
}[keyof NotificationPrefs];

/**
 * Notification Preferences (item 21): the complete control surface lives here
 * only (item 22 — More links to this screen). Every category is an
 * independent toggle backed by its own persisted state (P0.10), the master
 * switch flips all categories at once, and digest / quiet hours / lock-screen
 * privacy are real state (P0.11) — no no-op rows.
 */
export default function Notifications() {
  const { prefs, update, ready } = useNotificationPrefs();

  const categories: { key: BooleanPrefKey; label: string; subtitle: string }[] = [
    { key: 'grades', label: 'Grades', subtitle: 'New posted grades' },
    { key: 'attendance', label: 'Attendance', subtitle: 'Absences and tardies' },
    { key: 'assignments', label: 'Assignments', subtitle: 'Due dates and missing work' },
    { key: 'messages', label: 'Messages', subtitle: 'WITSMail and teacher messages' },
    { key: 'schoolAnnouncements', label: 'School Announcements', subtitle: 'District and school news' },
    { key: 'clubsActivities', label: 'Clubs & Activities', subtitle: 'Meetings and events' },
    { key: 'guidance', label: 'Guidance / College Visits', subtitle: 'Visits and deadlines' },
    { key: 'athletics', label: 'Athletics', subtitle: 'Games and schedule changes' },
    { key: 'calendarEvents', label: 'Calendar Events', subtitle: 'General school calendar' },
    { key: 'transportation', label: 'Transportation', subtitle: 'Bus updates and delays' },
  ];

  return (
    <Screen>
      <AppHeader title="Notification Preferences" subtitle="Choose what you're alerted about" onBack={() => router.back()} />

      <SectionHeader title="Push Notifications" icon={<IconBell size={20} />} />
      <Card>
        <PrefRow
          label="All Notifications"
          subtitle="Master switch for every category below"
          value={ready && prefs ? prefs.masterEnabled : false}
          onChange={(v) => {
            if (!ready || !prefs) return;
            const next: Partial<NotificationPrefs> = { masterEnabled: v };
            for (const c of categories) next[c.key] = v;
            update(next);
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
                value={prefs[c.key] as boolean}
                onChange={(v) => update({ [c.key]: v })}
              />
            ))}
            <LockedRow label="Emergency Alerts" subtitle="Always delivered — cannot be disabled" />
          </>
        )}
      </Card>

      <SectionHeader title="Delivery" />
      <Card>
        {ready && prefs && (
          <>
            <PrefRow
              label="Daily Digest"
              subtitle="One summary instead of instant alerts"
              value={prefs.digestMode}
              onChange={(v) => update({ digestMode: v })}
            />
            <PrefRow
              label="Quiet Hours"
              subtitle={`Silence alerts ${prefs.quietHoursStart} – ${prefs.quietHoursEnd}`}
              value={prefs.quietHoursEnabled}
              onChange={(v) => update({ quietHoursEnabled: v })}
            />
            {prefs.quietHoursEnabled && (
              <Text style={styles.quietNote}>
                Quiet hours are active. Time customization arrives with the district build.
              </Text>
            )}
            <PrefRow
              label="Hide Details on Lock Screen"
              subtitle="Show “You have a new grade” only — never grade details"
              value={prefs.lockScreenPrivacy}
              onChange={(v) => update({ lockScreenPrivacy: v })}
            />
          </>
        )}
      </Card>

      <Text style={styles.note}>
        Prototype only: preferences persist on-device. Push delivery arrives with the district integration.
        Lock-screen privacy is on by default so grade details never appear in previews (item 152).
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
  quietNote: { fontSize: 12, color: colors.textSecondary, paddingVertical: space.sm },
  note: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: space.lg },
});
