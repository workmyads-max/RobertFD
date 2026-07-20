import React from 'react';
import Home from '@/pages/Home';
import ComingSoon from '@/pages/ComingSoon';
import { usePrelaunch } from '@/hooks/usePrelaunch';

/**
 * Wraps the public "/" route. Shows the "Coming Soon" screen for logged-out
 * visitors before the configured launch datetime; otherwise renders the real
 * home page. Logged-in users always see the real site.
 */
export default function PrelaunchGate() {
  const { showComingSoon, now, launchMs, isLoading } = usePrelaunch();

  if (isLoading) {
    return <div className="min-h-screen" style={{ background: 'hsl(0 0% 4%)' }} />;
  }

  return showComingSoon ? <ComingSoon now={now} launchMs={launchMs} /> : <Home />;
}