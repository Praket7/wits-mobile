import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/design/tokens';
import { DistrictLockup } from './BrandBand';

// The district's authentic W mark. The supplied source PNG has a black
// background baked in; w-mark-trans.png is the chroma-keyed version so the
// mark composites cleanly on any surface (headers, white cards, hero band).
export function WMarkImage({ size = 40 }: { size?: number }) {
  return (
    <Image
      source={require('@/assets/branding/w-mark-trans.png')}
      style={{ width: size, height: size * 0.63, resizeMode: 'contain' }}
      accessibilityIgnoresInvertColors
    />
  );
}

// Wrapper keeping the historical call-site signature `initials`.
export function WitsLogoHeader({
  initials,
  unread,
  onBellPress,
  onAvatarPress,
}: {
  initials: string;
  unread?: number;
  onBellPress?: () => void;
  onAvatarPress?: () => void;
}) {
  return (
    <DistrictLockup
      avatarInitials={initials}
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

export { WMarkSvg, SchoolBackdrop } from './BrandBand';

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
