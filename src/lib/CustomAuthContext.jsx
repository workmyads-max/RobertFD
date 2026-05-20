/**
 * CustomAuthContext.jsx — Backward-compatibility re-export.
 * All auth is now handled by SupabaseAuthContext (real Supabase JWTs).
 * This file exists so existing imports of useCustomAuth/CustomAuthProvider keep working.
 */
export {
  SupabaseAuthProvider as CustomAuthProvider,
  useSupabaseAuth as useCustomAuth,
  useSupabaseAuth,
  SupabaseAuthProvider,
} from '@/lib/SupabaseAuthContext';