import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Loader, CheckCircle2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function Register() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await base44.users.inviteUser(email, 'user');
      setSuccess(true);
    } catch (err) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md">
          <motion.div
            className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6"
            animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.6 }}>
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </motion.div>
          <h1 className="text-3xl font-black text-foreground mb-3">Check Your Email!</h1>
          <p className="text-muted-foreground mb-2">
            We've sent an invitation link to:
          </p>
          <p className="text-primary font-bold text-lg mb-6">{email}</p>
          <p className="text-sm text-muted-foreground mb-8">
            Click the link in the email to activate your account and set your password. Check your spam folder if you don't see it.
          </p>
          <a href="/login"
            className="inline-block px-6 py-3 rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
            Back to Login
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 circuit-bg opacity-30" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center glow-orange-sm"
            style={{ background: 'linear-gradient(135deg, #1a0e06, #2a1506)', border: '1px solid rgba(255,92,0,0.4)' }}>
            <span className="text-primary font-black text-sm" style={{ fontFamily: 'Georgia, serif' }}>FC</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-foreground font-bold text-base">Funded</span>
            <span className="text-primary font-black text-base" style={{ letterSpacing: '-0.03em' }}>Firms</span>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8"
          style={{
            background: 'linear-gradient(135deg, rgba(255,92,0,0.06), rgba(204,255,0,0.02))',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          }}>
          <h1 className="text-3xl font-black text-foreground mb-1">Start Trading</h1>
          <p className="text-muted-foreground mb-8">Create your Funded Firms account</p>

          <form onSubmit={handleRegister} className="space-y-4 mb-6">
            <div>
              <label className="text-xs font-mono text-muted-foreground mb-2 block uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full rounded-xl px-4 py-3 pl-10 text-sm text-foreground outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center gap-2 p-3 rounded-lg text-sm text-red-400"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-black text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)', boxShadow: '0 10px 30px rgba(255,92,0,0.3)' }}>
              {loading ? <><Loader className="w-4 h-4 animate-spin" /> Sending Invite...</> : 'Create Account'}
            </motion.button>
          </form>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full h-px bg-white/10" /></div>
            <div className="relative flex justify-center"><span className="bg-transparent px-3 text-xs text-muted-foreground/60">already registered?</span></div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <a href="/login" className="text-primary font-semibold hover:underline">Sign in here</a>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground/50 mt-6">
          By registering, you agree to our Terms of Service
        </p>
      </motion.div>
    </div>
  );
}