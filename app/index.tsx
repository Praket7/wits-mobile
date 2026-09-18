import { Redirect } from 'expo-router';
import { useSession } from '@/state/appState';

export default function Index() {
  const { loggedIn } = useSession();
  if (!loggedIn) return <Redirect href="/(auth)/login" />;
  return <Redirect href="/(student)/(tabs)/today" />;
}
