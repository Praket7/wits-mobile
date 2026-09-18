import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, space } from '@/design/tokens';
import { useSession } from '@/state/appState';

// Invalid deep links show a friendly screen, never a router failure (item 227).
export default function NotFound() {
  const { role } = useSession();
  const home =
    role === 'parent'
      ? '/(parent)/(tabs)/today'
      : role === 'teacher'
        ? '/(teacher)/(tabs)/today'
        : '/(student)/(tabs)/today';

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Page not found</Text>
      <Text style={styles.body}>
        {"This link doesn't lead anywhere. The page may have been moved or removed."}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Return to Today"
        style={styles.button}
        onPress={() => router.replace(home as never)}
      >
        <Text style={styles.buttonText}>Return to Today</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: space.xl },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  body: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginTop: space.sm, marginBottom: space.xl },
  button: { backgroundColor: colors.brandRed, borderRadius: radius.control, minHeight: 44, paddingHorizontal: space.xl, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});
