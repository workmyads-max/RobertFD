import { useState, useEffect } from 'react';
import { Mail, CheckCircle2, ArrowLeft, RefreshCw } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import XFLogo from '@/components/shared/XFLogo';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');

  // Get email/password from registration or login redirect
  useEffect(() => {
    const state = location.state;
    if (state?.email) {
      setEmail(state.email);
    }
    if (state?.password) {
      setPassword(state.password);
    }
    if (state?.needsVerification) {
      toast.error('Please verify your email before logging in');
    }
  }, [location.state]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email not found. Please register again.');
      return;
    }

    if (code.length !== 6) {
      setError('Verification code must be 6 digits');
      return;
    }

    setIsLoading(true);
    try {
      // Use Base44 native OTP verification with EXACT parameter names
      await base44.auth.verifyOtp({
        email: email.toLowerCase().trim(),
        otpCode: code,
      });

      toast.success('Email verified! Logging you in...');

      // Auto-login after successful verification
      if (password) {
        await base44.auth.loginViaEmailPassword(email.toLowerCase().trim(), password);
        toast.success('Welcome!');
        navigate('/dashboard');
      } else {
        // No password (came from login redirect) - send to login
        toast.success('Email verified! Please log in now.');
        navigate('/login');
      }
    } catch (err) {
      console.error('Verification error:', err);
      const errorMsg = err?.message || err?.detail || 'Invalid or expired verification code';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('Email not found. Please register again.');
      return;
    }

    setIsResending(true);
    try {
      // Use Base44 native resend OTP - pass email string directly
      await base44.auth.resendOtp(email.toLowerCase().trim());
      toast.success('Verification code resent! Check your email.');
    } catch (err) {
      console.error('Resend error:', err);
      const errorMsg = err?.message || err?.detail || 'Failed to resend code';
      toast.error(errorMsg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Back Button */}
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>

          {/* Logo */}
          <div className="flex justify-center">
            <XFLogo size="xl" animate />
          </div>

          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black text-foreground">Verify Your Email</h1>
            <p className="text-muted-foreground">
              Enter the 6-digit code sent to <strong className="text-primary">{email || 'your email'}</strong>
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Verification Code</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-center text-lg tracking-widest"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          {/* Resend Code Button */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
              {isResending ? 'Resending...' : 'Resend verification code'}
            </button>
          </div>

          {/* Success Message */}
          <div className="p-4 bg-card border border-border rounded-xl">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="text-foreground font-medium mb-1">Check your email</p>
                <p>We sent a 6-digit verification code to <strong className="text-primary">{email || 'your email'}</strong>. The code expires in 10 minutes.</p>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Wrong email?{' '}
            <Link to="/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Register again
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent flex-col justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-black text-foreground leading-tight">
            Secure Your<br />
            <span className="text-primary">Account</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Verify your email to activate your account and start your funded trading journey. 
            This helps us ensure the security of your account.
          </p>
        </div>
      </div>
    </div>
  );
}