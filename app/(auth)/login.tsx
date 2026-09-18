import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SchoolBackdrop, WMarkSvg } from '@/components/brand';
import { Screen } from '@/components/ui';
import { IconGradCap } from '@/components/icons';
import { colors, radius, space } from '@/design/tokens';
import { useSession } from '@/state/appState';

const EAST_IMG = require('@/assets/branding/east.png');

export default function Login() {
  const { signIn } = useSession();
  return (
    <Screen>
      <View style={{ paddingTop: space.xxl }}>
        <View style={styles.logoRow}>
          <View style={styles.logoMark}>
            <WMarkSvg size={38} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.district}>WILLIAMSVILLE</Text>
            <Text style={styles.districtSub}>CENTRAL SCHOOL DISTRICT</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <SchoolBackdrop source={EAST_IMG} height={140} opacity={0.35} />
          <View style={styles.heroOverlay}>
            <Text style={styles.title}>WITS Mobile</Text>
            <Text style={styles.subtitle}>Belong. Achieve. Make a difference.</Text>
          </View>
        </View>

        <Text style={styles.heading}>Welcome</Text>
        <Text style={styles.body}>
          Sign in with your Williamsville Central School District account to see classes,
          assignments, attendance, and messages in one place.
        </Text>

        <Pressable
          onPress={signIn}
          accessibilityRole="button"
          accessibilityLabel="Sign in with District Account"
          style={styles.button}
        >
          <IconGradCap size={22} color="#FFFFFF" />
          <Text style={styles.buttonText}>Sign in with District Account</Text>
        </Pressable>

        <Text style={styles.note}>
          Prototype: no real credentials are collected. All data is synthetic.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.lg },
  logoMark: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.brandRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoW: { color: '#FFFFFF', fontSize: 26, fontWeight: '800' },
  district: { color: colors.brandRed, fontWeight: '800', fontSize: 19, letterSpacing: 0.5 },
  districtSub: { color: colors.text, fontWeight: '600', fontSize: 10, letterSpacing: 1 },
  hero: { borderRadius: radius.card, overflow: 'hidden', marginBottom: space.xl },
  heroOverlay: { padding: space.xl },
  title: { fontSize: 32, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  heading: { fontSize: 24, fontWeight: '700', color: colors.text },
  body: { fontSize: 15, color: colors.textSecondary, marginTop: space.sm, marginBottom: space.xl, lineHeight: 22 },
  button: {
    backgroundColor: colors.brandRed,
    borderRadius: radius.control,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: space.sm,
  },
  buttonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  note: { fontSize: 13, color: colors.textSecondary, marginTop: space.lg, textAlign: 'center' },
});
