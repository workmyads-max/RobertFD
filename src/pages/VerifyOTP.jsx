import { useState, useEffect } from 'react';
import { Mail, ArrowLeft, CheckCircle2, Shield } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import XFLogo from '@/components/shared/XFLogo';
import { useAuth } from '@/lib/AuthContext';

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const { checkAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isLogin, setIsLogin] = useState(false);

  useEffect(() => {
    const state = location.state;
    if (state?.email) {
      setEmail(state.email);
      sessionStorage.setItem('xf_pending_verify_email', state.email);
    } else {
      const storedEmail = sessionStorage.getItem('xf_pending_verify_email');
      if (storedEmail) {
        setEmail(storedEmail);
      }
    }
    if (state?.isLogin) {
      setIsLogin(true);
    }
  }, [location]);

  const handleOtpChange = (index, value) => {
    if (value && !/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    
    if (code.length !== 6) {
      toast.error('Please enter all 6 digits');
      return;
    }

    setIsLoading(true);
    try {
      const normalizedEmail = email.toLowerCase().trim();
      
      if (isLogin) {
        // Complete login via OTP
        await base44.auth.verifyEmailOtp({
          email: normalizedEmail,
          code,
        });
        
        // Refresh auth context
        await checkAuth();
        
        toast.success('Welcome back!');
        sessionStorage.removeItem('xf_pending_verify_email');
        navigate('/dashboard');
      } else {
        // Complete registration verification
        await base44.auth.verifyEmailOtp({
          email: normalizedEmail,
          code,
        });
        
        toast.success('Email verified successfully! You can now login.');
        sessionStorage.removeItem('xf_pending_verify_email');
        setTimeout(() => {
          navigate('/login', { state: { email: normalizedEmail, verified: true } });
        }, 800);
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      const errorMsg = err.message || 'Invalid code';
      toast.error(errorMsg);
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      const normalizedEmail = email.toLowerCase().trim();
      
      if (isLogin) {
        await base44.auth.loginViaEmailOtp({ email: normalizedEmail });
      } else {
        await base44.auth.sendVerificationEmail({ email: normalizedEmail });
      }
      
      toast.success('New code sent! Check your email.');
    } catch (err) {
      toast.error(err.message || 'Failed to resend');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md space-y-6">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>

          <div className="text-center">
            <XFLogo size="lg" animate />
          </div>

          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-black text-foreground">Verify Your Email</h1>
            <p className="text-muted-foreground">
              {isLogin ? 'Enter the code sent to' : 'Enter the 6-digit code sent to'}<br />
              <span className="text-primary font-semibold">{email}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Input */}
            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold rounded-xl bg-card border border-border text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  disabled={isLoading}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.some(d => !d)}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  {isLogin ? 'Sign In' : 'Verify Email'}
                </>
              )}
            </button>

            {/* Resend */}
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Didn't receive the code?
              </p>
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="text-sm text-primary hover:text-primary/80 font-semibold disabled:opacity-50"
              >
                {isResending ? 'Sending...' : 'Resend Code'}
              </button>
            </div>
          </form>

          <div className="rounded-xl bg-card/50 border border-border p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <span className="text-foreground font-medium">Security tip:</span> Never share this code with anyone, including XFunded staff.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-accent/10 via-accent/5 to-transparent flex-col justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-1/2 bg-primary rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-black text-foreground leading-tight">
            Secure Your<br />
            <span className="text-primary">Trading Account</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Your verification code ensures that only you have access to your 
            funded trading account and profit withdrawals.
          </p>
          <div className="grid grid-cols-2 gap-6 pt-8">
            {[['Secure', 'Email Verification'], ['Fast', 'Instant Access'], ['Private', 'No Data Sharing'], ['24/7', 'Support']].map(([v, l]) => (
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