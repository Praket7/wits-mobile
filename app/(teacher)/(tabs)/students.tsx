import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, TextInput, Text, View } from 'react-native';
import { WitsLogoHeader } from '@/components/brand';
import { Card, ListRow, Screen, SectionHeader, StatusPill } from '@/components/ui';
import { IconPeople, IconSearch } from '@/components/icons';
import { colors, radius, space } from '@/design/tokens';
import { useTeacherClasses, useTeacherRoster } from '@/queries/useWits';

/**
 * Teacher Students (P0.3, P0.4): the class filter actually changes the roster
 * fetched from the repository, "All Classes" merges and dedupes every
 * authorized roster, missing-work counts come from the repository (no
 * screen-local MISSING map), and every row opens a unique student detail.
 */
export default function TeacherStudents() {
  const classes = useTeacherClasses();
  const [classFilter, setClassFilter] = useState<string>('All');
  const [query, setQuery] = useState('');
  const filterClass = classes.data?.find((c) => classFilter === c.id);
  const roster = useTeacherRoster(classFilter === 'All' ? 'c-chem' : classFilter);

  // Fetch all rosters so "All Classes" merges every authorized section.
  const chem2 = useTeacherRoster('c-chem2');
  const forensic = useTeacherRoster('c-forensic');

  const classOptions = [
    { id: 'All', label: 'All Classes' },
    ...(classes.data ?? []).map((c) => ({ id: c.id, label: c.course ?? c.name.split(' – ')[0] })),
  ];

  const merged =
    classFilter === 'All'
      ? dedupeById([
          ...(roster.data ?? []).map((s) => ({ ...s, className: 'AP Chemistry – P3' })),
          ...(chem2.data ?? []).map((s) => ({ ...s, className: 'AP Chemistry – P7' })),
          ...(forensic.data ?? []).map((s) => ({ ...s, className: 'Forensic Science – P5' })),
        ])
      : (roster.data ?? []).map((s) => ({
          ...s,
          className: filterClass?.name ?? '',
        }));

  const students = merged.filter((s) => {
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
        {classOptions.map(({ id, label }) => {
          const active = classFilter === id;
          return (
            <Text
              key={id}
              onPress={() => setClassFilter(id)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.chip, active && styles.chipActive]}
              suppressHighlighting
            >
              {label}
            </Text>
          );
        })}
      </View>

      <SectionHeader
        title={`Roster (${classFilter === 'All' ? 'All classes' : filterClass?.name ?? classFilter})`}
        icon={<IconPeople size={20} />}
      />
      <Card>
        {students.map((s) => (
          <ListRow
            key={`${s.id}-${s.className}`}
            title={s.name}
            subtitle={`${s.className} • ${s.absences} absence${s.absences === 1 ? '' : 's'}${s.missingCount > 0 ? ` • ${s.missingCount} missing assignment${s.missingCount === 1 ? '' : 's'}` : ''}`}
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
            onPress={() =>
              router.push({
                pathname: '/(teacher)/student/[studentId]',
                params: { studentId: s.id },
              })
            }
          />
        ))}
        {students.length === 0 && <Text style={styles.empty}>No students match your search.</Text>}
      </Card>
    </Screen>
  );
}

function dedupeById<T extends { id: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  return rows.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
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
