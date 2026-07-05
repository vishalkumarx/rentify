import toast from 'react-hot-toast';
import { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, getStorageJson, setStorageJson } from '../lib/supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: any | null;
  loading: boolean;
  loginAsGuest: () => void;
  updateProfile: (updates: any) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  loginAsGuest: () => {},
  updateProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const loginAsGuest = () => {
    // Mock user for development
    setUser({ email: 'guest@campusrent.app', id: 'guest-123' } as User);
    setSession({ user: { email: 'guest@campusrent.app' } } as Session);
    setProfile({ name: 'Guest User', department: 'Guest' });
  };

  const updateProfile = async (updates: any) => {
    if (!user) return;
    const profilePath = `profiles/${user.id}.json`;
    const updatedProfile = { ...profile, ...updates };
    await setStorageJson(profilePath, updatedProfile);
    setProfile(updatedProfile);
  };

  useEffect(() => {
    const checkBlocked = async (currentSession: Session) => {
      const blockedUsers = await getStorageJson('admin/blocked_users.json') || [];
      
      const isBlocked = blockedUsers.some((u: any) => {
        if (typeof u === 'string') return u === currentSession.user.id;
        if (u && u.userId === currentSession.user.id) {
          if (u.suspendedUntil) {
            return new Date().getTime() < u.suspendedUntil;
          }
          return true;
        }
        return false;
      });

      if (isBlocked) {
        toast.error('Your account has been suspended or terminated due to policy violations.');
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
      } else {
        // Ensure profile exists for live data
        const profilePath = `profiles/${currentSession.user.id}.json`;
        const existingProfile = await getStorageJson(profilePath);
        if (!existingProfile) {
          const fallbackName = currentSession.user.user_metadata?.full_name || '';
          const newProfile = {
            name: fallbackName,
            department: '',
            memberSince: new Date().getFullYear().toString(),
            verifications: ['Email Confirmed'],
            avatar_url: currentSession.user.user_metadata?.avatar_url || currentSession.user.user_metadata?.picture
          };
          await setStorageJson(profilePath, newProfile);
          setProfile(newProfile);
        } else {
          let updatedProfile = { ...existingProfile };
          let changed = false;
          
          if (!existingProfile.avatar_url && (currentSession.user.user_metadata?.avatar_url || currentSession.user.user_metadata?.picture)) {
            updatedProfile.avatar_url = currentSession.user.user_metadata?.avatar_url || currentSession.user.user_metadata?.picture;
            changed = true;
          }
          
          // Ensure department field exists
          if (updatedProfile.department === undefined) {
            updatedProfile.department = '';
            changed = true;
          }

          if (changed) {
            await setStorageJson(profilePath, updatedProfile);
          }
          setProfile(updatedProfile);
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
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, loginAsGuest, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
