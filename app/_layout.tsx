import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SessionProvider, useSession } from '@/state/appState';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
});

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
      <SessionProvider>
        <Routes />
      </SessionProvider>
    </QueryClientProvider>
  );
}

export default RoleGate;
