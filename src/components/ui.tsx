import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadow, space, type as typeScale } from '@/design/tokens';
import { IconChevronBack, IconChevronRight } from './icons';

export function Screen({
  children,
  scroll = true,
  style,
  onRefresh,
  refreshing,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  /** Pull-to-refresh (item 88): pass a query refetch. */
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const content = [styles.inner, { paddingBottom: insets.bottom + space.lg }, style];
  if (scroll) {
    return (
      <ScrollView
        style={styles.flex}
        contentContainerStyle={content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.textSecondary} /> : undefined
        }
      >
        {children}
      </ScrollView>
    );
  }
  return <View style={[styles.flex, content]}>{children}</View>;
}

export function AppHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        {onBack && (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={12}
            style={styles.backBtn}
          >
            <IconChevronBack size={26} />
          </Pressable>
        )}
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
    </View>
  );
}

export function Card({
  children,
  style,
  onPress,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={[styles.card, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionHeader({
  title,
  icon,
  actionLabel,
  onAction,
  chevron,
}: {
  title: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  chevron?: boolean;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        {icon}
        <Text style={styles.sectionTitle}>{title}</Text>
        {chevron ? <IconChevronRight size={16} /> : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          hitSlop={8}
        >
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      ) : actionLabel ? (
        <Text style={styles.sectionActionMuted}>{actionLabel}</Text>
      ) : null}
    </View>
  );
}

export function ListRow({
  title,
  subtitle,
  right,
  chevron,
  onPress,
  left,
  style,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  chevron?: boolean;
  onPress?: () => void;
  left?: React.ReactNode;
  style?: ViewStyle;
}) {
  const body = (
    <>
      {left}
      <View style={styles.rowTextWrap}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {right}
      {chevron ? <IconChevronRight size={16} /> : null}
    </>
  );
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={title}
        style={[styles.row, style]}
      >
        {body}
      </Pressable>
    );
  }
  return <View style={[styles.row, style]}>{body}</View>;
}

export function StatusPill({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand' | 'gold';
}) {
  const toneStyles: Record<string, { bg: string; fg: string }> = {
    success: { bg: colors.successBg, fg: colors.success },
    warning: { bg: colors.warningBg, fg: colors.warning },
    danger: { bg: colors.dangerBg, fg: colors.danger },
    info: { bg: colors.infoBg, fg: colors.brandRed },
    neutral: { bg: '#EEF0F3', fg: colors.textSecondary },
    brand: { bg: colors.brandRed, fg: '#FFFFFF' },
    gold: { bg: colors.brandGold, fg: '#5C4400' },
  };
  const t = toneStyles[tone];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }]}>
      <Text style={[styles.pillText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <View style={styles.stateBox}>
      <Text style={styles.stateTitle}>{title}</Text>
      {message ? <Text style={styles.stateMsg}>{message}</Text> : null}
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  /** Shows a Try Again button when provided (item 39). */
  onRetry?: () => void;
}) {
  return (
    <View style={[styles.stateBox, { backgroundColor: colors.dangerBg }]}>
      <Text style={[styles.stateTitle, { color: colors.danger }]}>Something went wrong</Text>
      {message ? <Text style={[styles.stateMsg, { color: colors.danger }]}>{message}</Text> : null}
      {onRetry ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Try again"
          onPress={onRetry}
          style={styles.retryBtn}
        >
          <Text style={styles.retryBtnText}>Try Again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Metric({
  value,
  label,
  color,
  sub,
}: {
  value: string;
  label: string;
  color?: string;
  sub?: string;
}) {
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
      {sub ? <Text style={styles.metricSub}>{sub}</Text> : null}
    </View>
  );
}

export function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.segmentWrap}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            accessibilityRole="button"
            accessibilityLabel={opt}
            accessibilityState={{ selected: active }}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text
              style={[styles.segmentText, active && styles.segmentTextActive]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {opt}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  inner: { paddingHorizontal: space.lg },
  header: { paddingTop: space.md, paddingBottom: space.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -space.sm,
  },
  headerTextWrap: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.brandRed },
  headerSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: space.lg,
    marginBottom: space.md,
    ...shadow.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.md,
    marginTop: space.xs,
    minHeight: 44,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flex: 1 },
  sectionTitle: { fontSize: typeScale.sectionTitle.fontSize, fontWeight: '700', color: colors.text, flexShrink: 1 },
  sectionAction: { fontSize: 15, fontWeight: '600', color: colors.brandRed },
  sectionActionMuted: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.md,
    minHeight: 44,
    gap: space.md,
  },
  rowTextWrap: { flex: 1 },
  rowTitle: { fontSize: typeScale.headline.fontSize, fontWeight: '600', color: colors.text },
  rowSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  chevron: { fontSize: 20, color: colors.textSecondary, marginLeft: 4 },
  pill: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  pillText: { fontSize: 12, fontWeight: '600' },
  stateBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: space.xl,
    alignItems: 'center',
    marginBottom: space.md,
  },
  stateTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  stateMsg: { fontSize: 14, color: colors.textSecondary, marginTop: space.xs, textAlign: 'center' },
  retryBtn: {
    backgroundColor: colors.brandRed,
    borderRadius: radius.control,
    minHeight: 44,
    paddingHorizontal: space.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.lg,
  },
  retryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  metric: { flex: 1, alignItems: 'flex-start' },
  metricValue: { fontSize: 24, fontWeight: '700', color: colors.text },
  metricLabel: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  metricSub: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  segmentWrap: {
    flexDirection: 'row',
    backgroundColor: '#EEF0F3',
    borderRadius: radius.control,
    padding: 3,
    marginBottom: space.md,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.control - 3,
    paddingHorizontal: 4,
  },
  segmentActive: { backgroundColor: colors.brandRed },
  segmentText: { fontSize: 14, fontWeight: '600', color: colors.text },
  segmentTextActive: { color: '#FFFFFF' },
});
