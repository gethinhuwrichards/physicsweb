import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile from Supabase
  const fetchProfile = useCallback(async (userId) => {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (!error && data) {
      setProfile(data);
    }
    return data;
  }, []);

  // Initialize: restore session
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          fetchProfile(s.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // Sign up with email/password
  const signUp = useCallback(async (email, password, metadata = {}) => {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: metadata.displayName || '',
          year_group: metadata.yearGroup || '',
          exam_board: metadata.examBoard || '',
          school_name: metadata.schoolName || '',
          target_grade: metadata.targetGrade || '',
        },
      },
    });
    if (error) throw error;

    // Update profile with additional metadata after signup
    if (data.user) {
      const updates = {};
      if (metadata.yearGroup) updates.year_group = parseInt(metadata.yearGroup);
      if (metadata.examBoard) updates.exam_board = metadata.examBoard;
      if (metadata.schoolName) updates.school_name = metadata.schoolName;
      if (metadata.targetGrade) updates.target_grade = metadata.targetGrade;
      if (metadata.displayName) updates.display_name = metadata.displayName;

      if (Object.keys(updates).length > 0) {
        // Retry the profile update — the session may take a moment to propagate
        for (let attempt = 0; attempt < 3; attempt++) {
          if (attempt > 0) await new Promise((r) => setTimeout(r, 500));
          const { error: updateError } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', data.user.id);
          if (!updateError) break;
        }
      }

      await fetchProfile(data.user.id);
    }

    return data;
  }, [fetchProfile]);

  // Sign in with email/password
  const signIn = useCallback(async (email, password) => {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }, []);

  // Sign in with Google OAuth
  const signInWithGoogle = useCallback(async () => {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    return data;
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
    setSession(null);
  }, []);

  // Update profile
  const updateProfile = useCallback(async (updates) => {
    if (!supabase) throw new Error('Supabase not configured');
    if (!user) throw new Error('Not authenticated');
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (error) throw error;
    await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
    fetchProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
