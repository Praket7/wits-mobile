import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Polygon } from 'react-native-svg';
import { colors } from '@/design/tokens';
import { WMarkImage } from './brand';

// Varsity-style block W: red fill with gold outline, matching the district mark.
// Recreated as SVG so it composites on white headers (the supplied PNG has a
// black background baked in).
export function WMarkSvg({ size = 40 }: { size?: number }) {
  const w = size;
  const h = size * 0.84;
  return (
    <Svg width={w} height={h} viewBox="0 0 100 84">
      {/* gold outline layer */}
      <Polygon
        points="6,4 30,4 40,30 50,10 60,30 70,4 94,4 78,80 56,80 50,58 44,80 22,80"
        fill={colors.brandGold}
      />
      {/* red fill layer (inset) */}
      <Polygon
        points="12,9 27,9 43,44 50,22 57,44 73,9 88,9 75,75 59,75 50,42 41,75 25,75"
        fill={colors.brandRed}
      />
    </Svg>
  );
}

// Full district lockup: W mark + WILLIAMSVILLE / CENTRAL SCHOOL DISTRICT.
export function DistrictLockup({
  markSize = 40,
  unread,
  onBellPress,
  onAvatarPress,
  avatarInitials = 'PG',
}: {
  markSize?: number;
  unread?: number;
  onBellPress?: () => void;
  onAvatarPress?: () => void;
  avatarInitials?: string;
}) {
  return (
    <View style={styles.logoRow}>
      <View style={styles.markWrap}>
        <WMarkImage size={markSize} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.district}>WILLIAMSVILLE</Text>
        <Text style={styles.districtSub}>CENTRAL SCHOOL DISTRICT</Text>
      </View>
      <BellBadge unread={unread} onPress={onBellPress} />
      <Avatar initials={avatarInitials} onPress={onAvatarPress} />
    </View>
  );
}

export function BellBadge({
  unread,
  onPress,
}: {
  unread?: number;
  onPress?: () => void;
}) {
  return (
    <View style={styles.bellWrap} accessibilityLabel={`${unread ?? 0} unread notifications`}>
      <Ionicons name="notifications-outline" size={24} color={colors.text} />
      {unread ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unread}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function Avatar({
  initials,
  onPress,
}: {
  initials: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

// Faded school photo, anchored top-right, used behind Today / Course / Login heroes.
export function SchoolBackdrop({
  source,
  height = 150,
  opacity = 0.35,
}: {
  source: number;
  height?: number;
  opacity?: number;
}) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image
        source={source}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '70%',
          height,
          resizeMode: 'cover',
          opacity,
          borderTopRightRadius: 16,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  markWrap: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  district: { color: colors.brandRed, fontWeight: '800', fontSize: 17, letterSpacing: 0.5 },
  districtSub: { color: colors.text, fontWeight: '600', fontSize: 9, letterSpacing: 1 },
  bellWrap: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.brandRed,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF0F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.text, fontSize: 13, fontWeight: '700' },
});
