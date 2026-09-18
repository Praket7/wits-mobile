import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { AppHeader, Card, ListRow, Screen, SectionHeader } from '@/components/ui';
import { useTeacherClasses, useSendMessage } from '@/queries/useWits';
import { colors, radius, space } from '@/design/tokens';
import { features } from '@/config/features';

/**
 * Teacher compose (item 33): class announcements stay under the (teacher)
 * group. Prototype sends target the shared mock thread so the message appears
 * in WITSMail; production routes through the district message API.
 */
export default function TeacherCompose() {
  const classes = useTeacherClasses();
  const sendMessage = useSendMessage();
  const [classId, setClassId] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const canSend = features.messagingReply && classId && subject.trim() && body.trim();

  return (
    <Screen>
      <AppHeader title="New Message" subtitle="Send to a class or section" onBack={() => router.back()} />

      <SectionHeader title="To (Class)" />
      <Card>
        {(classes.data ?? []).map((c) => (
          <ListRow
            key={c.id}
            title={c.name}
            subtitle={`Room ${c.room} • ${c.studentCount} students`}
            right={classId === c.id ? <Text style={styles.check}>✓</Text> : null}
            onPress={() => setClassId(c.id)}
          />
        ))}
      </Card>

      <SectionHeader title="Message" />
      <Card>
        <Text style={styles.fieldLabel}>Subject</Text>
        <TextInput
          style={styles.subjectInput}
          placeholder="e.g. Lab materials posted"
          placeholderTextColor={colors.textSecondary}
          value={subject}
          onChangeText={setSubject}
          accessibilityLabel="Message subject"
          returnKeyType="next"
        />
        <Text style={styles.fieldLabel}>Body</Text>
        <TextInput
          style={[styles.bodyInput, { minHeight: 120 }]}
          placeholder="Write your announcement…"
          placeholderTextColor={colors.textSecondary}
          value={body}
          onChangeText={setBody}
          multiline
          accessibilityLabel="Message body"
        />
      </Card>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Send message"
        disabled={!canSend || sendMessage.isPending}
        onPress={() => {
          // Prototype: deliver into the shared mock thread.
          sendMessage.mutate(
            { threadId: 'thr-1', body: `[${subject.trim()}] ${body.trim()}` },
            { onSuccess: () => router.back() },
          );
        }}
        style={[styles.sendBtn, (!canSend || sendMessage.isPending) && { opacity: 0.4 }]}
      >
        <Text style={styles.sendBtnText}>{sendMessage.isPending ? 'Sending…' : 'Send Message'}</Text>
      </Pressable>
      <Text style={styles.note}>Prototype: messages deliver to mock WITSMail data.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  subjectInput: {
    backgroundColor: '#F7F8FA',
    borderRadius: radius.control,
    minHeight: 44,
    paddingHorizontal: space.md,
    fontSize: 15,
    color: colors.text,
    marginBottom: space.md,
  },
  bodyInput: {
    backgroundColor: '#F7F8FA',
    borderRadius: radius.control,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    fontSize: 15,
    color: colors.text,
    textAlignVertical: 'top',
  },
  check: { color: colors.brandRed, fontWeight: '700', fontSize: 16 },
  sendBtn: {
    backgroundColor: colors.brandRed,
    borderRadius: radius.control,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.sm,
  },
  sendBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  note: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginTop: space.md },
});
