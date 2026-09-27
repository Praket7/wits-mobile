import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SessionProvider, useSession } from '@/state/appState';
import { wireQueryLifecycle } from '@/state/queryLifecycle';
import { validateConfig } from '@/config/env';
import { colors, radius, space } from '@/design/tokens';
import { NativeBlurBackdrop } from '@/components/glass';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
});

// Startup config validation (item 68, audit P1): a misconfigured HTTP build
// fails VISIBLY with a ConfigError screen — it never silently fetches from an
// empty/invalid base URL and never reaches the login screen half-broken.
const config = validateConfig();

/** Blocking screen for invalid launch configuration. */
function ConfigError({ problems }: { problems: string[] }) {
  return (
    <View style={styles.configWrap}>
      <Text style={styles.configTitle}>Configuration problem</Text>
      {problems.map((p) => (
        <Text key={p} style={styles.configItem}>• {p}</Text>
      ))}
      <Text style={styles.configHint}>
        Check EXPO_PUBLIC_DATA_SOURCE and EXPO_PUBLIC_API_BASE_URL, then restart the app.
      </Text>
    </View>
  );
}

/**
 * Global error boundary (item 71): an unexpected render failure shows this
 * instead of a blank screen. Only non-sensitive diagnostics are logged.
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // Non-sensitive diagnostics only — never student data (item 48).
    console.error('[app] render error:', error.name);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.boundaryWrap}>
          <Text style={styles.boundaryTitle}>Something went wrong</Text>
          <Text style={styles.boundaryBody}>
            The app hit an unexpected problem. Your information was not affected.
          </Text>
          <Pressable
            accessibilityRole="button"
            style={styles.boundaryBtn}
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={styles.boundaryBtnText}>Try Again</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={styles.boundaryBtnSecondary}
            onPress={() => {
              this.setState({ hasError: false });
              router.replace('/(student)/(tabs)/today');
            }}
          >
            <Text style={styles.boundaryBtnSecondaryText}>Return to Today</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

function Routes() {
  const { loggedIn } = useSession();
  if (!loggedIn) return <Stack screenOptions={{ headerShown: false }} />;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F7F8FA' } }}>
      <Stack.Screen name="(student)/(tabs)" />
      <Stack.Screen name="(parent)/(tabs)" />
      <Stack.Screen name="(teacher)/(tabs)" />
    </Stack>
  );
}

function RoleGate() {
  // TanStack Query RN lifecycle (audit item): NetInfo → onlineManager,
  // AppState → focusManager. Wire once for the app's lifetime; the returned
  // unsubscribe keeps HMR/tests clean.
  useEffect(() => wireQueryLifecycle(), []);
  if (!config.ok) return <ConfigError problems={config.problems} />;
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <ErrorBoundary>
        <SessionProvider>
          <NativeBlurBackdrop>
            <Routes />
          </NativeBlurBackdrop>
        </SessionProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default RoleGate;

const styles = StyleSheet.create({
  configWrap: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
    gap: space.sm,
  },
  configTitle: { fontSize: 20, fontWeight: '700', color: colors.danger },
  configItem: { fontSize: 14, color: colors.text, textAlign: 'center' },
  configHint: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: space.md },
  boundaryWrap: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
  },
  boundaryTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
  boundaryBody: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: space.sm,
    marginBottom: space.xl,
  },
  boundaryBtn: {
    backgroundColor: colors.brandRed,
    borderRadius: radius.control,
    minHeight: 44,
    paddingHorizontal: space.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boundaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  boundaryBtnSecondary: { minHeight: 44, justifyContent: 'center', paddingHorizontal: space.lg, marginTop: space.sm },
  boundaryBtnSecondaryText: { color: colors.brandRed, fontWeight: '600', fontSize: 15 },
});
