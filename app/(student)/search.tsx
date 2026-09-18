import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, TextInput, Text, View } from 'react-native';
import { AppHeader, Card, EmptyState, ListRow, Screen, StatusPill } from '@/components/ui';
import { colors, radius, space } from '@/design/tokens';
import { useCalendar, useCourses, useResources } from '@/queries/useWits';
import { useSession } from '@/state/appState';
import { searchItems, type SearchCategory, type SearchItem } from '@/search/searchIndex';

const FILTERS = ['All', 'Classes', 'People', 'Resources', 'Events'] as const;

export default function Search() {
  const { selectedStudentId } = useSession();
  const courses = useCourses(selectedStudentId);
  const resources = useResources();
  const calendar = useCalendar(selectedStudentId);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');

  const items = useMemo<SearchItem[]>(() => {
    const list: SearchItem[] = [];
    for (const c of courses.data ?? []) {
      list.push({
        id: `c-${c.id}`,
        title: c.name,
        subtitle: `${c.teacher} • Room ${c.room}`,
        category: 'Classes',
        route: `/(student)/course/${c.id}`,
      });
      list.push({
        id: `p-${c.id}`,
        title: c.teacher,
        subtitle: c.name,
        category: 'People',
        route: `/(student)/course/${c.id}`,
      });
    }
    for (const r of resources.data ?? []) {
      list.push({ id: `r-${r.id}`, title: r.title, subtitle: r.subtitle, category: 'Resources' });
    }
    for (const e of calendar.data ?? []) {
      list.push({ id: `e-${e.id}`, title: e.title, subtitle: e.location ?? e.sourceLabel, category: 'Events' });
    }
    return list;
  }, [courses.data, resources.data, calendar.data]);

  const results = searchItems(items, query, filter as SearchCategory | 'All');

  return (
    <Screen>
      <AppHeader title="Search" subtitle="Classes, people, resources, events" onBack={() => router.back()} />
      <TextInput
        style={styles.input}
        placeholder="Search…"
        placeholderTextColor={colors.textSecondary}
        value={query}
        onChangeText={setQuery}
        accessibilityLabel="Search"
        autoCorrect={false}
      />
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Text
            key={f}
            onPress={() => setFilter(f)}
            accessibilityRole="button"
            style={[styles.chip, filter === f && styles.chipActive]}
          >
            {f}
          </Text>
        ))}
      </View>
      {results.length === 0 && query.length > 0 ? (
        <EmptyState title="No results" message={`Nothing matches "${query}"`} />
      ) : (
        <Card>
          {results.slice(0, 30).map((r) => (
            <ListRow
              key={r.id}
              title={r.title}
              subtitle={r.subtitle}
              chevron={!!r.route}
              onPress={r.route ? () => router.push(r.route as never) : undefined}
              right={<StatusPill label={r.category} tone="neutral" />}
            />
          ))}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    paddingHorizontal: space.lg,
    minHeight: 48,
    fontSize: 16,
    color: colors.text,
    marginBottom: space.md,
  },
  filterRow: { flexDirection: 'row', gap: space.sm, marginBottom: space.md, flexWrap: 'wrap' },
  chip: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    backgroundColor: '#EEF0F3',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: 'hidden',
    minHeight: 36,
  },
  chipActive: { backgroundColor: colors.brandRed, color: '#FFFFFF' },
});
