import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, AtSign, Loader, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { callAuth, saveSession } from '@/lib/customAuth';
import OTPStep from '@/components/auth/OTPStep';
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
  const [step, setStep] = useState('form'); // form | otp | done
  const [fields, setFields] = useState({ full_name: '', username: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState(null);
  const [devOtp, setDevOtp] = useState(null);

  const set = (k) => (e) => setFields(f => ({ ...f, [k]: e.target.value }));

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!fields.email || !fields.username || !fields.full_name || !fields.password) { setError('All fields are required.'); return; }
    if (fields.password !== fields.confirm) { setError('Passwords do not match.'); return; }
    if (fields.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(fields.username)) { setError('Username can only contain letters, numbers and underscores.'); return; }
    setLoading(true);
    try {
      const res = await Promise.race([
        callAuth('register', { email: fields.email, username: fields.username, full_name: fields.full_name, password: fields.password }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), 15000))
      ]);
      if (res.error) { setError(res.error); setLoading(false); return; }
      setUserId(res.userId);
      if (res.dev_otp) setDevOtp(res.dev_otp);
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  const handleOTPSuccess = (user, token) => {
    saveSession(user, token);
    setStep('done');
    setTimeout(() => { window.location.href = '/dashboard'; }, 1500);
  };

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-black text-foreground mb-3">Account Activated!</h1>
          <p className="text-muted-foreground">Redirecting to your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  if (step === 'otp') {
    return (
      <AuthCard>
        <OTPStep userId={userId} onSuccess={handleOTPSuccess} onBack={() => setStep('form')} purpose="registration" devOtp={devOtp} />
      </AuthCard>
    );
  }

  const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' };
  const inputClass = "w-full rounded-xl px-4 py-3 pl-10 text-sm text-foreground outline-none transition-all";

  return (
    <AuthCard title="Start Trading" subtitle="Create your Funded Firms account">
      <form onSubmit={handleRegister} className="space-y-4 mb-6">
        <div>
          <label className="text-xs font-mono text-muted-foreground mb-2 block uppercase tracking-wider">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <input value={fields.full_name} onChange={set('full_name')} placeholder="John Smith" required
              className={inputClass} style={inputStyle} />
          </div>
        </div>

        <div>
          <label className="text-xs font-mono text-muted-foreground mb-2 block uppercase tracking-wider">Username</label>
          <div className="relative">
            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <input value={fields.username} onChange={set('username')} placeholder="johnsmith" required
              className={inputClass} style={inputStyle} />
          </div>
        </div>

        <div>
          <label className="text-xs font-mono text-muted-foreground mb-2 block uppercase tracking-wider">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <input type="email" value={fields.email} onChange={set('email')} placeholder="your@email.com" required
              className={inputClass} style={inputStyle} />
          </div>
        </div>

        <div>
          <label className="text-xs font-mono text-muted-foreground mb-2 block uppercase tracking-wider">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <input type={showPass ? 'text' : 'password'} value={fields.password} onChange={set('password')}
              placeholder="Min. 8 characters" required
              className={`${inputClass} pr-10`} style={inputStyle} />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-mono text-muted-foreground mb-2 block uppercase tracking-wider">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <input type="password" value={fields.confirm} onChange={set('confirm')} placeholder="Repeat password" required
              className={inputClass} style={inputStyle} />
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