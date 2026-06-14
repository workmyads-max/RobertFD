/**
 * customAuth.js — Auth utility layer (Base44 only).
 * Provides callAuth() for the ForgotPassword password reset flow.
 * Routes through supabaseAuthBridge which now uses Base44 Auth exclusively.
 */
import { base44 } from '@/api/base44Client';

export async function callAuth(action, payload) {
  try {
    const res = await base44.functions.invoke('supabaseAuthBridge', { action, ...payload });
    const backendResponse = res.data || {};
    return backendResponse;
  } catch (error) {
    console.error('callAuth error:', error);
    return { error: error.message || 'Request failed' };
  }
}