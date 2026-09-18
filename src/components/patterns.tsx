import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, space } from '@/design/tokens';
import { formatGradeBg, formatGradeColor } from '@/utils/format';
import {
  IconBook,
  IconMega,
  IconPeople,
  IconTrophy,
} from './icons';

// Colored percentage box used on grade rows (92% green, 85% gold…)
export function ScorePill({ percent, points }: { percent: number; points?: boolean }) {
  return (
    <View style={[styles.scoreBox, { backgroundColor: formatGradeBg(percent) }]}>
      <Text style={[styles.scoreText, { color: formatGradeColor(percent) }]}>
        {points ? `${percent}` : `${percent}%`}
      </Text>
    </View>
  );
}

// "SEP 18" style event date tile with a colored category bar.
export function EventDateTile({ month, day, barColor }: { month: string; day: string; barColor: string }) {
  return (
    <View style={styles.tileRow}>
      <View style={styles.dateTile}>
        <Text style={styles.tileMonth}>{month}</Text>
        <Text style={styles.tileDay}>{day}</Text>
      </View>
      <View style={[styles.tileBar, { backgroundColor: barColor }]} />
    </View>
  );
}

// Rounded avatar for message threads (initials or category icon).
export function ThreadAvatar({
  kind,
  label,
}: {
  kind: 'people' | 'mega' | 'book' | 'trophy' | 'initials' | 'gs';
  label?: string;
}) {
  const tinted = kind === 'people' || kind === 'mega' || kind === 'book' || kind === 'trophy';
  return (
    <View style={[styles.avatarCircle, tinted && styles.avatarTinted]}>
      {kind === 'people' && <IconPeople size={20} color={colors.brandRed} />}
      {kind === 'mega' && <IconMega size={20} color={colors.brandRed} />}
      {kind === 'book' && <IconBook size={20} color={colors.brandRed} />}
      {kind === 'trophy' && <IconTrophy size={20} color={colors.brandRed} />}
      {kind === 'gs' && <Text style={styles.avatarInitials}>GS</Text>}
      {kind === 'initials' && <Text style={styles.avatarInitials}>{label ?? '?'}</Text>}
    </View>
  );
}

// Three-tile resource card (Google Drive / Course Links / Textbook).
export function ResourceTiles({
  tiles,
}: {
  tiles: { icon: React.ReactNode; title: string; subtitle: string }[];
}) {
  return (
    <View style={styles.tilesRow}>
      {tiles.map((t) => (
        <View key={t.title} style={styles.tile}>
          <View style={styles.tileIconWrap}>{t.icon}</View>
          <Text style={styles.tileTitle}>{t.title}</Text>
          <Text style={styles.tileSubtitle}>{t.subtitle}</Text>
        </View>
      ))}
    </View>
  );
}

// Six-tile academic tools grid with icon + title + subtitle.
export function ToolsGrid({
  tools,
}: {
  tools: { icon: React.ReactNode; title: string; subtitle: string }[];
}) {
  return (
    <View style={styles.gridWrap}>
      {tools.map((t) => (
        <View key={t.title} style={styles.gridTile}>
          <View style={styles.gridIconWrap}>{t.icon}</View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tileTitle}>{t.title}</Text>
            <Text style={styles.tileSubtitle}>{t.subtitle}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// Unread dot with a non-color cue for accessibility.
export function UnreadDot({ color = colors.brandRed }: { color?: string }) {
  return (
    <View
      accessibilityLabel="unread"
      accessibilityRole="image"
      style={[styles.unreadDot, { backgroundColor: color }]}
    />
  );
}

const styles = StyleSheet.create({
  scoreBox: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  scoreText: { fontSize: 15, fontWeight: '700' },
  tileRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  dateTile: {
    width: 44,
    borderRadius: 10,
    backgroundColor: colors.dangerBg,
    alignItems: 'center',
    paddingVertical: 6,
  },
  tileMonth: { fontSize: 11, fontWeight: '700', color: colors.brandRed },
  tileDay: { fontSize: 18, fontWeight: '800', color: colors.brandRed, lineHeight: 21 },
  tileBar: { width: 4, height: 40, borderRadius: 2 },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF0F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTinted: { backgroundColor: colors.dangerBg },
  avatarInitials: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  tilesRow: { flexDirection: 'row', gap: space.sm },
  tile: {
    flex: 1,
    backgroundColor: '#F7F8FA',
    borderRadius: radius.control,
    padding: space.md,
    alignItems: 'center',
  },
  tileIconWrap: { marginBottom: space.sm, height: 28, justifyContent: 'center' },
  tileTitle: { fontSize: 13, fontWeight: '700', color: colors.text, textAlign: 'center' },
  tileSubtitle: { fontSize: 10, color: colors.textSecondary, textAlign: 'center', marginTop: 2 },
  gridWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  gridTile: {
    width: '47.5%',
    flexGrow: 1,
    backgroundColor: '#F7F8FA',
    borderRadius: radius.control,
    padding: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  gridIconWrap: { height: 28, justifyContent: 'center' },
  unreadDot: { width: 10, height: 10, borderRadius: 5 },
});
