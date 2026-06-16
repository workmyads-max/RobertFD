import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Chrome, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import XFLogo from '@/components/shared/XFLogo';
import { useSupabaseAuth } from '@/lib/SupabaseAuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { refreshUser } = useSupabaseAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState('register'); // 'register' | 'otp'
  const [otpCode, setOtpCode] = useState('');
  const [resending, setResending] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');

  // Read ref from URL param first, fallback to cookie (set by Home page)
  const refCode = new URLSearchParams(window.location.search).get('ref')
    || (() => {
      const match = document.cookie.match(/(?:^|;\s*)xf_ref=([^;]*)/);
      return match ? match[1] : '';
    })();

  const handleGoogleSignup = async () => {
    try {
      // Store ref code in sessionStorage so it survives Google OAuth redirect
      if (refCode) {
        sessionStorage.setItem('xf_pending_ref', refCode);
      }
      await base44.auth.loginViaGoogle({ redirectTo: `${window.location.origin}/dashboard` });
    } catch (err) {
      toast.error('Google signup failed: ' + err.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      await base44.auth.register({ email: formData.email, password: formData.password });
      toast.success('Check your email for a verification code!');
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Registration failed');
      toast.error(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    try {
      await base44.auth.resendOtp(formData.email);
      toast.success('A new code has been sent to your email');
    } catch (err) {
      toast.error(err.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await base44.auth.verifyOtp({ email: formData.email, otpCode });
      await base44.auth.loginViaEmailPassword(formData.email, formData.password);

      // Affiliate attribution
      if (refCode) {
        try {
          const referrers = await base44.entities.AffiliateProfile.filter({ referral_code: refCode });
          if (referrers.length > 0) {
            const referrer = referrers[0];
            const newCode = 'RF' + Math.random().toString(36).slice(2, 8).toUpperCase();
            await base44.entities.AffiliateProfile.create({
              user_email: formData.email,
              referral_code: newCode,
              referred_by_code: refCode,
              referred_by_email: referrer.user_email,
              tier: 'standard',
              total_earned: 0, total_pending: 0, total_paid: 0,
              referral_clicks: 0, total_referrals: 0, conversions: 0,
              active_funded_traders: 0, is_active: true, is_frozen: false,
            });
            await base44.entities.AffiliateProfile.update(referrer.id, {
              total_referrals: (referrer.total_referrals || 0) + 1,
            });
          }
        } catch (affErr) {
          console.error('Affiliate attribution error (non-blocking):', affErr);
        }
      }

      toast.success('Account created! Welcome!');
      await refreshUser();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid verification code');
      toast.error(err.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md space-y-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>

          <div className="text-center">
            <XFLogo size="lg" animate />
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black text-foreground">
              {step === 'register' ? 'Create Account' : 'Verify Email'}
            </h1>
            <p className="text-muted-foreground">
              {step === 'register'
                ? 'Start your funded trading journey today'
                : `Enter the code sent to ${formData.email}`}
            </p>
          </div>

          {/* Step: Register */}
          {step === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>
              )}

              <button type="submit" disabled={isLoading}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? 'Please wait...' : 'Create Account'}
              </button>
            </form>
          )}

          {/* Step: OTP Verification */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Verification Code</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    maxLength={6}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-center text-lg tracking-widest font-mono"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>
              )}

              <button type="submit" disabled={isLoading}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? 'Verifying...' : 'Verify & Continue'}
              </button>

              <button type="button" onClick={handleResendOtp} disabled={resending}
                className="w-full py-2 text-sm text-primary hover:text-primary/80 transition-colors disabled:opacity-50">
                {resending ? 'Sending...' : 'Resend verification code'}
              </button>

              <button type="button" onClick={() => { setStep('register'); setError(''); setOtpCode(''); }}
                className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                ← Back to registration
              </button>
            </form>
          )}

          {step === 'register' && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground font-mono">OR</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <button onClick={handleGoogleSignup} disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-card border border-border hover:bg-card/80 transition-all disabled:opacity-50">
                <Chrome className="w-5 h-5 text-foreground" />
                <span className="text-sm font-medium text-foreground">Continue with Google</span>
              </button>

              <div className="space-y-3 pt-2">
                {[
                  ['Instant Access', 'Start trading immediately after verification'],
                  ['No Hidden Fees', 'Transparent pricing with 0% commission'],
                  ['Professional Platform', 'Trade on MT5, MT4, and more'],
                ].map(([title, desc]) => (
                  <div key={title} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      <span className="text-foreground font-medium">{title}</span> - {desc}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">Sign In</Link>
          </p>
        </div>
      </div>

      {/* Right Side */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-accent/10 via-accent/5 to-transparent flex-col justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-black text-foreground leading-tight">
            Your Trading Career<br />
            <span className="text-accent">Starts Here.</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Get funded with up to $200,000 in trading capital. Prove your skills in our evaluation
            and unlock consistent monthly withdrawals with our industry-leading profit splits.
          </p>
          <div className="grid grid-cols-2 gap-6 pt-8">
            {[['5K-200K', 'Account Sizes'], ['1:100', 'Leverage'], ['Fast', 'Payouts'], ['Global', 'Access']].map(([v, l]) => (
              <div key={l} className="space-y-1">
                <div className="text-3xl font-black text-accent">{v}</div>
                <div className="text-sm text-muted-foreground">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}