import { router } from 'expo-router';
import React from 'react';
import { Linking } from 'react-native';
import { AppHeader, Card, ListRow, Screen, SectionHeader } from '@/components/ui';
import { IconCompass, IconBook, IconPeople, IconClipboard, IconDocText, IconGlobe, IconGradCap, IconStats } from '@/components/icons';
import { colors } from '@/design/tokens';
import { useResources } from '@/queries/useWits';

const ICONS: Record<string, React.ReactNode> = {
  classroom: <IconGradCap size={22} />,
  school: <IconStats size={22} color="#1A73E8" />,
  compass: <IconCompass size={22} color="#1A73E8" />,
  book: <IconBook size={22} />,
  people: <IconPeople size={22} />,
  clipboard: <IconClipboard size={22} color={colors.brandGold} />,
  mail: <IconDocText size={22} />,
  globe: <IconGlobe size={22} color={colors.textSecondary} />,
};

export default function Resources() {
  const resources = useResources();
  return (
    <Screen>
      <AppHeader title="Resources" subtitle="District tools and links" onBack={() => router.back()} />
      <SectionHeader title="Academic Tools" />
      <Card>
        {(resources.data ?? []).map((r) => (
          <ListRow
            key={r.id}
            title={r.title}
            subtitle={r.subtitle}
            left={ICONS[r.icon] ?? <IconDocText size={22} />}
            chevron
            onPress={() => Linking.openURL(r.url)}
          />
        ))}
      </Card>
    </Screen>
  );
}
