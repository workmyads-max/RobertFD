import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Eye, EyeOff, Chrome } from 'lucide-react';
import Lightfall from './Lightfall';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

export default function LoginModal({ isOpen, onClose }) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  // Close modal on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
    } catch (err) {
      toast.error('Google login failed: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!isLogin && formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });
        if (error) throw error;
        toast.success('Welcome back!');
        window.location.href = '/dashboard';
      } else {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailConfirmRedirectTo: `${window.location.origin}/dashboard`
          }
        });
        if (error) throw error;
        toast.success('Account created! Please check your email.');
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-md">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>

              {/* Card */}
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-xl">
                {/* Lightfall Background */}
                <div className="absolute inset-0" style={{ height: '400px' }}>
                  <Lightfall
                    colors={['#FF5C00', '#FF8A3D', '#CCFF00']}
                    backgroundColor="#0a0f1e"
                    speed={0.2}
                    streakCount={2}
                    streakWidth={0.6}
                    streakLength={0.4}
                    glow={1}
                    density={0.4}
                    twinkle={0.6}
                    zoom={2}
                    backgroundGlow={0.3}
                    opacity={0.8}
                    mouseInteraction={true}
                    mouseStrength={0.5}
                    mouseRadius={0.6}
                  />
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 p-8">
                  {/* Header */}
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-black text-white mb-1">
                      {isLogin ? 'Welcome Back' : 'Join XFunded Trader'}
                    </h2>
                    <p className="text-xs text-white/60 font-mono">
                      {isLogin ? 'Sign in to access your trading dashboard' : 'Create your account to start trading'}
                    </p>
                  </div>

                  {/* Google Login */}
                  <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all mb-4 disabled:opacity-50"
                  >
                    <Chrome className="w-5 h-5 text-white" />
                    <span className="text-sm font-medium text-white">Continue with Google</span>
                  </button>

                  {/* Divider */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-xs text-white/40 font-mono">OR</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                          type="email"
                          placeholder="Email address"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF5C00] focus:ring-1 focus:ring-[#FF5C00] transition-all text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF5C00] focus:ring-1 focus:ring-[#FF5C00] transition-all text-sm"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {!isLogin && (
                      <div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                          <input
                            type="password"
                            placeholder="Confirm Password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF5C00] focus:ring-1 focus:ring-[#FF5C00] transition-all text-sm"
                            required
                          />
                        </div>
                      </div>
                    )}

                    {error && (
                      <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF5C00] to-[#FF8A3D] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>
                  </form>

                  {/* Toggle Login/Signup */}
                  <div className="mt-4 text-center">
                    <p className="text-xs text-white/60">
                      {isLogin ? "Don't have an account?" : 'Already have an account?'}
                      <button
                        onClick={() => {
                          setIsLogin(!isLogin);
                          setError('');
                        }}
                        className="ml-2 text-[#FF5C00] hover:text-[#FF8A3D] font-medium transition-colors"
                      >
                        {isLogin ? 'Create one' : 'Login here'}
                      </button>
                    </p>
                  </div>
                </div>
              </div>

              {/* Trading Features */}
              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  { label: 'MT5/MT4', icon: '📊' },
                  { label: 'Instant Payouts', icon: '⚡' },
                  { label: '0% Commission', icon: '💎' },
                ].map((feature) => (
                  <div
                    key={feature.label}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
                  >
                    <span className="text-lg">{feature.icon}</span>
                    <span className="text-[10px] text-white/70 font-medium">{feature.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}