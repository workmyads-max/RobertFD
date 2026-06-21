/**
 * CustomAuthContext.jsx — Backward-compatibility re-export.
 * All auth is now handled by AuthContext (custom Base44 auth).
 * This file exists so existing imports of useCustomAuth/CustomAuthProvider keep working.
 */
export {
  AuthProvider as CustomAuthProvider,
  useAuth as useCustomAuth,
  useAuth,
  AuthProvider,
} from '@/lib/AuthContext';