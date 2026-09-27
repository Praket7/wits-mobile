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
import { DATA_SOURCE } from '@/config/env';

// These IDs are synthetic identities used only by mock mode. HTTP mode uses
// the identity returned by the authenticated district API.
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
  signIn: () => Promise<Role>;
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
    if (DATA_SOURCE === 'http') {
      const unsubscribe = authController.subscribe((auth) => {
        if (auth.status === 'signed-out') {
          setLoggedIn(false);
          queryClient.clear();
        }
      });
      void authController.restore().then(async () => {
        const auth = authController.getState();
        if (auth.status === 'signed-in') {
          const nextRole = auth.user.role;
          setLoggedIn(true);
          setRoleState(nextRole);
          setUserId(auth.user.id);
          if (nextRole === 'student') setSelectedStudentIdState(auth.user.id);
          else if (nextRole === 'parent') {
            const children = await repository.getStudents().catch(() => []);
            setSelectedStudentIdState(children[0]?.id);
          } else setSelectedStudentIdState(undefined);
        }
        setHydrated(true);
      }).catch(() => setHydrated(true));
      return unsubscribe;
    }
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
  }, [queryClient]);

  /**
   * Dev role switch (plan items 1 + 4): update identity, purge every cached
   * query so nothing from the previous role leaks, then hard-navigate to the
   * new role's home so the user can never remain inside another role's routes.
   * In mock mode this also updates the repository's session actor — the
   * prototype stand-in for the bearer-derived identity (security pass).
   */
  const setRole = useCallback(
    (r: Role) => {
      if (DATA_SOURCE === 'http') return;
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
   * data is never on screen or in cache when the new child renders.
   */
  const setSelectedStudentId = useCallback(
    (id: string) => {
      setSelectedStudentIdState(id);
      if (DATA_SOURCE !== 'http') AsyncStorage.setItem(STUDENT_KEY, id).catch(() => {});
      void queryClient.cancelQueries();
      queryClient.clear();
    },
    [queryClient],
  );

  /**
   * Sign-in (security pass): delegates to the AuthController, which sequences
   * provider sign-in → GET /me → authenticated GET /capabilities, then marks
   * the local session. Demo provider resolves instantly (synthetic sign-in).
   */
  const signIn = useCallback(async () => {
    try {
      await authController.signIn();
        const auth = authController.getState();
        if (DATA_SOURCE === 'http' && auth.status === 'signed-in') {
          setRoleState(auth.user.role);
          setUserId(auth.user.id);
          if (auth.user.role === 'student') setSelectedStudentIdState(auth.user.id);
          else if (auth.user.role === 'parent') {
            const children = await repository.getStudents();
            setSelectedStudentIdState(children[0]?.id);
          } else setSelectedStudentIdState(undefined);
        }
        setLoggedIn(true);
        if (DATA_SOURCE !== 'http') AsyncStorage.setItem(LOGGED_IN_KEY, '1').catch(() => {});
        return DATA_SOURCE === 'http' && auth.status === 'signed-in' ? auth.user.role : role;
    } catch (error) {
      setLoggedIn(false);
      throw error;
    }
  }, [role]);

  /**
   * Close local access and clear cached data before best effort provider
   * cleanup. The controller resets capabilities before token revocation.
   */
  const signOut = useCallback(() => {
    setLoggedIn(false);
    if (DATA_SOURCE !== 'http') AsyncStorage.setItem(LOGGED_IN_KEY, '0').catch(() => {});
    void queryClient.cancelQueries();
    queryClient.clear();
    void authController.signOut().catch(() => {});
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
