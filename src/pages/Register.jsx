import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Loader, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!fullName || !email) {
      setError('Please fill in all fields');
      return;
    }
    
    setError('');
    setLoading(true);
    try {
      // In a real app, this would call an API to create the user
      // For now, redirect to login
      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      setError(err?.message || 'Registration failed');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md">
          <motion.div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.6 }}>
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </motion.div>
          <h1 className="text-2xl font-black text-foreground mb-2">Account Created!</h1>
          <p className="text-muted-foreground mb-6">Redirecting to login...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10">
        
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #FF5C00, #FF7A2F)' }}>
            <span className="text-white font-black text-xs" style={{ fontFamily: 'Georgia, serif' }}>RF</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-foreground font-bold">Robert</span>
            <span className="text-primary font-black text-sm" style={{ letterSpacing: '-0.03em' }}>Funds</span>
          </div>
        </div>

        {/* Form container */}
        <div className="rounded-2xl p-8 border"
          style={{
            background: 'linear-gradient(135deg, rgba(255,92,0,0.08), rgba(204,255,0,0.03))',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
          <h1 className="text-3xl font-black text-foreground mb-2">Start Trading</h1>
          <p className="text-base text-muted-foreground mb-6">Create your Robert Funds account</p>

          <form onSubmit={handleRegister} className="space-y-4 mb-6">
            {/* Full Name field */}
            <div>
              <label className="text-xs font-mono text-muted-foreground mb-2 block uppercase">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full rounded-xl px-4 py-3 pl-10 text-sm text-foreground outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                />
              </div>
            </div>

            {/* Email field */}
            <div>
              <label className="text-xs font-mono text-muted-foreground mb-2 block uppercase">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full rounded-xl px-4 py-3 pl-10 text-sm text-foreground outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="p-3 rounded-lg text-sm text-red-400"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </motion.div>
            )}

            {/* Submit button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-black text-white transition-all disabled:opacity-50"
              style={{
                background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)',
                boxShadow: '0 10px 30px rgba(255,92,0,0.3)',
              }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" /> Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full h-px bg-white/10" /></div>
            <div className="relative flex justify-center"><span className="bg-background px-2 text-xs text-muted-foreground/60">already registered?</span></div>
          </div>

          {/* Login link */}
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <a href="/login" className="text-primary font-semibold hover:underline">
              Sign in here
            </a>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground/50 mt-6">
          By registering, you agree to our Terms of Service
        </p>
      </motion.div>
    </div>
  );
}