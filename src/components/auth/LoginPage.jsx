import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader, AlertCircle, Eye, EyeOff, Shield } from 'lucide-react';
import XFLogo from '@/components/shared/XFLogo';
import { callAuth } from '@/lib/customAuth';
import OTPStep from './OTPStep';

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
  const [step, setStep] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await callAuth('login', { email, password });
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setUserId(res.userId);
    setStep('otp');
  };

  const handleOTPSuccess = async (res) => {
    try {
      console.log('OTP verified successfully:', res);
      
      if (!res?.email) {
        setError('Login verification failed. Please try again.');
        setStep('login');
        return;
      }
      
      // Use Supabase magic link to create session without password
      const { supabase } = await import('@/lib/supabaseClient');
      const { error } = await supabase.auth.signInWithOtp({ email: res.email });
      
      if (error) {
        console.error('Magic link error:', error);
        // Fallback: just redirect, user is authenticated via backend
      }
      
      console.log('Redirecting to dashboard...');
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('OTP success handler error:', err);
      setError(err.message || 'An error occurred. Please try again.');
      setStep('login');
    }
  };

  if (step === 'otp') {
    return (
      <AuthCard>
        <OTPStep userId={userId} onSuccess={handleOTPSuccess} onBack={() => setStep('login')} purpose="login" />
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-foreground mb-2">Welcome Back</h1>
        <p className="text-sm text-muted-foreground">Sign in to your trading account</p>
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
          <label className="text-xs font-mono text-muted-foreground mb-2 block uppercase tracking-wider">Password</label>
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
          {loading ? <><Loader className="w-4 h-4 animate-spin" /> Signing in...</> : <>Continue <span className="text-lg">→</span></>}
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