import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

// Frontend client (publishable key only - safe for browser)
const supabaseUrl = 'https://wpzgwvimupbbuflsbkvc.supabase.co';
const supabasePublishableKey = 'sb_publishable_WtyPv8akefzovYvz9hacAg__hvfbUOg';

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Helper to get current user
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Helper to get session
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// Helper to sign out
export async function signOut() {
  await supabase.auth.signOut();
}

// Helper to sign in with email/password
export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

// Helper to sign up
export async function signUpWithEmail(email, password, metadata = {}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
  return { data, error };
}

// Helper for Google OAuth
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    },
  });
  return { data, error };
}

export default supabase;