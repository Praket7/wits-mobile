import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, TextInput, Text, View } from 'react-native';
import { WitsLogoHeader } from '@/components/BrandBand';
import { Card, ListRow, Screen, EmptyState } from '@/components/ui';
import { ThreadAvatar, UnreadDot } from '@/components/patterns';
import { IconSearch, IconSliders } from '@/components/icons';
import { colors, radius, space } from '@/design/tokens';
import { useMessages } from '@/queries/useWits';

const FILTERS = ['All', 'Unread', 'Classes', 'School', 'Clubs'] as const;

export default function MessagesList() {
  const messages = useMessages();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const [query, setQuery] = useState('');

  const threads = (messages.data ?? []).filter((t) => {
    if (filter === 'Unread' && !t.unread) return false;
    if (filter !== 'All' && filter !== 'Unread' && t.category !== filter) return false;
    if (query && !`${t.participants} ${t.subject} ${t.preview}`.toLowerCase().includes(query.toLowerCase()))
      return false;
    return true;
  });

  const avatarKind = (t: (typeof threads)[number]): 'people' | 'mega' | 'book' | 'trophy' | 'gs' | 'initials' => {
    if (t.participants === 'Guidance Office') return 'gs';
    if (t.participants.includes('Council') || t.participants === 'TSA' || t.participants === 'Science Olympiad') return 'people';
    if (t.participants === 'Williamsville East' || t.participants === 'District Communications') return 'mega';
    if (t.participants.startsWith('AP') || t.participants.includes('Mrs.') || t.participants.includes('Mr.')) return 'initials';
    return 'initials';
  };

  return (
    <Screen>
      <WitsLogoHeader initials="PG" />
      <Text style={styles.screenTitle}>Messages</Text>
      <Text style={styles.screenSub}>Stay connected. Important information in one place.</Text>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <IconSearch size={18} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search messages..."
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            accessibilityLabel="Search messages"
            autoCorrect={false}
          />
        </View>
        <View style={styles.slidersBox} accessibilityLabel="Filter messages">
          <IconSliders size={20} />
        </View>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Text
            key={f}
            onPress={() => setFilter(f)}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === f }}
            style={[styles.chip, filter === f && styles.chipActive]}
          >
            {f}
          </Text>
        ))}
      </View>

      {threads.length === 0 ? (
        <EmptyState title="No messages" message="Nothing matches your filters." />
      ) : (
        <Card>
          {threads.map((t) => (
            <ListRow
              key={t.id}
              title={t.participants}
              subtitle={`${t.subject}\n${t.preview}`}
              left={<ThreadAvatar kind={avatarKind(t)} label={t.participants.split(' ').map((w) => w[0]).slice(0, 2).join('')} />}
              right={
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Text style={styles.timeLabel}>{t.timeLabel}</Text>
                  {t.unread && <UnreadDot />}
                </View>
              }
              chevron
              onPress={() => router.push(`/(student)/messages/${t.id}` as never)}
            />
          ))}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenTitle: { fontSize: 30, fontWeight: '700', color: colors.text, marginTop: space.sm },
  screenSub: { fontSize: 15, color: colors.textSecondary, marginTop: space.xs, marginBottom: space.md },
  searchRow: { flexDirection: 'row', gap: space.sm, marginBottom: space.md },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    paddingHorizontal: space.md,
    minHeight: 48,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },
  slidersBox: {
    width: 48,
    height: 48,
    borderRadius: radius.control,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  timeLabel: { fontSize: 12, color: colors.textSecondary },
});
