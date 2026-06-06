import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, AtSign, Loader, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { callAuth } from '@/lib/customAuth';
import { supabase, signInWithGoogle } from '@/lib/supabaseClient';
import XFLogo from '@/components/shared/XFLogo';

const AuthCard = ({ children, title, subtitle }) => (
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
        {title && <><h1 className="text-3xl font-black text-foreground mb-1">{title}</h1><p className="text-muted-foreground mb-8">{subtitle}</p></>}
        {children}
      </div>
      <p className="text-center text-xs text-muted-foreground/50 mt-6">By registering, you agree to our Terms of Service</p>
    </motion.div>
  </div>
);

export default function Register() {
  const [fields, setFields] = useState({ full_name: '', username: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const set = (k) => (e) => setFields(f => ({ ...f, [k]: e.target.value }));

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    await signInWithGoogle();
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!fields.email || !fields.username || !fields.full_name || !fields.password) {
      setError('All fields are required.'); return;
    }
    if (fields.password !== fields.confirm) { setError('Passwords do not match.'); return; }
    if (fields.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(fields.username)) {
      setError('Username can only contain letters, numbers and underscores.'); return;
    }

    setLoading(true);
    const res = await callAuth('register', {
      email: fields.email,
      username: fields.username,
      full_name: fields.full_name,
      password: fields.password,
    });
    setLoading(false);

    if (res.error) {
      setError(res.error);
      return;
    }

    // Auto sign-in session returned directly — set it and redirect
    if (res.session?.access_token && res.session?.refresh_token) {
      await supabase.auth.signOut();
      await supabase.auth.setSession({
        access_token: res.session.access_token,
        refresh_token: res.session.refresh_token,
      });
      setDone(true);
      setTimeout(() => { window.location.href = '/dashboard'; }, 1200);
      return;
    }

    // Fallback: account created but no auto-login
    setDone(true);
    setTimeout(() => { window.location.href = '/login'; }, 1500);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-black text-foreground mb-3">Account Created!</h1>
          <p className="text-muted-foreground">Redirecting to your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' };
  const inputClass = "w-full rounded-xl px-4 py-3 pl-10 text-sm text-foreground outline-none transition-all";

  return (
    <AuthCard title="Start Trading" subtitle="Create your account">
      {/* Google Sign Up */}
      <motion.button
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        type="button"
        onClick={handleGoogleRegister}
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

      <form onSubmit={handleRegister} className="space-y-4 mb-6">
        <div>
          <label className="text-xs font-mono text-muted-foreground mb-2 block uppercase tracking-wider">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <input value={fields.full_name} onChange={set('full_name')} placeholder="John Smith" required className={inputClass} style={inputStyle} />
          </div>
        </div>
        <div>
          <label className="text-xs font-mono text-muted-foreground mb-2 block uppercase tracking-wider">Username</label>
          <div className="relative">
            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <input value={fields.username} onChange={set('username')} placeholder="johnsmith" required className={inputClass} style={inputStyle} />
          </div>
        </div>
        <div>
          <label className="text-xs font-mono text-muted-foreground mb-2 block uppercase tracking-wider">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <input type="email" value={fields.email} onChange={set('email')} placeholder="your@email.com" required className={inputClass} style={inputStyle} />
          </div>
        </div>
        <div>
          <label className="text-xs font-mono text-muted-foreground mb-2 block uppercase tracking-wider">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <input type={showPass ? 'text' : 'password'} value={fields.password} onChange={set('password')} placeholder="Min. 8 characters" required className={`${inputClass} pr-10`} style={inputStyle} />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="text-xs font-mono text-muted-foreground mb-2 block uppercase tracking-wider">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <input type="password" value={fields.confirm} onChange={set('confirm')} placeholder="Repeat password" required className={inputClass} style={inputStyle} />
          </div>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-2 p-3 rounded-lg text-sm text-red-400"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </motion.div>
        )}

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          type="submit" disabled={loading}
          className="w-full py-3 rounded-xl text-sm font-black text-white disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)', boxShadow: '0 10px 30px rgba(255,92,0,0.3)' }}>
          {loading ? <><Loader className="w-4 h-4 animate-spin" /> Creating Account...</> : 'Create Account →'}
        </motion.button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <a href="/login" className="text-primary font-semibold hover:underline">Sign in</a>
      </p>
    </AuthCard>
  );
}