import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppHeader, Card, EmptyState, ListRow, Screen, SectionHeader, StatusPill } from '@/components/ui';
import { IconDocText, IconCheckCircle } from '@/components/icons';
import { colors, space } from '@/design/tokens';
import { useForms, useSignForm } from '@/queries/useWits';
import { useSelectedStudentId } from '@/state/appState';
import { getCapabilities } from '@/config/capabilities';
import { friendlyError } from '@/utils/errors';
import { formatIsoDateShort } from '@/utils/format';

/**
 * Forms & signatures (plan §9.5): permission slips, acknowledgements, RSVPs.
 * Demo writes sign against the in-memory database; production hides this
 * screen until the forms capability is approved by WCSD.
 */
export default function ParentForms() {
  const selectedStudentId = useSelectedStudentId();
  const forms = useForms(selectedStudentId);
  const sign = useSignForm();
  const caps = getCapabilities();

  if (!caps.forms) {
    return (
      <Screen>
        <AppHeader title="Forms" subtitle="School forms & signatures" onBack={() => router.back()} />
        <EmptyState
          title="Not available yet"
          message="Form signing requires district approval and will arrive with WCSD integration."
        />
      </Screen>
    );
  }

  const awaiting = (forms.data ?? []).filter((f) => f.status === 'awaiting-signature');
  const signed = (forms.data ?? []).filter((f) => f.status === 'signed');

  return (
    <Screen>
      <AppHeader title="Forms" subtitle="School forms & signatures" onBack={() => router.back()} />

      <SectionHeader title="Awaiting Signature" icon={<IconDocText size={20} />} />
      {forms.isLoading ? (
        <Card>
          <Text style={styles.loading}>Loading…</Text>
        </Card>
      ) : forms.isError ? (
        <Card>
          <Text style={styles.loading}>{friendlyError(forms.error).body}</Text>
        </Card>
      ) : awaiting.length === 0 ? (
        <Card>
          <View style={styles.allSet}>
            <IconCheckCircle size={22} />
            <Text style={styles.allSetText}>All forms are signed.</Text>
          </View>
        </Card>
      ) : (
        awaiting.map((f) => (
          <Card key={f.id}>
            <Text style={styles.formTitle}>{f.title}</Text>
            <Text style={styles.formSchool}>{f.school}</Text>
            {f.dueDate ? (
              <Text style={styles.formDue}>Due {formatIsoDateShort(f.dueDate)}</Text>
            ) : null}
            <Text style={styles.formDesc}>{f.description}</Text>
            <View style={styles.actions}>
              <StatusPill label="Awaiting signature" tone="warning" />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Sign ${f.title}`}
                onPress={() => sign.mutate(f.id)}
                disabled={sign.isPending}
                style={({ pressed }) => [styles.signButton, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.signButtonText}>{sign.isPending ? 'Signing…' : 'Sign Form'}</Text>
              </Pressable>
            </View>
          </Card>
        ))
      )}

      {signed.length > 0 && (
        <>
          <SectionHeader title="Signed" icon={<IconCheckCircle size={20} />} />
          <Card>
            {signed.map((f) => (
              <ListRow key={f.id} title={f.title} subtitle={f.signedAt ? `Signed ${formatIsoDateShort(f.signedAt)}` : 'Signed'} />
            ))}
          </Card>
        </>
      )}

      <Card style={{ backgroundColor: colors.warningBg }}>
        <Text style={styles.demoNote}>Demo data — form writes are synthetic until WCSD approves form submission.</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  formTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  formSchool: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  formDue: { fontSize: 13, color: colors.warning, fontWeight: '600', marginTop: space.xs },
  formDesc: { fontSize: 14, lineHeight: 20, color: colors.text, marginTop: space.sm },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.md },
  signButton: {
    backgroundColor: colors.brandRed,
    borderRadius: 10,
    paddingHorizontal: 18,
    minHeight: 44,
    justifyContent: 'center',
  },
  signButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  allSet: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.xs },
  allSetText: { fontSize: 15, color: colors.text, fontWeight: '600' },
  demoNote: { fontSize: 13, color: colors.warning, lineHeight: 18 },
  loading: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', paddingVertical: space.md },
});
