import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, KeyRound, User, Globe } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import XFLogo from '@/components/shared/XFLogo';
import { useSupabaseAuth } from '@/lib/SupabaseAuthContext';

const ALL_COUNTRIES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Argentina','Armenia','Australia','Austria',
  'Azerbaijan','Bahamas','Bahrain','Bangladesh','Belgium','Bolivia','Bosnia and Herzegovina','Brazil','Brunei','Bulgaria',
  'Cambodia','Canada','Chile','China','Colombia','Costa Rica','Croatia','Cuba','Cyprus','Czech Republic',
  'Denmark','Dominican Republic','Ecuador','Egypt','Estonia','Ethiopia','Finland','France','Georgia','Germany',
  'Ghana','Greece','Guatemala','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland',
  'Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kuwait','Latvia','Lebanon',
  'Lithuania','Luxembourg','Malaysia','Malta','Mexico','Moldova','Monaco','Mongolia','Morocco','Myanmar',
  'Nepal','Netherlands','New Zealand','Nigeria','Norway','Oman','Pakistan','Palestine','Panama','Paraguay',
  'Peru','Philippines','Poland','Portugal','Qatar','Romania','Russia','Rwanda','Saudi Arabia','Senegal',
  'Serbia','Singapore','Slovakia','Slovenia','South Africa','South Korea','Spain','Sri Lanka','Sudan','Sweden',
  'Switzerland','Syria','Taiwan','Tanzania','Thailand','Tunisia','Turkey','Ukraine','United Arab Emirates',
  'United Kingdom','United States','Uruguay','Uzbekistan','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe'
];

export default function Register() {
  const navigate = useNavigate();
  const { refreshUser } = useSupabaseAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState('register'); // 'register' | 'otp'
  const [otpCode, setOtpCode] = useState('');
  const [otpId, setOtpId] = useState(null);
  const [resending, setResending] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: '',
  });
  const [error, setError] = useState('');

  // Read ref from URL param first, fallback to cookie (set by Home page)
  const refCode = new URLSearchParams(window.location.search).get('ref')
    || (() => {
      const match = document.cookie.match(/(?:^|;\s*)xf_ref=([^;]*)/);
      return match ? match[1] : '';
    })();

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
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('First name and last name are required');
      return;
    }

    setIsLoading(true);
    try {
      // STEP 1: Only send our custom OTP via Resend — do NOT call auth.register yet
      // (auth.register triggers Base44's own OTP email which we can't suppress)
      const otpRes = await base44.functions.invoke('sendOTP', {
        email: formData.email,
        type: 'registration',
        name: formData.firstName,
      });
      if (!otpRes.data?.otp_id) throw new Error('Failed to send verification code');
      setOtpId(otpRes.data.otp_id);
      toast.success('Check your email for a verification code!');
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Failed to send verification code');
      toast.error(err.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    try {
      const otpRes = await base44.functions.invoke('sendOTP', {
        email: formData.email,
        type: 'registration',
        name: formData.firstName,
      });
      setOtpId(otpRes.data?.otp_id || null);
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
      // STEP 2: Verify our custom OTP first
      const verifyRes = await base44.functions.invoke('verifyOTP', { otp_id: otpId, code: otpCode });
      if (!verifyRes.data?.success) {
        throw new Error(verifyRes.data?.error || 'Invalid verification code');
      }

      // STEP 3: Only NOW register the account (Base44 will send its own email but OTP is already verified)
      try {
        await base44.auth.register({ email: formData.email, password: formData.password });
      } catch (regErr) {
        // If already registered (e.g. retry), continue to login
        if (!regErr.message?.toLowerCase().includes('already')) throw regErr;
      }
      await base44.auth.loginViaEmailPassword(formData.email, formData.password);

      // Save profile data (first name, last name, country) to user account
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      try {
        await base44.auth.updateMe({
          full_name: fullName,
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          country: formData.country || undefined,
        });
      } catch (profileErr) {
        console.error('Profile save error (non-blocking):', profileErr);
      }

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

  const inputCls = "w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all";

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
              {/* First & Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">First Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className={inputCls}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Last Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className={inputCls}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={inputCls}
                    required
                  />
                </div>
              </div>

              {/* Password */}
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

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={inputCls}
                    required
                  />
                </div>
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Country</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                  >
                    <option value="">Select your country</option>
                    {ALL_COUNTRIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>
              )}

              <button type="submit" disabled={isLoading}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? 'Please wait...' : 'Create Account'}
              </button>

              {/* Benefits */}
              <div className="space-y-2 pt-1">
                {[
                  ['Instant Access', 'Start trading immediately after verification'],
                  ['No Hidden Fees', 'Transparent pricing with 0% commission'],
                ].map(([title, desc]) => (
                  <div key={title} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      <span className="text-foreground font-medium">{title}</span> — {desc}
                    </div>
                  </div>
                ))}
              </div>
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
            <span className="text-primary">Starts Here.</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Get funded with up to $200,000 in trading capital. Prove your skills in our evaluation
            and unlock consistent monthly withdrawals with our industry-leading profit splits.
          </p>
          <div className="grid grid-cols-2 gap-6 pt-8">
            {[['5K-200K', 'Account Sizes'], ['1:100', 'Leverage'], ['Fast', 'Payouts'], ['Global', 'Access']].map(([v, l]) => (
              <div key={l} className="space-y-1">
                <div className="text-3xl font-black text-primary">{v}</div>
                <div className="text-sm text-muted-foreground">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}