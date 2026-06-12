import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wpzgwvimupbbuflsbkvc.supabase.co';
// Real Supabase anon/public key — safe for browser (RLS enforces security)
const supabaseAnonKey = 'sb_publishable_WtyPv8akefzovYvz9hacAg__hvfbUOg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'xf_supabase_session',
  },
  realtime: {
    params: {
      eventsPerSecond: 20,
    },
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-app-name': 'xfunded-trader',
    },
  },
});

// ─── Auth helpers ────────────────────────────────────────────────────────────

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signUpWithEmail(email, password, metadata = {}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });
  return { data, error };
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/dashboard` },
  });
  return { data, error };
}

// ─── Realtime helpers ────────────────────────────────────────────────────────

/**
 * Subscribe to a table with RLS-aware realtime.
 * Requires the authenticated Supabase session to be active.
 */
export function subscribeToTable(table, filter, callback) {
  const channel = supabase
    .channel(`${table}_changes_${Date.now()}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table, filter },
      callback
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}

export default supabase;