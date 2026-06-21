import { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import XFLogo from '@/components/shared/XFLogo';

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Redirect if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuthenticated = await base44.auth.isAuthenticated();
        if (isAuthenticated) {
          navigate('/dashboard', { replace: true });
        } else {
          setIsCheckingAuth(false);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, [navigate]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const normalizedEmail = formData.email.toLowerCase().trim();

    try {
      // Use Base44 native email+password login
      await base44.auth.loginViaEmailPassword(normalizedEmail, formData.password);
      
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      const errorMsg = err.message || 'Invalid email or password';
      
      // Check if error is about email verification needed
      if (errorMsg.includes('verify') || errorMsg.includes('verification')) {
        // Redirect to verification screen with email pre-filled
        toast.error('Please verify your email first');
        navigate('/verify-email', { 
          state: { 
            email: normalizedEmail,
            password: formData.password,
            needsVerification: true
          } 
        });
        return;
      }
      
      // Check if account doesn't exist in native auth (old custom auth users)
      if (errorMsg.includes('not found') || errorMsg.includes('does not exist') || errorMsg.includes('invalid')) {
        setError('No account found with this email. If you have an existing account, please use "Forgot Password" to set up access with the same email - all your data will be preserved.');
        toast.error('Account not found - use Forgot Password or Register');
        return;
      }
      
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Back Button */}
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>

          {/* Logo */}
          <div className="flex justify-center">
            <XFLogo size="xl" animate />
          </div>

          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black text-foreground">Welcome Back</h1>
            <p className="text-muted-foreground">Sign in to access your trading dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link to="/forgot-password" className="text-sm text-primary hover:text-primary/80 font-medium transition-colors">
                Forgot password?
              </Link>
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
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Create Account
            </Link>
          </p>

          {/* Old System Users Notice */}
          <div className="p-3 bg-card border border-border rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              <strong className="text-foreground">Returning user?</strong> If you can't log in, use{' '}
              <Link to="/forgot-password" className="text-primary hover:text-primary/80 font-medium transition-colors">
                Forgot Password
              </Link>
              {' '}with your existing email to set up access. All your data remains intact.
            </p>
          </div>
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
            Master the Markets.<br />
            <span className="text-primary">Fund Your Future.</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Join thousands of traders who have transformed their trading careers with our funded account programs. 
            Get access to capital up to $200,000 and keep up to 80% of your profits.
          </p>
          <div className="grid grid-cols-2 gap-6 pt-8">
            <div className="space-y-1">
              <div className="text-3xl font-black text-primary">$200K+</div>
              <div className="text-sm text-muted-foreground">Maximum Funding</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-black text-primary">80%</div>
              <div className="text-sm text-muted-foreground">Profit Split</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-black text-primary">0%</div>
              <div className="text-sm text-muted-foreground">Commission</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-black text-primary">24/7</div>
              <div className="text-sm text-muted-foreground">Support</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}