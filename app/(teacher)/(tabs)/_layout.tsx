import { Tabs, Redirect } from 'expo-router';
import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '@/design/tokens';
import { useSession } from '@/state/appState';

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  today: 'home',
  classes: 'book',
  students: 'people',
  messages: 'mail',
  more: 'ellipsis-horizontal',
};

export default function TeacherTabsLayout() {
  const { role, loggedIn } = useSession();
  if (!loggedIn) return <Redirect href="/(auth)/login" />;
  if (role === 'student') return <Redirect href="/(student)/(tabs)/today" />;
  if (role === 'parent') return <Redirect href="/(parent)/(tabs)/today" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brandRed,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="today" options={{ title: 'Today', tabBarIcon: ({ color, size }) => <Ionicons name={ICONS.today} size={size} color={color} /> }} />
      <Tabs.Screen name="classes" options={{ title: 'Classes', tabBarIcon: ({ color, size }) => <Ionicons name={ICONS.classes} size={size} color={color} /> }} />
      <Tabs.Screen name="students" options={{ title: 'Students', tabBarIcon: ({ color, size }) => <Ionicons name={ICONS.students} size={size} color={color} /> }} />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarBadge: 3,
          tabBarBadgeStyle: { backgroundColor: colors.brandRed, color: '#FFFFFF' },
          tabBarIcon: ({ color, size }) => <Ionicons name={ICONS.messages} size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: ({ color, size }) => <Ionicons name={ICONS.more} size={size} color={color} /> }} />
    </Tabs>
  );
}
