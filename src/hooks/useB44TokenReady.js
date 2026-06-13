/**
 * useB44TokenReady — waits for the Base44 platform access token to be present
 * in localStorage before entity queries are enabled.
 *
 * WHY THIS EXISTS:
 * The Base44 SDK authenticates entity queries using `base44_access_token` in
 * localStorage. On mobile (fresh sessions, PWA, incognito), this token is
 * written AFTER Supabase auth resolves. If a React Query fires before the
 * token exists, the SDK sends an unauthenticated request → 0 records returned
 * → empty state rendered despite valid session.
 *
 * This hook polls every 200ms until the token appears (or times out at 3s).
 */
import { useState, useEffect } from 'react';

export function useB44TokenReady() {
  const [ready, setReady] = useState(() => !!localStorage.getItem('base44_access_token'));

  useEffect(() => {
    if (ready) return; // Already present on mount — no polling needed

    const check = () => {
      if (localStorage.getItem('base44_access_token')) {
        setReady(true);
        return true;
      }
      return false;
    };

    const interval = setInterval(() => { if (check()) clearInterval(interval); }, 200);
    // Safety timeout: allow query to run after 3s regardless (avoids infinite hang)
    const timeout = setTimeout(() => { clearInterval(interval); setReady(true); }, 3000);

    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, []);

  return ready;
}