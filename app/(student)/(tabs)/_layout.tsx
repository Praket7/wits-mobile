import { Tabs } from 'expo-router';
import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '@/design/tokens';

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  today: 'home',
  academics: 'book',
  calendar: 'calendar',
  messages: 'mail',
  more: 'ellipsis-horizontal',
};

export default function StudentTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brandRed,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: 'Today',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={ICONS.today} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="academics"
        options={{
          title: 'Academics',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={ICONS.academics} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={ICONS.calendar} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarBadge: 3,
          tabBarBadgeStyle: { backgroundColor: colors.brandRed, color: '#FFFFFF' },
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={ICONS.messages} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={ICONS.more} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
