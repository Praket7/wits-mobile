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
import { friendlyError } from '@/utils/errors';
import { useAssignment, useCourses } from '@/queries/useWits';
import { useSelectedStudentId } from '@/state/appState';
import { courseTeacherLabel, dueLabel, formatIsoDateLabel } from '@/utils/format';
import { openExternalUrl, openMailto } from '@/utils/openUrl';

export default function AssignmentDetail() {
  const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>();
  const q = useAssignment(assignmentId);
  // Teacher contact resolves from the course record (audit P1) — never a
  // screen-local course-name → teacher mapping.
  const selectedStudentId = useSelectedStudentId();
  const courses = useCourses(selectedStudentId);

  if (q.isLoading) return <Screen><EmptyState title="Loading…" /></Screen>;
  if (q.isError || !q.data) return <Screen><ErrorState message={friendlyError(q.error).body} /></Screen>;

  const a = q.data;
  // "Due Tomorrow" derives from the app clock (audit P1) — not a fixture
  // date literal, so HTTP mode against real data still labels correctly.
  const isDueTomorrow = dueLabel(a.dueDate) === 'Due Tomorrow';
  const course = (courses.data ?? []).find((c) => c.id === a.courseId);
  const teacherName = course ? courseTeacherLabel(course.teacher) : null;
  const teacherEmail = course?.teacherEmail ?? null;

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
        <ListRow title="Teacher" subtitle={teacherName ?? '—'} left={<IconPerson size={22} />} right={<IconMail size={22} />} onPress={teacherEmail ? () => void openMailto(teacherEmail) : undefined} />
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
        {/* Audit P1: no dead rows — course-level links/syllabus navigate to the
            real resources screen; a per-course syllabus document needs district
            data and stays hidden rather than showing a fake chevron. */}
        <ListRow
          title="Course Links"
          left={<IconLink size={22} />}
          chevron
          onPress={() => router.push('/(student)/resources' as never)}
        />
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
