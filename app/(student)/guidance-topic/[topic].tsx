import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { AppHeader, Card, EmptyState, ListRow, Screen, SectionHeader } from '@/components/ui';
import { IconBook, IconDocText, IconGradCap, IconStar } from '@/components/icons';
import { colors } from '@/design/tokens';
import { openExternalUrl } from '@/utils/openUrl';

/**
 * Guidance topic details (plan item 19 / §8.8): real synthetic content
 * replacing the placeholder alerts. Each topic is a small static knowledge
 * card — production visibility stays capability-driven later.
 */
type Section = { title: string; subtitle?: string; url?: string };

const TOPICS: Record<string, { title: string; intro: string; sections: Section[] }> = {
  graduation: {
    title: 'Graduation Requirements',
    intro:
      'New York State Regents diploma requirements for the Williamsville Central School District (synthetic prototype content — verify with your counselor).',
    sections: [
      { title: 'English — 4 units', subtitle: 'Regents exam required' },
      { title: 'Social Studies — 4 units', subtitle: 'Global History & US History Regents' },
      { title: 'Mathematics — 3 units', subtitle: 'One Regents exam in Algebra, Geometry, or Algebra II' },
      { title: 'Science — 3 units', subtitle: 'One Regents exam (Living Environment recommended)' },
      { title: 'World Languages — 1 unit', subtitle: 'Or a 5-unit CTE/Arts sequence' },
      { title: 'Physical Education — 2 units', subtitle: 'Every semester, not counted in the 22 total' },
      { title: 'Health — 0.5 unit', subtitle: 'Usually completed in grade 10' },
      { title: 'Electives — 3.5 units', subtitle: 'Advanced designation adds a second language unit' },
      { title: 'Total — 22 units minimum', subtitle: 'Plus service and exam requirements' },
    ],
  },
  catalog: {
    title: 'Course Catalog',
    intro:
      'Planning next year\u2019s schedule starts here. Departments and representative course sequences (synthetic prototype data).',
    sections: [
      { title: 'English', subtitle: 'English 9–12, AP Language, AP Literature, Creative Writing, Journalism' },
      { title: 'Social Studies', subtitle: 'Global/US History, AP Government, Economics, Psychology, AP African American Studies' },
      { title: 'Mathematics', subtitle: 'Algebra I/II, Geometry, Pre-Calculus, AP Calculus AB/BC, Statistics' },
      { title: 'Science', subtitle: 'Biology, Chemistry, Physics, AP Chemistry, AP Physics, Forensic Science, Anatomy' },
      { title: 'World Languages', subtitle: 'Spanish, French, German — through Level 5 and AP' },
      { title: 'Arts', subtitle: 'Studio Art, Ceramics, Band, Orchestra, Chorus, AP Art History' },
      { title: 'Career & Technical', subtitle: 'Business, Computer Science, Culinary, Project Lead the Way engineering' },
    ],
  },
  service: {
    title: 'Community Service',
    intro:
      'Volunteer hours are logged through the Guidance Office. Hour-tracking arrives with the district integration; these are good starting points (synthetic).',
    sections: [
      { title: 'Williamsville Public Libraries', subtitle: 'Shelving, tutoring, summer reading programs' },
      { title: 'Town Youth Sports', subtitle: 'Coaching assistants, scorekeeping, field setup' },
      { title: 'Senior Centers', subtitle: 'Meal assistance, technology help, visiting programs' },
      { title: 'Hospitals & Clinics', subtitle: 'Junior volunteer programs (application required)' },
      { title: 'School-Based', subtitle: 'Peer tutoring, club service projects, event volunteering' },
    ],
  },
  scholarships: {
    title: 'Scholarships & Financial Aid',
    intro:
      'The local scholarship list is published each January by the Guidance Office (synthetic prototype data). National aid links below are real resources.',
    sections: [
      { title: 'FAFSA — Free Application for Federal Student Aid', subtitle: 'studentaid.gov', url: 'https://studentaid.gov' },
      { title: 'NYS Tuition Assistance Program (TAP)', subtitle: 'hesc.ny.gov', url: 'https://www.hesc.ny.gov' },
      { title: 'Excelsior Scholarship', subtitle: 'hesc.ny.gov/excelsior', url: 'https://www.hesc.ny.gov' },
      { title: 'BigFuture Scholarship Search', subtitle: 'bigfuture.collegeboard.org', url: 'https://bigfuture.collegeboard.org' },
      { title: 'Local Scholarship List', subtitle: 'Published January — check with the Guidance Office' },
    ],
  },
};

export default function GuidanceTopic() {
  const { topic } = useLocalSearchParams<{ topic: string }>();
  const data = topic ? TOPICS[topic] : undefined;

  if (!data) {
    return (
      <Screen>
        <AppHeader title="Guidance" onBack={() => router.back()} />
        <EmptyState title="Topic not found" message="This guidance resource does not exist." />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title={data.title} subtitle="Guidance & Counseling" onBack={() => router.back()} />
      <Card>
        <Text style={styles.intro}>{data.intro}</Text>
      </Card>
      <SectionHeader title="Details" icon={topic === 'graduation' ? <IconGradCap size={20} /> : topic === 'catalog' ? <IconBook size={20} /> : topic === 'service' ? <IconDocText size={20} /> : <IconStar size={20} />} />
      <Card>
        {data.sections.map((s) =>
          s.url ? (
            <ListRow
              key={s.title}
              title={s.title}
              subtitle={s.subtitle}
              chevron
              onPress={() => openExternalUrl(s.url as string).catch(() => {})}
            />
          ) : (
            <ListRow key={s.title} title={s.title} subtitle={s.subtitle} />
          ),
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: 15, lineHeight: 22, color: colors.text },
});
