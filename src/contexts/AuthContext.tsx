import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

// User shape matches our Database Schema
interface AppUser {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'hod';
  department?: string;
  enrollmentNumber?: string;
  year?: number;
  division?: 'A' | 'B';
  batch?: 'A' | 'B' | 'C';
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: any }>;
  signup: (
    email: string,
    password: string,
    name: string,
    role: string,
    division?: string,
    batch?: string
  ) => Promise<{ error: any }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id, session.user.email!);
      else setLoading(false);
    });

    // 2. Listen for login/logout/signup events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email!);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Helper: Fetch extra details (Role, Dept) from 'profiles' table
  async function fetchProfile(userId: string, email: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
        // setUser({
        //   id: userId,
        //   email,
        //   name: 'New User',
        //   role: 'student'
        // });
      } else {
        // Map DB snake_case to App camelCase
        setUser({
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role,
          department: data.department,
          enrollmentNumber: data.enrollment_number,
          year: data.year,
          division: data.division,
          batch: data.batch
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Actions
  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (data.user) {
      fetchProfile(data.user.id, data.user.email!)
      window.location.href = '/dashboard';

    };
    return { error };
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    role: string,
    division?: string,
    batch?: string
  ) => {
    // Pass metadata to SQL Trigger
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
          department: 'Computer Engineering',
          division,
          batch
        },
      },
    });
    return { error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}