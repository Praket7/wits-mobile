import { Tabs, Redirect } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '@/design/tokens';
import { GlassSurface } from '@/components/glass';
import { useSession } from '@/state/appState';
import { useAfterFirstFrame, useUnreadCount } from '@/queries/useWits';

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  today: 'home',
  academics: 'book',
  calendar: 'calendar',
  messages: 'mail',
  more: 'ellipsis-horizontal',
};

export default function ParentTabsLayout() {
  const { role, loggedIn } = useSession();
  const detailReady = useAfterFirstFrame();
  const unread = useUnreadCount(detailReady);
  if (!loggedIn) return <Redirect href="/(auth)/login" />;
  if (role === 'student') return <Redirect href="/(student)/(tabs)/today" />;
  if (role === 'teacher') return <Redirect href="/(teacher)/(tabs)/today" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarBackground: () => <GlassSurface style={StyleSheet.absoluteFill} />,
        tabBarStyle: { position: 'absolute', backgroundColor: 'transparent', borderTopColor: 'rgba(255,255,255,0.72)', elevation: 0 },
        tabBarActiveTintColor: colors.brandRed,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{ title: 'Today', tabBarIcon: ({ color, size }) => <Ionicons name={ICONS.today} size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="academics"
        options={{ title: 'Academics', tabBarIcon: ({ color, size }) => <Ionicons name={ICONS.academics} size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="calendar"
        options={{ title: 'Calendar', tabBarIcon: ({ color, size }) => <Ionicons name={ICONS.calendar} size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.brandRed, color: '#FFFFFF' },
          tabBarIcon: ({ color, size }) => <Ionicons name={ICONS.messages} size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: 'More', tabBarIcon: ({ color, size }) => <Ionicons name={ICONS.more} size={size} color={color} /> }}
      />
    </Tabs>
  );
}
