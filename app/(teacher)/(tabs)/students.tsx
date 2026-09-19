import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, TextInput, Text, View } from 'react-native';
import { WitsLogoHeader } from '@/components/brand';
import { Card, ListRow, Screen, SectionHeader, StatusPill } from '@/components/ui';
import { IconPeople, IconSearch } from '@/components/icons';
import { colors, radius, space } from '@/design/tokens';
import { useTeacherClasses, useTeacherRoster } from '@/queries/useWits';

// Mock per-student missing-work counts (item 18) — replaced by the district API.
const MISSING: Record<string, number> = { sr1: 0, sr2: 3, sr3: 1, sr4: 0, sr5: 2, sr6: 0 };

export default function TeacherStudents() {
  const classes = useTeacherClasses();
  const [classFilter, setClassFilter] = useState<string>('All');
  const [query, setQuery] = useState('');
  const roster = useTeacherRoster('c-chem'); // prototype: shared roster

  const classOptions = ['All', ...(classes.data ?? []).map((c) => c.name)];
  const students = (roster.data ?? []).filter((s) => {
    if (query && !s.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <Screen>
      <WitsLogoHeader initials="MB" onBellPress={() => router.push('/(teacher)/(tabs)/more' as never)}
        onAvatarPress={() => router.push('/(teacher)/(tabs)/more' as never)}/>
      <Text style={styles.title}>Students</Text>

      <View style={styles.searchBox}>
        <IconSearch size={18} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search students…"
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          accessibilityLabel="Search students"
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      <View style={styles.filterRow}>
        {classOptions.slice(0, 3).map((name) => {
          const active = classFilter === name;
          return (
            <Text
              key={name}
              onPress={() => setClassFilter(name)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.chip, active && styles.chipActive]}
              suppressHighlighting
            >
              {name === 'All' ? 'All Classes' : name.split(' – ')[0]}
            </Text>
          );
        })}
      </View>

      <SectionHeader title={`Roster (${classFilter === 'All' ? 'All classes' : classFilter})`} icon={<IconPeople size={20} />} />
      <Card>
        {students.map((s) => {
          const missing = MISSING[s.id] ?? 0;
          return (
            <ListRow
              key={s.id}
              title={s.name}
              subtitle={`${s.absences} absence${s.absences === 1 ? '' : 's'}${missing > 0 ? ` • ${missing} missing assignment${missing === 1 ? '' : 's'}` : ''}`}
              right={
                <View style={styles.rightCol}>
                  <StatusPill
                    label={`${s.gradePercent}%`}
                    tone={s.gradePercent >= 90 ? 'success' : s.gradePercent >= 80 ? 'warning' : 'danger'}
                  />
                  {s.gradePercent < 80 && <Text style={styles.concernText}>Needs support</Text>}
                </View>
              }
              chevron
              onPress={() => router.push('/(teacher)/(tabs)/students' as never)}
            />
          );
        })}
        {students.length === 0 && <Text style={styles.empty}>No students match your search.</Text>}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '700', marginTop: space.sm, marginBottom: space.md },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    paddingHorizontal: space.md,
    minHeight: 48,
    marginBottom: space.md,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },
  filterRow: { flexDirection: 'row', gap: space.sm, marginBottom: space.md, flexWrap: 'wrap' },
  chip: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    backgroundColor: '#EEF0F3',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 999,
    overflow: 'hidden',
    minHeight: 44,
  },
  chipActive: { backgroundColor: colors.brandRed, color: '#FFFFFF' },
  rightCol: { alignItems: 'flex-end', justifyContent: 'center', gap: 4, minWidth: 96 },
  concernText: { fontSize: 11, fontWeight: '600', color: colors.danger, textAlign: 'right' },
  empty: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', paddingVertical: space.lg },
});
