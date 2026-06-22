import { useState, useEffect } from 'react';
import { Mail, CheckCircle2, ArrowLeft, RefreshCw } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import XFLogo from '@/components/shared/XFLogo';
import { getStoredReferralCode, clearStoredReferralCode, processAffiliateAttribution } from '@/utils/referralUtils';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if user is already authenticated and get state from navigation - with timeout fallback
  useEffect(() => {
    let isMounted = true;
    let redirectAttempted = false;
    
    const state = location.state;
    if (state?.email) {
      setEmail(state.email);
    }
    if (state?.password) {
      setPassword(state.password);
    }
    // Referral code from navigation state, with localStorage fallback
    const refFromState = state?.referral_code;
    const refFromStorage = getStoredReferralCode();
    if (refFromState || refFromStorage) {
      setReferralCode((refFromState || refFromStorage).toUpperCase());
    }
    if (state?.needsVerification) {
      toast.error('Please verify your email before logging in');
    }
    
    // If already authenticated, redirect to dashboard with timeout protection
    const checkAuth = async () => {
      try {
        // Timeout after 2 seconds to prevent infinite spinner
        const authCheck = base44.auth.isAuthenticated();
        const timeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth check timeout')), 2000)
        );
        
        const isAuthenticated = await Promise.race([authCheck, timeout]);
        
        if (isMounted && !redirectAttempted && isAuthenticated) {
          redirectAttempted = true;
          navigate('/dashboard', { replace: true });
          return;
        }
        
        if (isMounted && !redirectAttempted) {
          setIsCheckingAuth(false);
        }
      } catch (err) {
        console.error('Auth check failed or timed out:', err);
        if (isMounted && !redirectAttempted) {
          // On any error, show the form instead of hanging
          setIsCheckingAuth(false);
        }
      }
    };
    
    checkAuth();
    
    // Safety timeout - force show form after 3 seconds
    const forceShowForm = setTimeout(() => {
      if (isMounted && isCheckingAuth) {
        console.warn('[VerifyEmail] Auth check took too long, showing form');
        setIsCheckingAuth(false);
      }
    }, 3000);
    
    return () => {
      isMounted = false;
      clearTimeout(forceShowForm);
    };
  }, [location.state, navigate, isCheckingAuth]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

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

        // ── Affiliate attribution: create the new user's AffiliateProfile and
        // increment the referrer's total_referrals. Non-blocking — failures are
        // logged but never break the auth flow.
        if (referralCode) {
          processAffiliateAttribution(email, referralCode).then((res) => {
            if (res?.success) {
              clearStoredReferralCode();
              console.log('[verify-email] affiliate attribution processed');
            }
          });
        } else {
          // Even with no ref code, ensure the user gets a self-profile created
          // later by the Affiliate dashboard (existing behaviour). Nothing to do here.
        }

        // ── Welcome email: always send once after first successful verification.
        // Uses Base44 SendEmail so it's delivered from our verified custom domain
        // (support@xfundedtrader.com). Wrapped in try/catch so email failures
        // never block login.
        try {
          await base44.integrations.Core.SendEmail({
            to: email.toLowerCase().trim(),
            subject: 'Welcome to XFunded Trader - Your Journey Begins Now',
            body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #0a0a0a; color: #ebebeb; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; background-color: #111111; }
    .header { padding: 40px 30px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .logo { font-size: 32px; font-weight: 900; letter-spacing: -0.03em; color: #ffffff; }
    .logo span { color: #FF7A00; }
    .tagline { font-size: 11px; font-weight: 700; letter-spacing: 0.22em; color: rgba(255,255,255,0.38); text-transform: uppercase; margin-top: 6px; }
    .content { padding: 40px 30px; }
    h1 { font-size: 28px; font-weight: 800; color: #ffffff; margin-bottom: 20px; line-height: 1.3; }
    p { font-size: 16px; color: #a3a3a3; margin-bottom: 24px; }
    .cta-button { display: inline-block; padding: 14px 32px; background-color: #FF7A00; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin-top: 20px; }
    .cta-button:hover { background-color: #ff6a00; }
    .features { margin: 30px 0; padding: 20px; background-color: rgba(255,255,255,0.03); border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); }
    .feature-item { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; font-size: 14px; color: #d4d4d4; }
    .feature-item:last-child { margin-bottom: 0; }
    .check { color: #FF7A00; font-weight: bold; }
    .footer { padding: 30px; text-align: center; font-size: 13px; color: #737373; border-top: 1px solid rgba(255,255,255,0.08); }
    .footer a { color: #FF7A00; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo"><span>X</span>Funded</div>
      <div class="tagline">Trader</div>
    </div>
    <div class="content">
      <h1>Welcome to XFunded Trader</h1>
      <p>Congratulations on taking the first step toward professional trading success. Your account is now verified and ready to go.</p>
      
      <p>You now have access to:</p>
      <div class="features">
        <div class="feature-item"><span class="check">✓</span> Trading capital up to $200,000</div>
        <div class="feature-item"><span class="check">✓</span> Keep up to 80% of profits</div>
        <div class="feature-item"><span class="check">✓</span> Professional trading platforms</div>
        <div class="feature-item"><span class="check">✓</span> Fast, reliable withdrawals</div>
      </div>
      
      <div style="text-align: center;">
        <a href="${window.location.origin}/dashboard" class="cta-button">Go to Dashboard</a>
      </div>
      
      <p style="margin-top: 30px; font-size: 14px;">Ready to start? Head to your dashboard and choose your first challenge. Our team is here to support you every step of the way.</p>
    </div>
    <div class="footer">
      <p>© 2026 XFunded Trader. All rights reserved.</p>
      <p style="margin-top: 8px;">Questions? Contact us at <a href="mailto:support@xfundedtrader.com">support@xfundedtrader.com</a></p>
    </div>
  </div>
</body>
</html>`
          });
          console.log('Welcome email sent to:', email);
        } catch (emailErr) {
          console.error('Failed to send welcome email:', emailErr);
        }
        
        toast.success('Welcome!');
        // CRITICAL: Use window.location.href for guaranteed navigation
        window.location.href = '/dashboard';
      } else {
        // No password (came from login-needs-verification flow) - send to login
        // Still process affiliate attribution if a ref code is present, since
        // the user is now verified and will have an AffiliateProfile on first
        // dashboard visit. We attempt attribution using the email only.
        if (referralCode) {
          processAffiliateAttribution(email, referralCode).then((res) => {
            if (res?.success) clearStoredReferralCode();
          });
        }
        toast.success('Email verified! Please log in now.');
        window.location.href = '/login';
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