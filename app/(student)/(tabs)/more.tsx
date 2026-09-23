import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { WitsLogoHeader } from '@/components/brand';
import { Card, ListRow, Screen, SectionHeader, SegmentedControl } from '@/components/ui';
import { IconBell, IconCalendar, IconClipboard, IconGradCap, IconSearch } from '@/components/icons';
import { colors, space } from '@/design/tokens';
import { useSession } from '@/state/appState';
import { repository } from '@/data/mockRepository';
import { asDemoControls } from '@/data/repository';
import { SCENARIOS, selectedScenario, setSelectedScenario } from '@/data/demo/scenarios';
import type { Role } from '@/domain/schemas';

export default function More() {
  const { signOut, role, setRole } = useSession();
  const queryClient = useQueryClient();
  const [currentScenario, setCurrentScenario] = useState(selectedScenario());

  return (
    <Screen>
      <WitsLogoHeader onBellPress={() => router.push('/(student)/notifications' as never)}
        onAvatarPress={() => router.push('/(student)/(tabs)/more' as never)}/>
      <Text style={styles.screenTitle}>More</Text>

      <SectionHeader title="School Life" icon={<IconGradCap size={20} />} />
      <Card>
        <ListRow title="Guidance & Counseling" subtitle="Events, testing, workshops" left={<IconGradCap size={22} />} chevron onPress={() => router.push('/(student)/guidance' as never)} />
        <ListRow title="Universal Search" subtitle="Find classes, people, resources, events" left={<IconSearch size={22} />} chevron onPress={() => router.push('/(student)/search' as never)} />
        <ListRow title="Attendance" subtitle="Rates, history, by class" left={<IconCalendar size={22} />} chevron onPress={() => router.push('/(student)/attendance' as never)} />
        <ListRow title="Resources" subtitle="District tools and links" left={<IconClipboard size={22} />} chevron onPress={() => router.push('/(student)/resources' as never)} />
        <ListRow title="Notification Preferences" subtitle="Choose what you're alerted about" left={<IconBell size={22} />} chevron onPress={() => router.push('/(student)/notifications' as never)} />
      </Card>

      {/* Item 22: More keeps only the navigation row — full controls live on
          the dedicated Notification Preferences screen. */}

      {/* Dev-only role switcher (plan item 4): hidden in preview/release builds. */}
      {__DEV__ && (
        <>
          <SectionHeader title="Prototype Role (dev)" />
          <Card>
            <Text style={styles.roleNote}>Production derives role from SSO. This switch is prototype-only.</Text>
            <View style={{ marginTop: space.md }}>
              <SegmentedControl options={['student', 'parent', 'teacher']} value={role} onChange={(v) => setRole(v as Role)} />
            </View>
          </Card>

          {/* Dev-only demo scenario switcher (plan §6.3): applies instantly via
              resetDemo + query invalidation. Mock repository only. */}
          <SectionHeader title="Demo Scenario (dev)" />
          <Card>
            <Text style={styles.roleNote}>Deterministic demo datasets (§6.3). Applies immediately.</Text>
            <View style={{ marginTop: space.md }}>
              {SCENARIOS.map((s) => (
                <ListRow
                  key={s.id}
                  title={s.label}
                  subtitle={s.description}
                  right={currentScenario === s.id ? <Text style={styles.scenarioActive}>Active</Text> : null}
                  onPress={async () => {
                    await setSelectedScenario(s.id);
                    setCurrentScenario(s.id);
                    const demo = asDemoControls(repository);
                    if (demo) await demo.resetDemo();
                    queryClient.invalidateQueries();
                  }}
                />
              ))}
            </View>
          </Card>
        </>
      )}

      <Card>
        <ListRow title="Sign Out" onPress={signOut} right={<Text style={styles.signOut}>Sign Out</Text>} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenTitle: { fontSize: 30, fontWeight: '700', color: colors.text, marginTop: space.sm, marginBottom: space.md },
  prefRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: space.sm, minHeight: 44 },
  prefLabel: { fontSize: 16, color: colors.text },
  scenarioActive: { color: colors.brandRed, fontWeight: '700', fontSize: 13 },
  roleNote: { fontSize: 13, color: colors.textSecondary },
  signOut: { color: colors.danger, fontWeight: '600' },
});
