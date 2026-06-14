import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader, AlertCircle, Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react';
import { callAuth } from '@/lib/customAuth';

const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' };
const inputClass = "w-full rounded-xl px-4 py-3 pl-10 text-sm text-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20";

export default function ForgotPassword({ onBack }) {
  const [step, setStep] = useState('email'); // email | otp | newpass | done
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpId, setOtpId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const startResendTimer = () => {
    setResendTimer(60);
    const t = setInterval(() => {
      setResendTimer(prev => { if (prev <= 1) { clearInterval(t); return 0; } return prev - 1; });
    }, 1000);
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await callAuth('forgot_password', { email });
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setOtpId(res.otpId);
    setStep('otp');
    startResendTimer();
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError('');
    setLoading(true);
    const res = await callAuth('resend_otp', { otpId });
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    startResendTimer();
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) { setError('Please enter the 6-digit code.'); return; }
    setStep('newpass');
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    const res = await callAuth('reset_password_otp', { otpId, otp, newPassword });
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setStep('done');
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={step === 'email' ? onBack : () => setStep(step === 'newpass' ? 'otp' : 'email')}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-foreground">
            {step === 'done' ? 'Password Reset!' : 'Reset Password'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {step === 'email' && 'Enter your email to receive a reset code'}
            {step === 'otp' && `Code sent to ${email}`}
            {step === 'newpass' && 'Choose your new password'}
            {step === 'done' && 'You can now sign in with your new password'}
          </p>
        </div>
      </div>

      {/* Done state */}
      {step === 'done' && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <p className="text-muted-foreground mb-6">Your password has been reset successfully.</p>
          <button onClick={onBack}
            className="w-full py-3 rounded-xl text-sm font-black text-white transition-all"
            style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)', boxShadow: '0 10px 30px rgba(255,92,0,0.3)' }}>
            Back to Login
          </button>
        </motion.div>
      )}

      {/* Email step */}
      {step === 'email' && (
        <form onSubmit={handleSendOTP} className="space-y-4">
          <div>
            <label className="text-xs font-mono text-muted-foreground mb-2 block uppercase tracking-wider">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required
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
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-black text-white disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)', boxShadow: '0 10px 30px rgba(255,92,0,0.3)' }}>
            {loading ? <><Loader className="w-4 h-4 animate-spin" /> Sending...</> : 'Send Reset Code →'}
          </button>
        </form>
      )}

      {/* OTP step */}
      {step === 'otp' && (
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div>
            <label className="text-xs font-mono text-muted-foreground mb-2 block uppercase tracking-wider">6-Digit Code</label>
            <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000" maxLength={6} required
              className="w-full rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] text-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              style={inputStyle} />
          </div>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-2 p-3 rounded-lg text-sm text-red-400"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </motion.div>
          )}
          <button type="submit" disabled={loading || otp.length !== 6}
            className="w-full py-3 rounded-xl text-sm font-black text-white disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)', boxShadow: '0 10px 30px rgba(255,92,0,0.3)' }}>
            Verify Code →
          </button>
          <p className="text-center text-sm text-muted-foreground">
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : (
              <button type="button" onClick={handleResend} className="text-primary hover:underline">Resend code</button>
            )}
          </p>
        </form>
      )}

      {/* New password step */}
      {step === 'newpass' && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="text-xs font-mono text-muted-foreground mb-2 block uppercase tracking-wider">New Password</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
              <input type={showPass ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters" required
                className={`${inputClass} pr-10`} style={inputStyle} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-mono text-muted-foreground mb-2 block uppercase tracking-wider">Confirm Password</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat password" required
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
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-black text-white disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)', boxShadow: '0 10px 30px rgba(255,92,0,0.3)' }}>
            {loading ? <><Loader className="w-4 h-4 animate-spin" /> Resetting...</> : 'Reset Password →'}
          </button>
        </form>
      )}
    </div>
  );
}