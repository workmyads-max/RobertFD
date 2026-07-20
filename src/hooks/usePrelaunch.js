import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { getLaunchDate } from '@/lib/launchConfig';

/**
 * Decides whether the public home page should show the "Coming Soon" screen.
 * - Logged-in users (or admins) always bypass the gate and see the real site.
 * - Once the current time passes the launch datetime, the gate opens for everyone.
 * - `now` ticks every second so the flip happens automatically while the page is open.
 */
export function usePrelaunch() {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const launchMs = getLaunchDate().getTime();
  const launched = now >= launchMs;

  // While auth is still loading we can't decide yet (avoid flashing coming-soon
  // to a logged-in user). Once resolved: gate only for logged-out, pre-launch visitors.
  const showComingSoon = !isLoadingAuth && !isAuthenticated && !launched;

  return { showComingSoon, now, launchMs, isLoading: isLoadingAuth };
}