import { useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * useRealtimeConnection — Institutional-grade realtime connection monitor
 * Tracks WebSocket health, auto-reconnects, and exposes connection state to UI
 */
export function useRealtimeConnection() {
  const [status, setStatus] = useState('connecting'); // 'connected' | 'connecting' | 'disconnected' | 'error'
  const [lastConnectedAt, setLastConnectedAt] = useState(null);
  const [reconnectCount, setReconnectCount] = useState(0);
  const reconnectTimerRef = useRef(null);
  const isOnlineRef = useRef(navigator.onLine);

  const handleOnline = useCallback(() => {
    isOnlineRef.current = true;
    setStatus('connecting');
    setReconnectCount(c => c + 1);
  }, []);

  const handleOffline = useCallback(() => {
    isOnlineRef.current = false;
    setStatus('disconnected');
  }, []);

  // Poll connection health via a lightweight entity read
  const checkConnection = useCallback(async () => {
    if (!isOnlineRef.current) return;
    try {
      // Lightweight probe — just read 1 notification
      await base44.entities.Notification.list('-created_date', 1);
      setStatus('connected');
      setLastConnectedAt(new Date());
    } catch {
      setStatus('error');
      // Schedule reconnect in 5 seconds
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(() => {
        setReconnectCount(c => c + 1);
      }, 5000);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkConnection();

    // Periodic health check every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, [checkConnection, handleOnline, handleOffline, reconnectCount]);

  return { status, lastConnectedAt, isConnected: status === 'connected' };
}

/**
 * ConnectionStatusBadge — Drop-in UI indicator for dashboard
 * Import and render in DashboardSidebar or DashboardHeader
 */
export function ConnectionStatusBadge({ className = '' }) {
  const { status, lastConnectedAt } = useRealtimeConnection();

  const config = {
    connected:    { color: 'bg-green-500', label: 'Live', pulse: true },
    connecting:   { color: 'bg-yellow-500', label: 'Connecting...', pulse: true },
    disconnected: { color: 'bg-red-500', label: 'Offline', pulse: false },
    error:        { color: 'bg-orange-500', label: 'Reconnecting...', pulse: true },
  }[status] || { color: 'bg-gray-500', label: 'Unknown', pulse: false };

  return (
    <div className={`flex items-center gap-1.5 text-xs ${className}`} title={lastConnectedAt ? `Last connected: ${lastConnectedAt.toLocaleTimeString()}` : ''}>
      <span className={`relative flex h-2 w-2`}>
        {config.pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.color} opacity-75`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.color}`} />
      </span>
      <span className="text-muted-foreground">{config.label}</span>
    </div>
  );
}