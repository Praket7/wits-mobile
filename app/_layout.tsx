import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SessionProvider, useSession } from '@/state/appState';
import { validateConfig } from '@/config/env';
import { colors, radius, space } from '@/design/tokens';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
});

// Startup config validation (item 68): fail visibly, never silently fetch
// from an empty or invalid base URL.
if (!__DEV__) {
  const cfg = validateConfig();
  if (!cfg.ok) console.error('[config]', cfg.problems.join(' '));
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
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <ErrorBoundary>
        <SessionProvider>
          <Routes />
        </SessionProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default RoleGate;

const styles = StyleSheet.create({
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
