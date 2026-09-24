import React, { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { openExternalUrl } from '@/utils/openUrl';
import Svg, { Path } from 'react-native-svg';
import { Screen } from '@/components/ui';
import { colors } from '@/design/tokens';
import { useSession } from '@/state/appState';
import { WMarkImage } from '@/components/brand';
import { DATA_SOURCE } from '@/config/env';

// Official four-color Google "G" (standard path set, viewBox 0 0 48 48).
function GoogleG({ size = 26 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </Svg>
  );
}

const HELP_URL = 'https://www.williamsvillek12.org/departments/communications/ealerts';
const AUP_URL = 'https://north.williamsvillek12.org/parents-students/acceptable-use-policy';
const PRIVACY_URL = 'https://www.williamsvillek12.org/departments/technology/data-privacy-and-security';

export default function Login() {
  const { signIn } = useSession();
  const [signInError, setSignInError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const handleSignIn = async () => {
    if (signingIn) return;
    setSigningIn(true);
    setSignInError(null);
    try {
      const signedInRole = await signIn();
      const home = {
        student: '/(student)/(tabs)/today',
        parent: '/(parent)/(tabs)/today',
        teacher: '/(teacher)/(tabs)/today',
      }[signedInRole];
      router.replace(home as never);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setSignInError(message.includes('Browser sign-in requires the WCSD BFF')
        ? 'Browser sign-in is not connected yet. WCSD must provide the secure sign-in service.'
        : 'Sign-in could not be completed. Try again or contact the school.');
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <Screen scroll={false} style={styles.page}>
      {/* Header lockup — centered stacked, per mockup */}
      <View style={styles.lockupWrap}>
        <WMarkImage size={84} />
        <Text style={styles.district}>WILLIAMSVILLE</Text>
        <Text style={styles.districtSub}>CENTRAL SCHOOL DISTRICT</Text>
      </View>

      <Text style={styles.heading}>Welcome</Text>
      <Text style={styles.sub}>Continue with Williamsville Google SSO.</Text>

      {/* Native builds use system-browser OIDC + PKCE; browser builds wait for
          the WCSD BFF cookie flow. The app never collects district passwords. */}
      <Pressable
        onPress={() => void handleSignIn()}
        disabled={signingIn}
        accessibilityRole="button"
        accessibilityLabel="Sign in with District Account"
        style={({ pressed }) => [styles.googleCard, (pressed || signingIn) && { opacity: 0.75 }]}
      >
        <GoogleG size={26} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.googleTitle}>{signingIn ? 'Connecting…' : 'Sign in with District Account'}</Text>
          <Text style={styles.googleSub}>( Continue with Williamsville Google SSO )</Text>
        </View>
      </Pressable>

      {signInError ? <Text accessibilityRole="alert" style={styles.signInError}>{signInError}</Text> : null}

      {DATA_SOURCE !== 'http' ? <Text style={styles.mockNote}>Prototype: sign-in is simulated.</Text> : null}

      <Text style={styles.legal}>
        By signing in, you agree to the{'\n'}Williamsville Central School District{'\n'}
        <Text style={styles.link} onPress={() => openExternalUrl(AUP_URL)} accessibilityRole="link">
          Acceptable Use Policy.
        </Text>
      </Text>

      <View style={styles.helpRow}>
        <Pressable accessibilityRole="button" onPress={() => openExternalUrl(HELP_URL)} hitSlop={8}>
          <Text style={styles.link}>Help signing in</Text>
        </Pressable>
        <Text style={styles.helpDot}>•</Text>
        <Pressable accessibilityRole="button" onPress={() => openExternalUrl(PRIVACY_URL)} hitSlop={8}>
          <Text style={styles.link}>Privacy</Text>
        </Pressable>
      </View>

      {/* Bottom brand band — full-bleed, pinned to bottom */}
      <View style={styles.bandWrap}>
        <View style={styles.bandMark} pointerEvents="none">
          <WMarkImage size={44} variant="transparent" />
        </View>
        <Text style={styles.bandText}>BELONG. ACHIEVE. MAKE A DIFFERENCE.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 24,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  lockupWrap: { alignItems: 'center', marginTop: 40 },
  district: {
    color: colors.brandRed,
    fontWeight: '800',
    fontSize: 27,
    letterSpacing: 1.6,
    marginTop: 12,
  },
  districtSub: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 12,
    letterSpacing: 2.2,
    marginTop: 2,
  },
  heading: { fontSize: 28, fontWeight: '800', color: colors.text, marginTop: 40, textAlign: 'center' },
  sub: { fontSize: 15, color: colors.textSecondary, marginTop: 6, textAlign: 'center' },
  googleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D7DBE0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    minHeight: 60,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 28,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  googleTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  googleSub: { fontSize: 12.5, color: colors.textSecondary, marginTop: 2 },
  mockNote: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
  },
  signInError: { fontSize: 13, lineHeight: 18, color: colors.danger, textAlign: 'center', marginTop: 10 },
  legal: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 18,
  },
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
    marginBottom: 12,
  },
  helpDot: { color: colors.border, fontSize: 12 },
  link: { color: colors.text, fontWeight: '600', textDecorationLine: 'underline' },
  bandWrap: {
    backgroundColor: colors.bandBg,
    marginHorizontal: -24,
    marginTop: 24,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bandMark: { position: 'absolute', right: -6, top: -8, opacity: 0.25 },
  bandText: {
    color: colors.brandGold,
    fontWeight: '800',
    fontSize: 12.5,
    letterSpacing: 1.8,
  },
});
