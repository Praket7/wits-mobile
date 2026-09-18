import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, space } from '@/design/tokens';
import { IconBell, IconBellFilled } from './icons';

export function BrandBand() {
  return (
    <View style={styles.band} accessibilityElementsHidden>
      <Text style={styles.bandText}>BELONG. ACHIEVE. MAKE A DIFFERENCE.</Text>
    </View>
  );
}

export function WitsLogoHeader({ initials, unread }: { initials: string; unread?: number }) {
  return (
    <View style={styles.logoRow}>
      <View style={styles.logoMark}>
        <Text style={styles.logoW}>W</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.district}>WILLIAMSVILLE</Text>
        <Text style={styles.districtSub}>CENTRAL SCHOOL DISTRICT</Text>
      </View>
      <View style={styles.bellWrap} accessibilityLabel={`${unread ?? 0} unread notifications`}>
        <IconBell size={24} color={colors.text} />
        {unread ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unread}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
    </View>
  );
}

// Kept for the mockup's filled-bell variant used on sub-screens.
export function WitsSubHeader({ initials, unread = 3 }: { initials: string; unread?: number }) {
  return (
    <View style={styles.logoRow}>
      <View style={styles.logoMark}>
        <Text style={styles.logoW}>W</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.district}>WILLIAMSVILLE</Text>
        <Text style={styles.districtSub}>CENTRAL SCHOOL DISTRICT</Text>
      </View>
      <View style={styles.bellWrap} accessibilityLabel={`${unread} unread notifications`}>
        <IconBellFilled size={24} color={colors.text} />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unread}</Text>
        </View>
      </View>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    backgroundColor: colors.bandBg,
    borderRadius: radius.card,
    paddingVertical: space.lg,
    alignItems: 'center',
    marginBottom: space.xl,
  },
  bandText: { color: colors.brandGold, fontWeight: '700', fontSize: 13, letterSpacing: 1.5 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.md },
  logoMark: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.brandRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoW: { color: '#FFFFFF', fontSize: 24, fontWeight: '800' },
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
