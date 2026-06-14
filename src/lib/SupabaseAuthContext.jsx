/**
 * SupabaseAuthContext — Now wraps Base44 auth so all entity data loads correctly
 * on the published URL. base44.auth.me() returns a real Base44 session.
 * Backward-compatible: all existing useCustomAuth / useSupabaseAuth imports still work.
 */
import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const SupabaseAuthContext = createContext(null);

export const SupabaseAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    try {
      const me = await base44.auth.me();
      setUser(me ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Clear any ghost Supabase sessions from localStorage that may have persisted
    // from a previous architecture. These are no longer valid or needed.
    try {
      localStorage.removeItem('xf_supabase_session');
      localStorage.removeItem('ff_session');
    } catch { /* ignore if localStorage is unavailable */ }
    loadUser();
  }, []);

  const refreshUser = async () => {
    setLoading(true);
    try {
      const me = await base44.auth.me();
      setUser(me ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await base44.auth.logout('/');
  };

  const isAdmin = user?.role === 'admin';
  const userEmail = user?.email;
  const userId = user?.id;

  return (
    <SupabaseAuthContext.Provider value={{
      user,
      session: user ? { user } : null,
      loading,
      logout,
      refreshUser,
      isAdmin,
      userEmail,
      userId,
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

export const useCustomAuth = useSupabaseAuth;
export const CustomAuthProvider = SupabaseAuthProvider;

export default SupabaseAuthContext;