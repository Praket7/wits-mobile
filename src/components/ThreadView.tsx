import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppHeader, Card, EmptyState, ErrorState, Screen } from '@/components/ui';
import { ThreadAvatar } from '@/components/patterns';
import { IconCheck, IconDownload, IconForward, IconPerson, IconReply } from '@/components/icons';
import { colors, radius, space } from '@/design/tokens';
import {
  useForwardMessage,
  useMarkThreadRead,
  useMessages,
  useSendMessage,
  useStaffDirectory,
  useTeacherClasses,
  useCourses,
} from '@/queries/useWits';
import { useSelectedStudentId, useSession } from '@/state/appState';
import { formatIsoDateLabel, formatTime } from '@/utils/format';
import { features } from '@/config/features';

type Recipient = { kind: 'user' | 'class'; id: string; label: string };

/**
 * Actual detail screen body; routed wrappers pass their threadId param.
 * WITSMail mail semantics (plan item 32): Reply joins the existing thread;
 * Forward creates real, individually addressed unread mail with quoted
 * provenance (From/Date/Subject + quoted body).
 */
export function ThreadDetailBody({ threadId }: { threadId: string }) {
  const messages = useMessages();
  const courses = useCourses(useSelectedStudentId());
  const sendMessage = useSendMessage();
  const forwardMessage = useForwardMessage();
  const markThreadRead = useMarkThreadRead();
  const staff = useStaffDirectory();
  const teacherClasses = useTeacherClasses();
  const { role } = useSession();
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<{ name: string } | null>(null);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [fwdTo, setFwdTo] = useState<Recipient[]>([]);
  const [fwdNote, setFwdNote] = useState('');
  const inputRef = useRef<TextInput | null>(null);
  const thread = (messages.data ?? []).find((t) => t.id === threadId);

  // Opening a thread marks it read for THIS viewer (item 92).
  useEffect(() => {
    if (thread?.unread) markThreadRead.mutate(thread.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread?.id, thread?.unread]);

  if (messages.isLoading) return <Screen><EmptyState title="Loading…" /></Screen>;
  if (!thread) return <Screen><ErrorState message="Message not found" /></Screen>;

  // Class-targeted announcements headline with the class name.
  let headline = thread.participants;
  if (thread.category === 'Classes' && thread.courseIds.length > 0) {
    const c = (courses.data ?? []).find((cc) => cc.id === thread.courseIds[0]);
    if (c) headline = c.name;
  }

  const first = thread.messages[0];
  const dateLabel = first ? formatIsoDateLabel(first.time) : '';
  const replyEnabled = features.messagingReply;

  // Forward recipients: students/parents address staff; teachers address
  // whole classes through the announcement fan-out.
  const recipients: Recipient[] =
    role === 'teacher'
      ? (teacherClasses.data ?? []).map((c) => ({ kind: 'class' as const, id: c.id, label: c.name }))
      : (staff.data ?? []).map((s) => ({ kind: 'user' as const, id: s.id, label: s.name }));

  const toggleTo = (r: Recipient) =>
    setFwdTo((prev) => (prev.some((x) => x.id === r.id) ? prev.filter((x) => x.id !== r.id) : [...prev, r]));

  const startReply = () => {
    if (!replyEnabled) return;
    const lastTheirs = [...thread.messages].reverse().find((m) => !m.sentByMe);
    setReplyTo({ name: lastTheirs?.sender ?? thread.participants });
    inputRef.current?.focus();
  };

  const submitForward = () => {
    if (fwdTo.length === 0 || forwardMessage.isPending || !thread) return;
    forwardMessage.mutate(
      {
        sourceThreadId: thread.id,
        quotedFrom: headline,
        quotedDateLabel: dateLabel,
        quotedSubject: thread.subject,
        quotedBody: first?.body ?? '',
        note: fwdNote.trim(),
        to: fwdTo,
      },
      {
        onSuccess: (created) => {
          setForwardOpen(false);
          setFwdTo([]);
          setFwdNote('');
          Alert.alert(
            'Forwarded',
            `Delivered to ${created} recipient${created === 1 ? '' : 's'} in WITSMail.`,
          );
        },
        onError: () => Alert.alert('Not sent', 'Forwarding failed. Please try again.'),
      },
    );
  };

  return (
    <Screen>
      <AppHeader title="Messages" onBack={() => router.back()} />

      <View style={styles.senderRow}>
        <ThreadAvatar kind="people" />
        <View style={{ flex: 1 }}>
          <Text style={styles.senderName}>{headline}</Text>
          <Text style={styles.senderMeta}>{thread.category === 'Classes' ? thread.subject : thread.participants}</Text>
        </View>
        <IconPerson size={18} color="#9AA2AE" />
      </View>
      <View style={styles.divider} />

      {/* Mail actions (item 32): Reply / Forward */}
      <View style={styles.actionsRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Reply to ${headline}`}
          disabled={!replyEnabled}
          onPress={startReply}
          style={({ pressed }) => [styles.actionBtn, !replyEnabled && { opacity: 0.4 }, pressed && { opacity: 0.6 }]}
        >
          <IconReply size={16} />
          <Text style={styles.actionText}>Reply</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Forward this message${replyEnabled ? '' : ' (unavailable)'}`}
          disabled={!replyEnabled}
          onPress={() => {
            setForwardOpen((v) => !v);
            setFwdTo([]);
            setFwdNote('');
          }}
          style={({ pressed }) => [styles.actionBtn, !replyEnabled && { opacity: 0.4 }, pressed && { opacity: 0.6 }]}
        >
          <IconForward size={16} />
          <Text style={styles.actionText}>Forward</Text>
        </Pressable>
      </View>

      <Text style={styles.subject}>{thread.subject}</Text>
      {first && <Text style={styles.subjectMeta}>{dateLabel}, {formatTime(first.time)}</Text>}

      {/* Forward sheet: recipients, note, quoted provenance */}
      {forwardOpen && (
        <Card style={styles.fwdSheet}>
          <View style={styles.fwdHeader}>
            <Text style={styles.fwdTitle}>Forward message</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel forward"
              onPress={() => setForwardOpen(false)}
              style={styles.fwdCancel}
              hitSlop={8}
            >
              <Text style={styles.fwdCancelText}>Cancel</Text>
            </Pressable>
          </View>
          <Text style={styles.fwdLabel}>To — {role === 'teacher' ? 'classes' : 'staff'}</Text>
          {recipients.map((r) => {
            const checked = fwdTo.some((x) => x.id === r.id);
            return (
              <Pressable
                key={r.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                accessibilityLabel={`Forward to ${r.label}`}
                onPress={() => toggleTo(r)}
                style={styles.fwdRow}
              >
                <View style={[styles.checkbox, checked && styles.checkboxOn]}>
                  {checked ? <IconCheck size={14} color="#FFFFFF" /> : null}
                </View>
                <Text style={styles.fwdRowLabel}>{r.label}</Text>
              </Pressable>
            );
          })}
          <Text style={styles.fwdLabel}>Add a note (optional)</Text>
          <TextInput
            style={styles.fwdNote}
            placeholder="Add context for the recipient…"
            placeholderTextColor={colors.textSecondary}
            value={fwdNote}
            onChangeText={setFwdNote}
            multiline
            accessibilityLabel="Forward note"
          />
          <View style={styles.fwdQuote}>
            <Text style={styles.fwdQuoteMeta}>From: {headline}</Text>
            <Text style={styles.fwdQuoteMeta}>Date: {dateLabel}</Text>
            <Text style={styles.fwdQuoteMeta}>Subject: {thread.subject}</Text>
            <Text numberOfLines={4} style={styles.fwdQuoteBody}>{first?.body}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Forward to ${fwdTo.length} recipient${fwdTo.length === 1 ? '' : 's'}`}
            disabled={fwdTo.length === 0 || forwardMessage.isPending}
            onPress={submitForward}
            style={[styles.fwdSendBtn, (fwdTo.length === 0 || forwardMessage.isPending) && { opacity: 0.4 }]}
          >
            <Text style={styles.fwdSendText}>
              {forwardMessage.isPending
                ? 'Forwarding…'
                : fwdTo.length === 0
                  ? 'Select a recipient'
                  : `Forward to ${fwdTo.length} recipient${fwdTo.length === 1 ? '' : 's'}`}
            </Text>
          </Pressable>
        </Card>
      )}

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
            <Text style={styles.bubbleSender}>{m.sender}</Text>
            <Text style={styles.bubbleText}>{m.body}</Text>
            <Text style={styles.time}>{formatTime(m.time)}</Text>
          </View>
        ),
      )}

      {thread.attachments.length > 0 && (
        <View style={styles.attachCard}>
          <Text style={styles.attachTitle}>Attachments</Text>
          {thread.attachments.map((a) => (
            <Pressable
              key={a.name}
              accessibilityRole="button"
              accessibilityLabel={`Attachment ${a.name}`}
              style={styles.attachmentRow}
              onPress={() =>
                Alert.alert(
                  a.name,
                  'Attachment preview arrives with the district integration — file storage is not available in the prototype.',
                )
              }
            >
              <View style={styles.pdfBadge}>
                <Text style={styles.pdfBadgeText}>PDF</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.attachmentName}>{a.name}</Text>
                <Text style={styles.attachmentSize}>{a.size}</Text>
              </View>
              <IconDownload size={22} color={colors.textSecondary} />
            </Pressable>
          ))}
        </View>
      )}

      {/* Reply context chip + composer */}
      {replyTo && (
        <View style={styles.replyChip}>
          <Text numberOfLines={1} style={styles.replyChipText}>
            Replying to {replyTo.name}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel reply"
            hitSlop={8}
            onPress={() => setReplyTo(null)}
          >
            <Text style={styles.replyCancelText}>Cancel</Text>
          </Pressable>
        </View>
      )}
      <View style={styles.composerRow}>
        <View style={styles.plusBox}>
          <Text style={styles.plusText}>+</Text>
        </View>
        <TextInput
          ref={inputRef}
          style={styles.inputBox}
          placeholder={replyTo ? `Reply to ${replyTo.name}…` : 'Type a message...'}
          placeholderTextColor={colors.textSecondary}
          value={draft}
          onChangeText={setDraft}
          multiline
          accessibilityLabel={replyTo ? `Reply text for ${replyTo.name}` : 'Message text'}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={replyTo ? 'Send reply' : 'Send message'}
          style={[styles.sendBox, (draft.trim().length === 0 || !features.messagingReply) && { opacity: 0.4 }]}
          disabled={draft.trim().length === 0 || !features.messagingReply}
          onPress={() => {
            const body = draft.trim();
            if (!body || !thread) return;
            sendMessage.mutate(
              { threadId: thread.id, body },
              {
                onSuccess: () => {
                  setDraft('');
                  setReplyTo(null);
                  markThreadRead.mutate(thread.id);
                },
              },
            );
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
  divider: { height: 1, backgroundColor: colors.border, marginBottom: space.md },
  actionsRow: { flexDirection: 'row', gap: space.sm, marginBottom: space.md },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: space.lg,
    borderRadius: radius.control,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: { fontSize: 15, fontWeight: '600', color: colors.brandRed },
  subject: { fontSize: 22, fontWeight: '700', color: colors.text },
  subjectMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 2, marginBottom: space.md },
  fwdSheet: { marginBottom: space.md },
  fwdHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fwdTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  fwdCancel: { minHeight: 44, justifyContent: 'center', paddingHorizontal: space.sm },
  fwdCancelText: { fontSize: 15, fontWeight: '600', color: colors.brandRed },
  fwdLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginTop: space.md, marginBottom: 6 },
  fwdRow: { flexDirection: 'row', alignItems: 'center', minHeight: 44, paddingVertical: 4 },
  fwdRowLabel: { flex: 1, fontSize: 15, color: colors.text },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#C6CDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space.md,
  },
  checkboxOn: { backgroundColor: colors.brandRed, borderColor: colors.brandRed },
  fwdNote: {
    backgroundColor: '#F7F8FA',
    borderRadius: radius.control,
    minHeight: 44,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    fontSize: 15,
    color: colors.text,
    textAlignVertical: 'top',
  },
  fwdQuote: {
    backgroundColor: '#F7F8FA',
    borderRadius: radius.control,
    padding: space.md,
    marginTop: space.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.border,
  },
  fwdQuoteMeta: { fontSize: 12, color: colors.textSecondary, marginBottom: 2 },
  fwdQuoteBody: { fontSize: 13, color: colors.textSecondary, marginTop: 6, lineHeight: 18 },
  fwdSendBtn: {
    backgroundColor: colors.brandRed,
    borderRadius: radius.control,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.md,
  },
  fwdSendText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
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
  bubbleSender: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 4 },
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
  replyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.infoBg,
    borderRadius: radius.control,
    paddingHorizontal: space.md,
    minHeight: 40,
    marginBottom: space.sm,
  },
  replyChipText: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.text, marginRight: space.sm },
  replyCancelText: { fontSize: 13, fontWeight: '700', color: colors.brandRed },
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
