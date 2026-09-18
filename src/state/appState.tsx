import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import type { Role } from '@/domain/schemas';

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
  student: 'stu-praket',
  parent: 'par-gauri',
  teacher: 'tea-bernard',
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
    'stu-praket',
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
   */
  const setRole = useCallback(
    (r: Role) => {
      setRoleState(r);
      setUserId(DEFAULT_IDS[r]);
      AsyncStorage.setItem(ROLE_KEY, r).catch(() => {});
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

  const signIn = useCallback(() => {
    setLoggedIn(true);
    AsyncStorage.setItem(LOGGED_IN_KEY, '1').catch(() => {});
  }, []);

  const signOut = useCallback(() => {
    setLoggedIn(false);
    AsyncStorage.setItem(LOGGED_IN_KEY, '0').catch(() => {});
    // Never keep cached school data across sessions.
    queryClient.removeQueries();
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

  if (!hydrated) return null;

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

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
