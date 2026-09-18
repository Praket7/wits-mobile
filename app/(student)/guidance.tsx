import { router } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppHeader, Card, EmptyState, ListRow, Screen, SectionHeader } from '@/components/ui';
import { IconBook, IconCalendar, IconDocText, IconGradCap, IconMail, IconPerson, IconStar } from '@/components/icons';
import { colors } from '@/design/tokens';
import { useGuidance } from '@/queries/useWits';
import { useSelectedStudentId } from '@/state/appState';
import { formatIsoDateShort } from '@/utils/format';
import { openExternalUrl } from '@/utils/openUrl';

/**
 * Guidance (item 19): a real destination — counselor contact (mock until
 * approved data), college visits with provenance (item 20), and the
 * planning/testing/service/scholarship resource sections.
 */
export default function Guidance() {
  const selectedStudentId = useSelectedStudentId();
  const guidance = useGuidance(selectedStudentId);

  const visits = (guidance.data ?? []).filter((g) => g.category.toLowerCase().includes('college'));

  const openVisit = (id: string) => {
    const g = (guidance.data ?? []).find((x) => x.id === id);
    if (!g) return;
    // Event detail with provenance (item 20). A dedicated route can replace
    // this alert when the district API supplies registration fields.
    Alert.alert(
      g.title,
      `${formatIsoDateShort(g.date)}${g.location ? ` · ${g.location}` : ''}\n\n${g.description}\n\nSource · ${g.category === 'College' ? 'Guidance Office' : g.category}\nRegistration: check with the Guidance Office\nEligible grades: 11–12`,
    );
  };

  return (
    <Screen>
      <AppHeader title="Guidance & Counseling" subtitle="Your future starts here." onBack={() => router.back()} />

      <SectionHeader title="Upcoming College Visits" icon={<IconGradCap size={20} />} />
      <Card>
        {visits.length === 0 ? (
          <EmptyState title="No upcoming visits" message="Check back for new college visits." />
        ) : (
          visits.map((g) => (
            <ListRow
              key={g.id}
              title={g.title}
              subtitle={`${formatIsoDateShort(g.date)}${g.location ? ` • ${g.location}` : ''}`}
              left={<IconGradCap size={22} />}
              chevron
              onPress={() => openVisit(g.id)}
            />
          ))
        )}
      </Card>

      <SectionHeader title="Your Counselor" icon={<IconPerson size={20} />} />
      <Card>
        {/* Mock counselor until WCSD approves real contact data (item 19). */}
        <ListRow
          title="Ms. Rivera (A–L) · Counselor"
          subtitle="Counseling Office, Room 118\narivera@williamsvillek12.org (mock)"
          left={<View style={styles.counselorAvatar}><Text style={styles.counselorInitials}>MR</Text></View>}
          right={<IconMail size={20} color={colors.brandRed} />}
          onPress={() => router.push('/(student)/(tabs)/messages' as never)}
        />
        <ListRow title="Schedule a Meeting" subtitle="Request a counselor appointment" chevron onPress={() => router.push('/(student)/(tabs)/messages' as never)} />
      </Card>

      <SectionHeader title="College Planning" icon={<IconGradCap size={20} />} />
      <Card>
        <ListRow title="Naviance" subtitle="College & career planning" chevron onPress={() => openExternalUrl('https://student.naviance.com')} />
        <ListRow title="Common App" subtitle="Apply to colleges" chevron onPress={() => openExternalUrl('https://www.commonapp.org')} />
        <ListRow title="Transcript Requests" subtitle="Request official transcripts" chevron onPress={() => openExternalUrl('https://www.parchment.com')} />
      </Card>

      <SectionHeader title="Testing" icon={<IconDocText size={20} />} />
      <Card>
        <ListRow title="PSAT/SAT Information" subtitle="Testing dates and registration" chevron onPress={() => openExternalUrl('https://satsuite.collegeboard.org')} />
        <ListRow title="ACT" subtitle="Test dates and prep" chevron onPress={() => openExternalUrl('https://www.act.org')} />
        <ListRow title="AP Exams" subtitle="Exam schedule and scores" chevron onPress={() => openExternalUrl('https://apstudents.collegeboard.org')} />
      </Card>

      <SectionHeader title="Graduation & Course Planning" icon={<IconBook size={20} />} />
      <Card>
        <ListRow title="Graduation Requirements" subtitle="Diploma options and credits" chevron onPress={() => Alert.alert('Graduation Requirements', 'Detailed planning tools arrive with the district integration.')} />
        <ListRow title="Course Catalog" subtitle="Plan next year's schedule" chevron onPress={() => Alert.alert('Course Catalog', 'The full catalog arrives with the district integration.')} />
      </Card>

      <SectionHeader title="Community Service" icon={<IconCalendar size={20} />} />
      <Card>
        <ListRow title="Service Opportunities" subtitle="Find and log volunteer hours" chevron onPress={() => Alert.alert('Community Service', 'Hour tracking arrives with the district integration.')} />
      </Card>

      <SectionHeader title="Scholarships & Financial Aid" icon={<IconStar size={20} />} />
      <Card>
        <ListRow title="Local Scholarship List" subtitle="WCSD-area scholarships" chevron onPress={() => Alert.alert('Scholarships', 'The scholarship list arrives with the district integration.')} />
        <ListRow title="FAFSA" subtitle="Free Application for Federal Student Aid" chevron onPress={() => openExternalUrl('https://studentaid.gov')} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  counselorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF0F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counselorInitials: { fontSize: 15, fontWeight: '700', color: colors.text },
});
