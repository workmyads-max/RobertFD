import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Loader, RefreshCw, AlertCircle } from 'lucide-react';
import { callAuth } from '@/lib/customAuth';

export default function OTPStep({ userId, onSuccess, onBack, purpose = 'login', devOtp = null }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(600); // 10 min
  const [resendCooldown, setResendCooldown] = useState(60);
  const inputRefs = useRef([]);

  useEffect(() => {
    const t = setInterval(() => setTimer(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setResendCooldown(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const handleChange = (idx, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length === 6) {
      setOtp(paste.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) { setError('Enter all 6 digits.'); return; }
    if (timer === 0) { setError('OTP expired. Please resend.'); return; }

    setLoading(true);
    setError('');
    console.log('Verifying OTP:', { userId, purpose, otp: code });
    const action = purpose === 'registration' ? 'verify_registration' : 'verify_login';
    try {
      const res = await callAuth(action, { userId, otp: code });
      console.log('OTP response:', res);
      setLoading(false);

      if (res.error) { setError(res.error); return; }
      onSuccess(res);
    } catch (err) {
      console.error('OTP verification failed:', err);
      setError(err.message || 'Verification failed. Please try again.');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError('');
    const res = await callAuth('resend_otp', { userId });
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setTimer(600);
    setResendCooldown(60);
    setOtp(['', '', '', '', '', '']);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(255,92,0,0.1)', border: '1px solid rgba(255,92,0,0.3)' }}>
          <ShieldCheck className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-black text-foreground mb-2">Verify Your Identity</h2>
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code sent to your email.
        </p>
        <div className="mt-2 text-xs font-mono text-primary">
          Code expires in: {formatTime(timer)}
        </div>
        {devOtp && (
          <div className="mt-3 px-4 py-2 rounded-lg text-sm font-mono text-center"
            style={{ background: 'rgba(204,255,0,0.08)', border: '1px solid rgba(204,255,0,0.3)', color: '#ccff00' }}>
            📧 Email delivery not configured yet — your code is: <strong style={{ letterSpacing: '4px' }}>{devOtp}</strong>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-2" onPaste={handlePaste}>
        {otp.map((digit, idx) => (
          <input
            key={idx}
            ref={el => inputRefs.current[idx] = el}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleChange(idx, e.target.value)}
            onKeyDown={e => handleKeyDown(idx, e)}
            className="w-12 h-14 text-center text-2xl font-black text-foreground outline-none rounded-xl transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: digit ? '2px solid rgba(255,92,0,0.6)' : '1px solid rgba(255,255,255,0.12)',
            }}
          />
        ))}
      </div>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center gap-2 p-3 rounded-lg text-sm text-red-400"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </motion.div>
      )}

      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        onClick={handleVerify} disabled={loading || timer === 0}
        className="w-full py-3 rounded-xl text-sm font-black text-white disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)', boxShadow: '0 10px 30px rgba(255,92,0,0.3)' }}>
        {loading ? <><Loader className="w-4 h-4 animate-spin" /> Verifying...</> : 'Verify Code'}
      </motion.button>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <button onClick={onBack} className="hover:text-foreground transition-colors">← Back</button>
        <button onClick={handleResend} disabled={resendCooldown > 0}
          className="flex items-center gap-1 hover:text-primary transition-colors disabled:opacity-40">
          <RefreshCw className="w-3 h-3" />
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
        </button>
      </div>
    </motion.div>
  );
}