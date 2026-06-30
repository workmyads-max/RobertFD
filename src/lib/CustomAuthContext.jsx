/**
 * CustomAuthContext.jsx - Backward-compatibility re-export.
 * All auth is handled by AuthContext (Base44 custom auth with OTP verification).
 * This file exists so existing imports of useCustomAuth/CustomAuthProvider keep working.
 */
export {
  AuthProvider as CustomAuthProvider,
  useAuth as useCustomAuth,
  useAuth,
  AuthProvider,
} from '@/lib/AuthContext';