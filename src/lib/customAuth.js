// Custom auth helpers — store session in localStorage
import { base44 } from '@/api/base44Client';

const SESSION_KEY = 'ff_session';

export function saveSession(user, token) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ user, token, savedAt: Date.now() }));
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    // Expire after 7 days
    if (Date.now() - session.savedAt > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export async function callAuth(action, payload) {
  const res = await base44.functions.invoke('customAuth', { action, ...payload });
  return res.data;
}