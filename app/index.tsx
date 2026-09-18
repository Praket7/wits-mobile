import { Redirect } from 'expo-router';
import { useSession } from '@/state/appState';

// Role-aware entry (plan item 1): send each identity to its own home instead
// of always landing on Student Today.
export default function Index() {
  const { loggedIn, role } = useSession();
  if (!loggedIn) return <Redirect href="/(auth)/login" />;
  if (role === 'parent') return <Redirect href="/(parent)/(tabs)/today" />;
  if (role === 'teacher') return <Redirect href="/(teacher)/(tabs)/today" />;
  return <Redirect href="/(student)/(tabs)/today" />;
}
