import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppHeader, Card, Screen, SectionHeader } from '@/components/ui';
import { useTeacherClasses, useSendAnnouncement } from '@/queries/useWits';
import { colors, radius, space } from '@/design/tokens';
import { features } from '@/config/features';
import { IconCheck } from '@/components/icons';

/**
 * Teacher compose (item 33): class announcements stay under the (teacher)
 * group. Sends to MULTIPLE classes via a checklist: the repository fans the
 * announcement out into one real unread thread per targeted class, so every
 * enrolled student — and their parents — receives it in WITSMail. The send
 * button reflects how many classes are selected.
 */
export default function TeacherCompose() {
  const classes = useTeacherClasses();
  const sendAnnouncement = useSendAnnouncement();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const toggle = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const canSend =
    features.messagingReply && selectedIds.length > 0 && !!subject.trim() && !!body.trim();
  const recipientSummary =
    selectedIds.length === 0
      ? 'No classes selected'
      : selectedIds.length === 1
        ? '1 class selected'
        : `${selectedIds.length} classes selected`;

  return (
    <Screen>
      <AppHeader title="New Message" subtitle="Send to one or more classes" onBack={() => router.back()} />

      <SectionHeader title="To (Classes)" actionLabel={recipientSummary} />
      <Card>
        {(classes.data ?? []).map((c) => {
          const checked = selectedIds.includes(c.id);
          return (
            <Pressable
              key={c.id}
              onPress={() => toggle(c.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
              accessibilityLabel={`${c.name}, Room ${c.room}, ${c.studentCount} students`}
              style={styles.classRow}
            >
              <View style={[styles.checkbox, checked && styles.checkboxOn]}>
                {checked ? <IconCheck size={14} color="#FFFFFF" /> : null}
              </View>
              <View style={styles.classText}>
                <Text style={styles.className}>{c.name}</Text>
                <Text style={styles.classSub}>
                  Room {c.room} • {c.studentCount} students
                </Text>
              </View>
            </Pressable>
          );
        })}
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
        accessibilityLabel={canSend ? `Send message to ${recipientSummary}` : 'Send message'}
        disabled={!canSend || sendAnnouncement.isPending}
        onPress={() => {
          sendAnnouncement.mutate(
            {
              courseIds: selectedIds,
              subject: subject.trim(),
              body: body.trim(),
            },
            { onSuccess: () => router.back() },
          );
        }}
        style={[styles.sendBtn, (!canSend || sendAnnouncement.isPending) && { opacity: 0.4 }]}
      >
        <Text style={styles.sendBtnText}>
          {sendAnnouncement.isPending
            ? 'Sending…'
            : canSend
              ? `Send to ${selectedIds.length} Class${selectedIds.length === 1 ? '' : 'es'}`
              : 'Send Message'}
        </Text>
      </Pressable>
      <Text style={styles.note}>Prototype: messages deliver to mock WITSMail data.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingVertical: space.sm,
  },
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
  classText: { flex: 1 },
  className: { fontSize: 16, fontWeight: '600', color: colors.text },
  classSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
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
