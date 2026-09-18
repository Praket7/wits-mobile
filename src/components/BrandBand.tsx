import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '@/design/tokens';
import { WMarkImage } from './brand';

// Full district lockup: W mark + WILLIAMSVILLE / CENTRAL SCHOOL DISTRICT.
// Bell and avatar are real buttons (plan item 10): ≥44×44 targets, labelled,
// and wired to notification preferences / More.
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
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Notifications, ${unread ?? 0} unread`}
      hitSlop={8}
      style={({ pressed }) => [styles.bellWrap, pressed && { opacity: 0.6 }]}
    >
      <Ionicons name="notifications-outline" size={24} color={colors.text} />
      {unread ? (
        <View style={styles.badge} pointerEvents="none">
          <Text style={styles.badgeText}>{unread}</Text>
        </View>
      ) : null}
    </Pressable>
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
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Account, signed in as ${initials}`}
      hitSlop={8}
      style={({ pressed }) => [styles.avatar, pressed && { opacity: 0.6 }]}
    >
      <Text style={styles.avatarText}>{initials}</Text>
    </Pressable>
  );
}

// Faded school photo anchored top-right (flush under the header row), with a
// left→right gradient: page-colored on the left → visible at the right edge.
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
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, right: 0, width: '72%', height, opacity }}>
      <Image source={source} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <LinearGradient
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        colors={['rgba(247,248,250,0.72)', 'rgba(247,248,250,0.35)', 'rgba(247,248,250,0)']}
        locations={[0, 0.35, 1]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  markWrap: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  district: { color: colors.brandRed, fontWeight: '800', fontSize: 17, letterSpacing: 0.5 },
  districtSub: { color: colors.text, fontWeight: '600', fontSize: 9, letterSpacing: 1 },
  bellWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 3,
    right: 3,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF0F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.text, fontSize: 13, fontWeight: '700' },
});
