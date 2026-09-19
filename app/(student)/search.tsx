import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, Text, View } from 'react-native';
import { AppHeader, Card, EmptyState, ListRow, Screen, StatusPill } from '@/components/ui';
import { IconSearch } from '@/components/icons';
import { colors, radius, space } from '@/design/tokens';
import { useAssignments, useCalendar, useCourses, useGuidance, useResources } from '@/queries/useWits';
import { useSelectedStudentId } from '@/state/appState';
import { searchItems, type SearchCategory, type SearchItem } from '@/search/searchIndex';

const FILTERS = ['All', 'Classes', 'People', 'Resources', 'Events', 'Assignments'] as const;

/** Keyword aliases (item 24): casual terms route to the right entry. */
const ALIASES: Record<string, string> = {
  bell: 'Bell Schedule',
  schedule: 'Bell Schedule',
  parking: 'Parking information',
  college: 'Guidance',
  guidance: 'Guidance',
  chem: 'AP Chemistry',
  chemistry: 'AP Chemistry',
  lunch: 'Lunch Menus',
  bus: 'Transportation',
  transcript: 'Transcript Requests',
  counselor: 'Guidance',
};

export default function Search() {
  const selectedStudentId = useSelectedStudentId();
  const courses = useCourses(selectedStudentId);
  const resources = useResources();
  const calendar = useCalendar(selectedStudentId);
  const assignments = useAssignments(selectedStudentId);
  const guidance = useGuidance(selectedStudentId);
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
      list.push({ id: `r-${r.id}`, title: r.title, subtitle: r.subtitle, category: 'Resources', route: r.url });
    }
    for (const e of calendar.data ?? []) {
      list.push({ id: `e-${e.id}`, title: e.title, subtitle: e.location ?? e.sourceLabel, category: 'Events' });
    }
    for (const a of assignments.data ?? []) {
      list.push({
        id: `a-${a.id}`,
        title: a.title,
        subtitle: `${a.courseName} • ${a.status.replace('-', ' ')}`,
        category: 'Assignments',
        route: `/(student)/assignment/${a.id}`,
      });
    }
    for (const g of guidance.data ?? []) {
      list.push({
        id: `g-${g.id}`,
        title: g.title,
        subtitle: `${g.category} • ${g.location ?? 'Guidance'}`,
        category: 'Events',
        route: '/(student)/guidance',
      });
    }
    // Alias pseudo-entries so "parking" etc. resolve to something useful.
    for (const [alias, target] of Object.entries(ALIASES)) {
      list.push({ id: `alias-${alias}`, title: target, subtitle: `Try "${alias}"`, category: 'Resources' });
    }
    return list;
  }, [courses.data, resources.data, calendar.data, assignments.data, guidance.data]);

  // Expand aliases: an exact alias query becomes its target term (replace,
  // not append — the scorer matches whole phrases, so concatenation matched
  // nothing and "chem" returned an empty result).
  const effectiveQuery = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (q && ALIASES[q]) return ALIASES[q];
    return query;
  }, [query]);

  const results = searchItems(items, effectiveQuery, filter as SearchCategory | 'All');

  return (
    <Screen>
      <AppHeader title="Search" subtitle="Classes, people, assignments, events, resources" onBack={() => router.back()} />
      <View style={styles.inputRow}>
        <View style={styles.inputBox}>
          <IconSearch size={18} />
          <TextInput
            style={styles.input}
            placeholder="Search classes, teachers, assignments, events…"
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            accessibilityLabel="Search"
            accessibilityHint="Searches classes, people, assignments, events, and resources"
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={() => {}}
          />
          {query.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={8}
              onPress={() => setQuery('')}
              style={styles.clearBtn}
            >
              <Text style={styles.clearText}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = filter === f;
          return (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              accessibilityRole="button"
              accessibilityLabel={`Filter: ${f}`}
              accessibilityState={{ selected: active }}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{f}</Text>
            </Pressable>
          );
        })}
      </View>

      {query.length === 0 ? (
        <EmptyState
          title="Search everything"
          message="Search classes, teachers, assignments, events, and resources."
        />
      ) : results.length === 0 ? (
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
  inputRow: { marginBottom: space.md },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    paddingHorizontal: space.lg,
    minHeight: 48,
  },
  input: { flex: 1, fontSize: 16, color: colors.text },
  clearBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -space.sm },
  clearText: { fontSize: 16, color: colors.textSecondary, fontWeight: '600' },
  filterRow: { flexDirection: 'row', gap: space.sm, marginBottom: space.md, flexWrap: 'wrap' },
  chip: {
    backgroundColor: '#EEF0F3',
    paddingHorizontal: 16,
    borderRadius: 999,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.brandRed },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.text },
  chipTextActive: { color: '#FFFFFF' },
});
