import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader, AlertCircle, Eye, EyeOff, Shield } from 'lucide-react';
import XFLogo from '@/components/shared/XFLogo';
import { callAuth } from '@/lib/customAuth';
import { signInWithGoogle, supabase } from '@/lib/supabaseClient';
import ForgotPassword from './ForgotPassword';

const AuthCard = ({ children }) => (
  <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      <div className="absolute inset-0 circuit-bg opacity-30" />
    </div>
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md relative z-10">
      <div className="flex justify-center mb-10">
        <XFLogo size="md" animate />
      </div>
      <div className="rounded-2xl p-8"
        style={{
          background: 'linear-gradient(135deg,rgba(255,92,0,0.06),rgba(204,255,0,0.02))',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}>
        {children}
      </div>
      <div className="flex items-center justify-center gap-2 mt-6">
        <Shield className="w-3 h-3 text-muted-foreground/50" />
        <p className="text-center text-xs text-muted-foreground/50">Protected by enterprise-grade security</p>
      </div>
    </motion.div>
  </div>
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    await signInWithGoogle();
    // Page will redirect
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('Attempting login for:', email);
    const res = await callAuth('login', { email, password });
    console.log('Login response:', res);
    setLoading(false);

    if (res.error) {
      setError(res.error);
      return;
    }

    // Direct session - no OTP step
    if (res.session?.access_token && res.session?.refresh_token) {
      console.log('Setting session...');
      const { error: sessionErr } = await supabase.auth.setSession({
        access_token: res.session.access_token,
        refresh_token: res.session.refresh_token,
      });
      if (sessionErr) {
        console.error('Session setup failed:', sessionErr);
        setError('Session setup failed: ' + sessionErr.message);
        return;
      }
      console.log('Session set, redirecting...');
      window.location.href = '/dashboard';
      return;
    }

    console.error('No session in response');
    setError('Login failed. Please try again.');
  };

  if (showForgot) {
    return (
      <AuthCard>
        <ForgotPassword onBack={() => setShowForgot(false)} />
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-foreground mb-2">Welcome Back</h1>
        <p className="text-sm text-muted-foreground">Sign in to your trading account</p>
      </div>

      {/* Google Login */}
      <motion.button
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-semibold text-foreground border border-white/15 hover:border-white/30 hover:bg-white/5 transition-all mb-5 disabled:opacity-50"
        style={{ background: 'rgba(255,255,255,0.04)' }}
      >
        {googleLoading ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.8 2.2 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.9 6.1C12.5 13 17.8 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8C43.8 37.4 46.5 31.4 46.5 24.5z"/>
            <path fill="#FBBC05" d="M10.5 28.6A14.8 14.8 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6L2.4 13.3A23.9 23.9 0 0 0 0 24c0 3.8.9 7.4 2.6 10.5l7.9-5.9z"/>
            <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.7 2.3-7.7 2.3-6.2 0-11.5-4.2-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/>
          </svg>
        )}
        Continue with Google
      </motion.button>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs text-muted-foreground/50 font-mono uppercase tracking-widest">or</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      <form onSubmit={handleLogin} className="space-y-5 mb-6">
        <div>
          <label className="text-xs font-mono text-muted-foreground mb-2 block uppercase tracking-wider">Email</label>
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required
              className="w-full rounded-xl px-4 py-3 pl-10 text-sm text-foreground outline-none transition-all border border-white/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Password</label>
            <button type="button" onClick={() => setShowForgot(true)}
              className="text-xs text-primary hover:text-primary/80 transition-colors font-medium">
              Forgot password?
            </button>
          </div>
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
            <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required
              className="w-full rounded-xl px-4 py-3 pl-10 pr-10 text-sm text-foreground outline-none transition-all border border-white/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              style={{ background: 'rgba(255,255,255,0.05)' }} />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-white/5 transition-all">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2.5 p-3.5 rounded-xl text-sm font-medium text-red-400"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          type="submit" disabled={loading}
          className="w-full py-3.5 rounded-xl text-sm font-black text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
          style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)', boxShadow: '0 10px 30px rgba(255,92,0,0.3)' }}>
          {loading ? <><Loader className="w-4 h-4 animate-spin" /> Signing in...</> : <>Sign In <span className="text-lg">→</span></>}
        </motion.button>
      </form>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{' '}
          <a href="/register" className="text-primary font-semibold hover:text-primary/80 transition-colors">Create account</a>
        </p>
      </div>
    </AuthCard>
  );
}