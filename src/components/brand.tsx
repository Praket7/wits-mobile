import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/design/tokens';
import { useMe } from '@/queries/useWits';
import { useSession } from '@/state/appState';
import { DistrictLockup } from './BrandBand';

/**
 * Header initials come from the signed-in identity (plan item 6) — no screen
 * hard-codes them. Renders empty until /me resolves (one tick on first load).
 */
function useHeaderInitials(): string {
  const { role } = useSession();
  const me = useMe(role);
  return me.data?.initials ?? '';
}

// The district's authentic W mark, straight from the supplied white-background
// file — no chroma-key artifacts. Use on light surfaces (headers, cards, login).
// variant="transparent" uses the keyed version for dark surfaces (brand band).
export function WMarkImage({ size = 40, variant = 'white' }: { size?: number; variant?: 'white' | 'transparent' }) {
  return (
    <Image
      source={
        variant === 'white'
          ? require('@/assets/branding/w-mark-white.png')
          : require('@/assets/branding/w-mark-trans.png')
      }
      style={{ width: size, height: size * 0.622, resizeMode: 'contain' }}
      accessibilityIgnoresInvertColors
    />
  );
}

// Wrapper keeping the historical call-site signature. The avatar initials
// derive from the signed-in identity (plan item 6); bell opens notification
// preferences, avatar opens More (plan item 10).
export function WitsLogoHeader({
  initials,
  unread,
  onBellPress,
  onAvatarPress,
}: {
  initials?: string;
  unread?: number;
  onBellPress?: () => void;
  onAvatarPress?: () => void;
}) {
  const derived = useHeaderInitials();
  return (
    <DistrictLockup
      avatarInitials={initials ?? derived}
      unread={unread}
      onBellPress={onBellPress}
      onAvatarPress={onAvatarPress}
    />
  );
}

export function WitsSubHeader({
  initials,
  unread = 3,
}: {
  initials?: string;
  unread?: number;
}) {
  return <DistrictLockup avatarInitials={initials ?? 'PG'} unread={unread} />;
}

export { SchoolBackdrop } from './BrandBand';

export function BrandBand() {
  return (
    <View style={styles.band} accessibilityElementsHidden>
      <Text style={styles.bandText}>BELONG. ACHIEVE. MAKE A DIFFERENCE.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    backgroundColor: colors.bandBg,
    borderRadius: radius.card,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  bandText: { color: colors.brandGold, fontWeight: '700', fontSize: 13, letterSpacing: 1.5 },
});
