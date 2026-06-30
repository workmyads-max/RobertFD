import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * ErrorBoundary - catches render errors in its subtree and shows a clean,
 * branded fallback instead of a blank screen. Provides manual Reload + Home.
 *
 * Reset behavior: pass a changing `resetKey` prop (e.g. the active page key) so
 * navigating to a different view automatically clears a previous error.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught render error:', error, info?.componentStack);
  }

  componentDidUpdate(prevProps) {
    // Auto-reset when the resetKey changes (e.g. user navigates to another tab)
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-[60vh] w-full flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center rounded-2xl p-8"
          style={{ background: 'rgba(10,11,20,0.98)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(255,92,0,0.08)', border: '1px solid rgba(255,92,0,0.2)' }}>
            <AlertTriangle className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mb-7 leading-relaxed">
            This section ran into an unexpected error. Your data is safe - try reloading the page.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: '#FF5C00' }}>
              <RefreshCw className="w-4 h-4" /> Reload
            </button>
            <a href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-foreground"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Home className="w-4 h-4" /> Go to Home
            </a>
          </div>
        </div>
      </div>
    );
  }
}