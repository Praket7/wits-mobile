import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppHeader, Card, EmptyState, ErrorState, ListRow, Screen, SectionHeader, StatusPill } from '@/components/ui';
import {
  IconBook,
  IconCalendar,
  IconClock,
  IconDocText,
  IconDownload,
  IconGoogle,
  IconGradCap,
  IconLink,
  IconMail,
  IconPerson,
  IconStats,
  IconStar,
} from '@/components/icons';
import { colors, radius, space } from '@/design/tokens';
import { useAssignment } from '@/queries/useWits';
import { formatIsoDateLabel } from '@/utils/format';
import { openExternalUrl } from '@/utils/openUrl';

export default function AssignmentDetail() {
  const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>();
  const q = useAssignment(assignmentId);

  if (q.isLoading) return <Screen><EmptyState title="Loading…" /></Screen>;
  if (q.isError || !q.data) return <Screen><ErrorState message={String(q.error)} /></Screen>;

  const a = q.data;
  const isDueTomorrow = a.dueDate === '2026-09-18';

  return (
    <Screen>
      <AppHeader title="Assignments" onBack={() => router.back()} />

      <Card style={{ backgroundColor: colors.dangerBg }}>
        <View style={styles.titleRow}>
          <View style={styles.docBadge}>
            <IconDocText size={26} color={colors.brandRed} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.titleText}>{a.title}</Text>
            <Text style={styles.titleSub}>{a.courseName}</Text>
          </View>
          {isDueTomorrow && <StatusPill label="Due Tomorrow" tone="danger" />}
        </View>
      </Card>

      <Card>
        <ListRow title="Due Date" subtitle={a.dueDate ? formatIsoDateLabel(a.dueDate) : 'No due date'} left={<IconCalendar size={22} />} />
        <ListRow title="Due Time" subtitle={a.dueTime ?? '—'} left={<IconClock size={22} />} />
        <ListRow title="Type" subtitle={a.type} left={<IconDocText size={22} />} />
        <ListRow title="Category" subtitle={a.category} left={<IconStats size={22} />} />
        <ListRow title="Points" subtitle={a.points ? `${a.points} points` : '—'} left={<IconStar size={22} />} />
        <ListRow title="Class" subtitle={a.courseName} left={<IconGradCap size={22} />} />
        <ListRow title="Teacher" subtitle={a.courseName === 'AP Chemistry' ? 'Mr. Bernard' : '—'} left={<IconPerson size={22} />} right={<IconMail size={22} />} />
      </Card>

      <Card>
        {/* Item 30: official statuses with visible source. No fake Turn In. */}
        <SectionHeader
          title="Submission Status"
          icon={<IconDocText size={20} />}
          actionLabel={a.source === 'google-classroom' ? 'Source · Google Classroom' : 'Source · District'}
        />
        <StatusPill
          label={
            a.status === 'graded'
              ? 'Graded'
              : a.status === 'submitted'
                ? 'Submitted'
                : a.status === 'missing'
                  ? 'Missing'
                  : 'Not Turned In'
          }
          tone={a.status === 'graded' || a.status === 'submitted' ? 'success' : a.status === 'missing' ? 'danger' : 'warning'}
        />
        {a.source === 'google-classroom' && (
          <>
            <Text style={styles.classroomNote}>This assignment is from Google Classroom.</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open in Google Classroom"
              style={styles.classroomButton}
              onPress={() => openExternalUrl('https://classroom.google.com')}
            >
              <View style={styles.gLogoBox}>
                <IconGoogle size={22} />
              </View>
              <Text style={styles.classroomButtonText}>Open in Google Classroom</Text>
              <Text style={styles.classroomExternal}>↗</Text>
            </Pressable>
            <Text style={styles.classroomHelp}>
              Complete and submit your work in Google Classroom. Your submission status will update here automatically.
            </Text>
          </>
        )}
      </Card>

      <Card>
        <SectionHeader title="Instructions" icon={<IconDocText size={20} />} />
        <Text style={styles.instructions}>{a.description}</Text>
      </Card>

      {a.attachments.length > 0 && (
        <Card>
          <SectionHeader title="Attachments" icon={<IconLink size={20} />} />
          {a.attachments.map((att) => (
            <Pressable
              key={att.name}
              accessibilityRole="button"
              accessibilityLabel={`Attachment ${att.name}`}
              style={styles.attachmentRow}
              onPress={() =>
                Alert.alert(att.name, 'Attachment preview arrives with the district integration — file storage is not available in the prototype.')
              }
            >
              <View style={styles.pdfBadge}>
                <Text style={styles.pdfBadgeText}>PDF</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.attachmentName}>{att.name}</Text>
                <Text style={styles.attachmentSize}>{att.size}</Text>
              </View>
              <IconDownload size={22} color={colors.textSecondary} />
            </Pressable>
          ))}
        </Card>
      )}

      <Card>
        <SectionHeader title="Class Resources" icon={<IconBook size={20} />} />
        <ListRow title="Course Links" left={<IconLink size={22} />} chevron />
        <ListRow title="Course Syllabus" left={<IconBook size={22} />} chevron />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  docBadge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: { fontSize: 20, fontWeight: '700', color: colors.text },
  titleSub: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  classroomNote: { fontSize: 14, color: colors.textSecondary, marginTop: space.md },
  classroomButton: {
    backgroundColor: colors.brandRed,
    borderRadius: radius.control,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.md,
    flexDirection: 'row',
    gap: space.sm,
  },
  gLogoBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  classroomButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  classroomExternal: { color: '#FFFFFF', fontSize: 16 },
  classroomHelp: { fontSize: 13, color: colors.textSecondary, marginTop: space.md },
  instructions: { fontSize: 15, color: colors.text, lineHeight: 22 },
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
});
