import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { AppHeader, EmptyState, ErrorState, Screen } from '@/components/ui';
import { ThreadAvatar } from '@/components/patterns';
import { IconCheck, IconDownload, IconPerson } from '@/components/icons';
import { colors, radius, space } from '@/design/tokens';
import { keys, useMessages } from '@/queries/useWits';
import { formatTime } from '@/utils/format';
import type { MessageThread } from '@/domain/schemas';

export default function MessageThreadDetail() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const messages = useMessages();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');
  const thread = (messages.data ?? []).find((t) => t.id === threadId);

  if (messages.isLoading) return <Screen><EmptyState title="Loading…" /></Screen>;
  if (!thread) return <Screen><ErrorState message="Message not found" /></Screen>;

  const first = thread.messages[0];

  return (
    <Screen>
      <AppHeader title="Messages" onBack={() => router.back()} />

      <View style={styles.senderRow}>
        <ThreadAvatar kind="people" />
        <View style={{ flex: 1 }}>
          <Text style={styles.senderName}>{thread.participants}</Text>
          <Text style={styles.senderMeta}>{thread.category === 'Classes' ? thread.subject : thread.participants}</Text>
        </View>
        <IconPerson size={18} color="#9AA2AE" />
      </View>
      <View style={styles.divider} />

      <Text style={styles.subject}>{thread.subject}</Text>
      {first && <Text style={styles.subjectMeta}>Today, {formatTime(first.time)}</Text>}

      {thread.messages.map((m) =>
        m.sentByMe ? (
          <View key={m.id} style={[styles.bubbleMine]}>
            <Text style={styles.bubbleTextMine}>{m.body}</Text>
            <View style={styles.metaRowMine}>
              <Text style={styles.timeMine}>{formatTime(m.time)}</Text>
              <IconCheck size={14} color="#FFFFFF" />
            </View>
          </View>
        ) : (
          <View key={m.id} style={styles.bubbleTheirs}>
            <Text style={styles.bubbleText}>{m.body}</Text>
            <Text style={styles.time}>{formatTime(m.time)}</Text>
          </View>
        )
      )}

      {thread.attachments.length > 0 && (
        <View style={styles.attachCard}>
          <Text style={styles.attachTitle}>Attachments</Text>
          {thread.attachments.map((a) => (
            <View key={a.name} style={styles.attachmentRow}>
              <View style={styles.pdfBadge}>
                <Text style={styles.pdfBadgeText}>PDF</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.attachmentName}>{a.name}</Text>
                <Text style={styles.attachmentSize}>{a.size}</Text>
              </View>
              <IconDownload size={22} />
            </View>
          ))}
        </View>
      )}

      {/* Composer row */}
      <View style={styles.composerRow}>
        <View style={styles.plusBox}>
          <Text style={styles.plusText}>+</Text>
        </View>
        <TextInput
          style={styles.inputBox}
          placeholder="Type a message..."
          placeholderTextColor={colors.textSecondary}
          value={draft}
          onChangeText={setDraft}
          multiline
          accessibilityLabel="Message text"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send message"
          style={[styles.sendBox, draft.trim().length === 0 && { opacity: 0.4 }]}
          disabled={draft.trim().length === 0}
          onPress={() => {
            const body = draft.trim();
            if (!body || !thread) return;
            const now = new Date();
            const timeLabel = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            queryClient.setQueryData<MessageThread[]>(keys.messages, (prev) =>
              (prev ?? []).map((t) =>
                t.id === thread.id
                  ? {
                      ...t,
                      unread: false,
                      preview: body,
                      timeLabel,
                      messages: [
                        ...t.messages,
                        {
                          id: `msg-local-${now.getTime()}`,
                          sender: 'Me',
                          body,
                          time: now.toISOString(),
                          sentByMe: true,
                          read: true,
                        },
                      ],
                    }
                  : t,
              ),
            );
            setDraft('');
          }}
        >
          <Text style={styles.sendText}>➤</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  senderRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.md },
  senderName: { fontSize: 20, fontWeight: '700', color: colors.text },
  senderMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 1 },
  divider: { height: 1, backgroundColor: colors.border, marginBottom: space.lg },
  subject: { fontSize: 22, fontWeight: '700', color: colors.text },
  subjectMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 2, marginBottom: space.md },
  bubbleTheirs: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: space.lg,
    marginBottom: space.md,
  },
  bubbleMine: {
    backgroundColor: colors.brandRed,
    borderRadius: radius.card,
    padding: space.lg,
    marginBottom: space.md,
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  bubbleText: { fontSize: 15, color: colors.text, lineHeight: 22 },
  bubbleTextMine: { fontSize: 15, color: '#FFFFFF', lineHeight: 22 },
  time: { fontSize: 12, color: colors.textSecondary, marginTop: space.sm },
  metaRowMine: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space.sm, justifyContent: 'flex-end' },
  timeMine: { fontSize: 12, color: '#FFFFFF', opacity: 0.85 },
  attachCard: { backgroundColor: colors.surface, borderRadius: radius.card, padding: space.lg, marginBottom: space.md },
  attachTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: space.sm },
  attachmentRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  pdfBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfBadgeText: { color: colors.danger, fontWeight: '800', fontSize: 12 },
  attachmentName: { fontSize: 15, fontWeight: '600', color: colors.text },
  attachmentSize: { fontSize: 13, color: colors.textSecondary },
  composerRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.md },
  plusBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusText: { fontSize: 22, color: colors.textSecondary },
  inputBox: {
    flex: 1,
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  inputPlaceholder: { fontSize: 14, color: colors.textSecondary },
  sendBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brandRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: { color: '#FFFFFF', fontSize: 16 },
});
