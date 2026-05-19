import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { callAuth, saveSession } from '@/lib/customAuth';
import OTPStep from './OTPStep';

export default function LoginPage({ onLoginSuccess }) {
  const [step, setStep] = useState('login'); // login | otp
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

    if (res.error) {
      setError(res.error);
      return;
    }
    setUserId(res.userId);
    setStep('otp');
  };

  const handleOTPSuccess = (user, token) => {
    saveSession(user, token);
    onLoginSuccess(user);
  };

  const AuthCard = ({ children }) => (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 circuit-bg opacity-30" />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10">
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center glow-orange-sm"
            style={{ background: 'linear-gradient(135deg,#1a0e06,#2a1506)', border: '1px solid rgba(255,92,0,0.4)' }}>
            <span className="text-primary font-black text-sm" style={{ fontFamily: 'Georgia,serif' }}>XF</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-foreground font-bold text-base">XFunded</span>
            <span className="text-primary font-black text-base" style={{ letterSpacing: '-0.03em' }}>Trader</span>
          </div>
        </div>
        <div className="rounded-2xl p-8"
          style={{
            background: 'linear-gradient(135deg,rgba(255,92,0,0.06),rgba(204,255,0,0.02))',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          }}>
          {children}
        </div>
        <p className="text-center text-xs text-muted-foreground/50 mt-6">Protected by enterprise-grade security</p>
      </motion.div>
    </div>
  );

  if (step === 'otp') {
    return (
      <AuthCard>
        <OTPStep userId={userId} onSuccess={handleOTPSuccess} onBack={() => setStep('login')} purpose="login" />
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <h1 className="text-3xl font-black text-foreground mb-1">Welcome Back</h1>
      <p className="text-muted-foreground mb-8">Sign in to your trading account</p>

      <form onSubmit={handleLogin} className="space-y-4 mb-6">
        <div>
          <label className="text-xs font-mono text-muted-foreground mb-2 block uppercase tracking-wider">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required
              className="w-full rounded-xl px-4 py-3 pl-10 text-sm text-foreground outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>
        </div>

        <div>
          <label className="text-xs font-mono text-muted-foreground mb-2 block uppercase tracking-wider">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required
              className="w-full rounded-xl px-4 py-3 pl-10 pr-10 text-sm text-foreground outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
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
          {loading ? <><Loader className="w-4 h-4 animate-spin" /> Checking...</> : 'Continue →'}
        </motion.button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        <a href="/register" className="text-primary font-semibold hover:underline">Create account</a>
      </p>
    </AuthCard>
  );
}