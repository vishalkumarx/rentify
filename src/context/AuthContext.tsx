import { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, getStorageJson, setStorageJson } from '../lib/supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  loginAsGuest: () => void;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  loginAsGuest: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loginAsGuest = () => {
    // Mock user for development
    setUser({ email: 'guest@vicinity.app', id: 'guest-123' } as User);
    setSession({ user: { email: 'guest@vicinity.app' } } as Session);
  };

  useEffect(() => {
    const checkBlocked = async (currentSession: Session) => {
      const blockedUsers = await getStorageJson('admin/blocked_users.json') || [];
      if (blockedUsers.includes(currentSession.user.id)) {
        alert('Your account has been terminated due to policy violations.');
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
      } else {
        // Ensure profile exists for live data
        const profilePath = `profiles/${currentSession.user.id}.json`;
        const existingProfile = await getStorageJson(profilePath);
        if (!existingProfile) {
          const fallbackName = currentSession.user.user_metadata?.full_name || 'User ' + currentSession.user.id.substring(0, 5);
          await setStorageJson(profilePath, {
            name: fallbackName,
            department: 'Campus Member',
            rating: 5.0,
            memberSince: new Date().getFullYear().toString(),
            verifications: ['Email Confirmed']
          });
        }
        
        setSession(currentSession);
        setUser(currentSession.user);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        checkBlocked(session).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        checkBlocked(session);
      } else {
        setSession(null);
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, loading, loginAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
