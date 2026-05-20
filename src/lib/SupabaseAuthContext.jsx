/**
 * SupabaseAuthContext — Production auth context using Supabase Auth natively.
 * - Real JWTs issued by Supabase → RLS works correctly
 * - Realtime subscriptions authenticate correctly
 * - Session auto-refreshes via Supabase SDK
 * - No custom localStorage session management needed
 */
import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const SupabaseAuthContext = createContext(null);

export const SupabaseAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load initial session from Supabase (persisted in localStorage by SDK)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen to all auth state changes (login, logout, token refresh, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    window.location.href = '/';
  };

  // Helpers for components
  const isAdmin = user?.user_metadata?.role === 'admin' || user?.app_metadata?.role === 'admin';
  const userEmail = user?.email;
  const userId = user?.id;

  return (
    <SupabaseAuthContext.Provider value={{
      user,
      session,
      loading,
      logout,
      isAdmin,
      userEmail,
      userId,
      supabase,
    }}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};

export const useSupabaseAuth = () => {
  const ctx = useContext(SupabaseAuthContext);
  if (!ctx) throw new Error('useSupabaseAuth must be used within SupabaseAuthProvider');
  return ctx;
};

// Backward-compatible alias so existing components using useCustomAuth keep working
export const useCustomAuth = useSupabaseAuth;
export const CustomAuthProvider = SupabaseAuthProvider;

export default SupabaseAuthContext;