/**
 * customAuth.js — Auth utility layer.
 * Now routes through supabaseAuthBridge which issues real Supabase JWTs.
 * Session is managed entirely by the Supabase SDK (no manual localStorage needed).
 */
import { base44 } from '@/api/base44Client';
import { supabase } from '@/lib/supabaseClient';

// Legacy session helpers kept for safety — Supabase SDK handles persistence now
const SESSION_KEY = 'ff_session';
export function saveSession(user, token) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ user, token, savedAt: Date.now() }));
}
export function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (Date.now() - session.savedAt > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch { return null; }
}
export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// All auth calls now go through the Supabase-native bridge
export async function callAuth(action, payload) {
  try {
    const res = await base44.functions.invoke('supabaseAuthBridge', { action, ...payload });
    // base44.functions.invoke returns Axios response: {data, status, headers}
    // The backend response is in res.data
    const backendResponse = res.data || {};
    // Check if response contains an error field
    if (backendResponse.error) {
      console.error('Auth error from server:', backendResponse.error);
    }
    return backendResponse;
  } catch (error) {
    console.error('callAuth error:', error);
    return { error: error.message || 'Request failed' };
  }
}

/**
 * After OTP verification, sign in to Supabase Auth to get a real JWT.
 * This is what makes RLS work on the frontend.
 */
export async function signInToSupabase(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}