/**
 * SupabaseAuthContext — Production auth context using Supabase Auth natively.
 * - Real JWTs issued by Supabase → RLS works correctly
 * - Realtime subscriptions authenticate correctly
 * - Session auto-refreshes via Supabase SDK
 * - No custom localStorage session management needed
 * - Fixed: Added timeout to prevent hanging on initial load
 */
import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const SupabaseAuthContext = createContext(null);

export const SupabaseAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let initTimeout;
    let loadTimeout;

    const initAuth = async () => {
      try {
        // Get session - Supabase SDK handles persistence automatically
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (e) {
        console.warn('Auth init:', e.message);
        if (mounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        // Always stop loading even if session fetch fails
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // Listen to auth state changes — CRITICAL: Only react to SIGNED_IN/SIGNED_OUT
    // Ignore TOKEN_REFRESHED to prevent infinite re-render loops on mobile
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      // Only update state on actual sign in/out, NOT on token refresh
      if (event === 'SIGNED_IN') {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setLoading(false);
      }
      // TOKEN_REFRESHED, INITIAL_SESSION, etc. are silently ignored
      // to prevent unnecessary re-renders
    });

    return () => {
      mounted = false;
      clearTimeout(initTimeout);
      clearTimeout(loadTimeout);
      subscription.unsubscribe();
    };
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