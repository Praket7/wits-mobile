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
import type { Role } from '@/domain/schemas';

type Session = {
  loggedIn: boolean;
  role: Role;
  selectedStudentId: string;
  setRole: (r: Role) => void;
  setSelectedStudentId: (id: string) => void;
  signIn: () => void;
  signOut: () => void;
};

const SessionContext = createContext<Session | null>(null);

const ROLE_KEY = 'wits.role';
const STUDENT_KEY = 'wits.selected-student';
const LOGGED_IN_KEY = 'wits.logged-in';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRoleState] = useState<Role>('student');
  const [selectedStudentId, setSelectedStudentIdState] = useState('stu-praket');
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
        if (r === 'parent' || r === 'teacher' || r === 'student') setRoleState(r);
        if (s) setSelectedStudentIdState(s);
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  const setRole = useCallback((r: Role) => {
    setRoleState(r);
    AsyncStorage.setItem(ROLE_KEY, r).catch(() => {});
  }, []);

  const setSelectedStudentId = useCallback((id: string) => {
    setSelectedStudentIdState(id);
    AsyncStorage.setItem(STUDENT_KEY, id).catch(() => {});
    queryClient.invalidateQueries({ queryKey: ['today'] });
    queryClient.invalidateQueries({ queryKey: ['courses'] });
    queryClient.invalidateQueries({ queryKey: ['assignments'] });
    queryClient.invalidateQueries({ queryKey: ['grades'] });
    queryClient.invalidateQueries({ queryKey: ['attendance'] });
    queryClient.invalidateQueries({ queryKey: ['calendar'] });
  }, [queryClient]);

  const signIn = useCallback(() => {
    setLoggedIn(true);
    AsyncStorage.setItem(LOGGED_IN_KEY, '1').catch(() => {});
  }, []);

  const signOut = useCallback(() => {
    setLoggedIn(false);
    AsyncStorage.setItem(LOGGED_IN_KEY, '0').catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ loggedIn, role, selectedStudentId, setRole, setSelectedStudentId, signIn, signOut }),
    [loggedIn, role, selectedStudentId, setRole, setSelectedStudentId, signIn, signOut]
  );

  if (!hydrated) return null;

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
