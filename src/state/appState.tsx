import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import type { Role } from '@/domain/schemas';
import { authController } from '@/auth/AuthController';
import { asDemoControls } from '@/data/repository';
import { repository } from '@/data/mockRepository';

// Prototype identity (plan item 4). Production replaces this with the SSO/API
// identity: role is derived server-side, never chosen locally.
export type Identity = {
  loggedIn: boolean;
  userId: string;
  role: Role;
  selectedStudentId?: string;
};

type Session = Identity & {
  /** Prototype/dev only: switch role and immediately navigate to its home. */
  setRole: (r: Role) => void;
  /** Parent: atomically switch the viewed child and purge that child's queries. */
  setSelectedStudentId: (id: string) => void;
  signIn: () => void;
  signOut: () => void;
};

const SessionContext = createContext<Session | null>(null);

const ROLE_KEY = 'wits.role';
const STUDENT_KEY = 'wits.selected-student';
const LOGGED_IN_KEY = 'wits.logged-in';

const DEFAULT_IDS: Record<Role, string> = {
  student: 'stu-alex',
  parent: 'par-williams',
  teacher: 'tea-morgan',
};

const HOME: Record<Role, `/(student)/(tabs)/today` | `/(parent)/(tabs)/today` | `/(teacher)/(tabs)/today`> = {
  student: '/(student)/(tabs)/today',
  parent: '/(parent)/(tabs)/today',
  teacher: '/(teacher)/(tabs)/today',
};

/** Every query key whose payload is specific to one child (plan item 14). */
const CHILD_SCOPED_PREFIXES = [
  ['today'],
  ['courses'],
  ['course'],
  ['assignments'],
  ['assignment'],
  ['grades'],
  ['attendance'],
  ['calendar'],
  ['guidance'],
] as const;

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRoleState] = useState<Role>('student');
  const [userId, setUserId] = useState<string>(DEFAULT_IDS.student);
  const [selectedStudentId, setSelectedStudentIdState] = useState<string | undefined>(
    'stu-alex',
  );
  const [hydrated, setHydrated] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(LOGGED_IN_KEY),
      AsyncStorage.getItem(ROLE_KEY),
      AsyncStorage.getItem(STUDENT_KEY),
    ])
      .then(([li, r, s]) => {
        if (li === '1') setLoggedIn(true);
        if (r === 'parent' || r === 'teacher' || r === 'student') {
          setRoleState(r);
          setUserId(DEFAULT_IDS[r]);
        }
        if (s) setSelectedStudentIdState(s);
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  /**
   * Dev role switch (plan items 1 + 4): update identity, purge every cached
   * query so nothing from the previous role leaks, then hard-navigate to the
   * new role's home so the user can never remain inside another role's routes.
   * In mock mode this also updates the repository's session actor — the
   * prototype stand-in for the bearer-derived identity (security pass).
   */
  const setRole = useCallback(
    (r: Role) => {
      setRoleState(r);
      setUserId(DEFAULT_IDS[r]);
      AsyncStorage.setItem(ROLE_KEY, r).catch(() => {});
      asDemoControls(repository)?.setActor({ userId: DEFAULT_IDS[r], role: r });
      queryClient.removeQueries(); // prototype-only: mock data, cheap to refetch
      router.replace(HOME[r]);
    },
    [queryClient],
  );

  /**
   * Atomic child switch (plan item 14): update the selected id, then remove —
   * not just invalidate — every child-scoped query so the previous child's
   * data is never on screen (or in cache) when the new child renders. With
   * real PII later, removeQueries also drops it from memory entirely.
   */
  const setSelectedStudentId = useCallback(
    (id: string) => {
      setSelectedStudentIdState(id);
      AsyncStorage.setItem(STUDENT_KEY, id).catch(() => {});
      for (const prefix of CHILD_SCOPED_PREFIXES) {
        queryClient.removeQueries({ queryKey: prefix });
      }
    },
    [queryClient],
  );

  /**
   * Sign-in (security pass): delegates to the AuthController, which sequences
   * provider sign-in → GET /me → authenticated GET /capabilities, then marks
   * the local session. Demo provider resolves instantly (synthetic sign-in).
   */
  const signIn = useCallback(() => {
    void authController
      .signIn()
      .then(() => {
        setLoggedIn(true);
        AsyncStorage.setItem(LOGGED_IN_KEY, '1').catch(() => {});
      })
      .catch(() => {
        // Sign-in failed: stay signed out. The OIDC phase surfaces provider
        // errors here; the demo provider cannot fail.
      });
  }, []);

  /**
   * Sign-out: provider cleanup (later: token revocation + SecureStore wipe),
   * fail-closed capabilities via the controller, then purge every cached
   * query — school data never survives a session (privacy requirement).
   */
  const signOut = useCallback(() => {
    void authController
      .signOut()
      .catch(() => {
        // Sign-out must always complete locally, even if the provider fails.
      })
      .finally(() => {
        setLoggedIn(false);
        AsyncStorage.setItem(LOGGED_IN_KEY, '0').catch(() => {});
        queryClient.removeQueries();
      });
  }, [queryClient]);

  const value = useMemo<Session>(
    () => ({
      loggedIn,
      userId,
      role,
      selectedStudentId,
      setRole,
      setSelectedStudentId,
      signIn,
      signOut,
    }),
    [loggedIn, userId, role, selectedStudentId, setRole, setSelectedStudentId, signIn, signOut],
  );

  // Branded loading state instead of null (item 223): prevents a blank flash
  // during startup while session/role/child hydrate (item 222).
  if (!hydrated) {
    return (
      <View style={styles.launchWrap}>
        <ActivityIndicator size="large" color="#C8102E" />
        <Text style={styles.launchText}>Williamsville CSD</Text>
      </View>
    );
  }

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

const styles = StyleSheet.create({
  launchWrap: {
    flex: 1,
    backgroundColor: '#F7F8FA',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  launchText: {
    color: '#C8102E',
    fontWeight: '800',
    fontSize: 17,
    letterSpacing: 1.2,
  },
});

export function useSession(): Session {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}

/**
 * Screen-facing hook for child-scoped data: always yields a concrete student
 * id (defaulting to the prototype's primary student). Screens should read data
 * through this, not through raw useSession(), so the optional selectedStudentId
 * stays an internal concern of the session state.
 */
export function useSelectedStudentId(): string {
  const { selectedStudentId } = useSession();
  return selectedStudentId ?? DEFAULT_IDS.student;
}
