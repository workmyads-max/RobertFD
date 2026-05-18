import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, User, Lock, Wallet, Bell, Save, Upload,
  Smartphone, Shield, CheckCircle, AlertCircle, Mail,
  Phone, Key, Eye, EyeOff, Chrome, RefreshCw, Globe,
  ChevronDown, X, Crop, Plus, Trash2
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';

const tabs = [
  { id: 'profile',  label: 'Profile',        icon: User },
  { id: 'security', label: 'Security & Auth', icon: Shield },
  { id: 'wallets',  label: 'Payout Wallets',  icon: Wallet },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

function InputField({ label, value, onChange, placeholder, disabled, type = 'text', hint }) {
  const [show, setShow] = useState(false);
  const isPass = type === 'password';
  return (
    <div>
      <label className="text-[11px] font-mono text-white/40 mb-1.5 block uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          type={isPass ? (show ? 'text' : 'password') : type}
          className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none disabled:opacity-40 transition-all"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
          }}
          onFocus={e => e.currentTarget.style.borderColor = 'rgba(255,92,0,0.4)'}
          onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'}
        />
        {isPass && (
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {hint && <p className="text-[10px] text-white/25 mt-1 font-mono">{hint}</p>}
    </div>
  );
}

function Card({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl p-6 space-y-5"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="border-b pb-4" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <h3 className="text-sm font-bold text-white">{title}</h3>
        {subtitle && <p className="text-[11px] text-white/30 font-mono mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function StatusBadge({ verified }) {
  return verified ? (
    <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
      <CheckCircle className="w-3 h-3" /> Verified
    </span>
  ) : (
    <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
      <AlertCircle className="w-3 h-3" /> Not Verified
    </span>
  );
}

// Country codes data
const COUNTRY_CODES = [
  { code: '+1', country: 'United States', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
  { code: '+66', country: 'Thailand', flag: '🇹🇭' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+82', country: 'South Korea', flag: '🇰🇷' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
];

const WALLET_TYPES = [
  { value: 'usdt_trc20', label: 'USDT TRC20', network: 'Tron', placeholder: 'T...' },
  { value: 'usdt_bep20', label: 'USDT BEP20', network: 'BSC', placeholder: '0x...' },
  { value: 'btc', label: 'Bitcoin', network: 'Bitcoin', placeholder: 'bc1... or 1...' },
  { value: 'eth', label: 'Ethereum', network: 'ERC20', placeholder: '0x...' },
];

export default function DashboardSettings({ user }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({ full_name: user?.full_name || '', email: user?.email || '' });
  const [wallets, setWallets] = useState({ usdt_trc20: user?.usdt_trc20 || '', bitcoin: user?.bitcoin || '', usdt_bep20: user?.usdt_bep20 || '', ethereum: user?.ethereum || '' });
  const [notifs, setNotifs] = useState({ email: true, payouts: true, news: false, marketing: false });
  const [uploadLoading, setUploadLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(user?.profile_photo_url || user?.avatar_url || null);
  const fileInputRef = useRef(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [tempImage, setTempImage] = useState(null);
  const canvasRef = useRef(null);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0, size: 100 });

  // Phone verification state
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES.find(c => c.code === '+1') || COUNTRY_CODES[0]);
  const [phone, setPhone] = useState(user?.phone || '');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneSent, setPhoneSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(user?.phone_verified || false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  // 2FA state
  const [twoFAEnabled, setTwoFAEnabled] = useState(user?.two_factor_enabled || false);

  // Google auth state
  const [googleLoading, setGoogleLoading] = useState(false);

  // Payout wallet selection
  const [selectedWalletType, setSelectedWalletType] = useState(user?.payout_wallet_type || 'usdt_trc20');

  const saveMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
  });

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    
    // Validate file
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Please upload JPG, PNG, or WEBP images only');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be under 5MB');
      return;
    }

    // Read image for cropping
    const reader = new FileReader();
    reader.onload = (e) => {
      setTempImage(e.target.result);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropAndSave = async () => {
    if (!canvasRef.current || !tempImage) return;
    
    setUploadLoading(true);
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = tempImage;
      });

      const size = Math.min(img.width, img.height) * (cropPosition.size / 100);
      const x = (img.width - size) / 2;
      const y = (img.height - size) / 2;

      canvas.width = 400;
      canvas.height = 400;
      ctx.drawImage(img, x, y, size, size, 0, 0, 400, 400);

      // Convert to blob and upload
      canvas.toBlob(async (blob) => {
        const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setProfilePhoto(file_url);
        await base44.auth.updateMe({ avatar_url: file_url, profile_photo_url: file_url });
        setShowCropModal(false);
        setTempImage(null);
      }, 'image/jpeg', 0.9);
    } catch (err) {
      console.error('Crop failed:', err);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSendPhoneCode = async () => {
    if (!phone || phone.length < 7) return;
    setPhoneLoading(true);
    try {
      const fullPhone = `${selectedCountry.code}${phone.replace(/\D/g, '')}`;
      await base44.functions.invoke('sendOTP', {
        email: user?.email,
        phone: fullPhone,
        type: 'phone_verification'
      });
      setPhoneSent(true);
    } catch (err) {
      console.error('Failed to send code:', err);
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyPhone = async () => {
    if (phoneCode.length < 4) return;
    setPhoneLoading(true);
    try {
      const otpRecords = await base44.entities.OTP.filter({ phone: `${selectedCountry.code}${phone.replace(/\D/g, '')}`, type: 'phone_verification' });
      const latestOTP = otpRecords.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
      
      if (!latestOTP) {
        alert('No OTP found. Please request a new code.');
        return;
      }

      await base44.functions.invoke('verifyOTP', {
        otp_id: latestOTP.id,
        code: phoneCode
      });
      
      setPhoneVerified(true);
      setPhoneSent(false);
      setPhoneCode('');
    } catch (err) {
      alert('Invalid code. Please try again.');
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    try {
      // This would integrate with Google OAuth - placeholder for now
      // In production, use Google OAuth popup flow
      const result = await base44.functions.invoke('googleAuth', { code: 'placeholder' });
      if (result.success) {
        await base44.auth.updateMe({ 
          google_linked: true, 
          google_id: result.google_id 
        });
      }
    } catch (err) {
      console.error('Google auth failed:', err);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,92,0,0.12)', border: '1px solid rgba(255,92,0,0.2)' }}>
            <Settings className="w-5 h-5 text-primary" />
          </div>
          Settings
        </h1>
        <p className="text-sm text-white/30 font-mono mt-1">Manage your account, security, and preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-48 flex-shrink-0">
          <div className="space-y-1 sticky top-4">
            {tabs.map(t => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all ${
                    isActive ? 'text-white' : 'text-white/35 hover:text-white/70 hover:bg-white/[0.04]'
                  }`}
                  style={isActive ? { background: 'linear-gradient(90deg, rgba(255,92,0,0.15), rgba(255,92,0,0.05))', borderLeft: '2px solid #FF5C00' } : {}}>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-white/25'}`} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
              className="space-y-4">

              {/* ── PROFILE ── */}
              {activeTab === 'profile' && (
                <>
                  <Card title="Profile Photo" subtitle="Shown across your dashboard and certificates">
                    <div className="flex items-center gap-5">
                      <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center text-2xl font-black text-white"
                          style={{
                            background: profilePhoto ? 'transparent' : 'linear-gradient(135deg, rgba(255,92,0,0.2), rgba(139,92,246,0.2))',
                            border: '2px solid rgba(255,92,0,0.3)',
                          }}>
                          {profilePhoto
                            ? <img src={profilePhoto} alt="" className="w-full h-full object-cover" />
                            : <span>{user?.full_name?.charAt(0)?.toUpperCase() || '?'}</span>}
                        </div>
                        <div className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ background: 'rgba(0,0,0,0.6)' }}>
                          <Upload className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div>
                        <button onClick={() => fileInputRef.current?.click()} disabled={uploadLoading}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                          style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
                          <Upload className="w-4 h-4" /> {uploadLoading ? 'Uploading…' : 'Upload Photo'}
                        </button>
                        <p className="text-[10px] text-white/25 font-mono mt-1.5">JPG, PNG, WEBP - max 5MB</p>
                      </div>
                      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={e => handlePhotoUpload(e.target.files?.[0])} className="hidden" />
                    </div>
                  </Card>

                  {/* Crop Modal */}
                  <AnimatePresence>
                    {showCropModal && tempImage && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)' }}
                      >
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.9, opacity: 0 }}
                          className="w-full max-w-lg rounded-2xl p-6"
                          style={{ background: 'rgba(14,14,16,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                              <Crop className="w-5 h-5 text-primary" />
                              Crop Profile Photo
                            </h3>
                            <button onClick={() => setShowCropModal(false)} className="text-white/40 hover:text-white">
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="relative aspect-square rounded-xl overflow-hidden mb-6" style={{ background: 'rgba(0,0,0,0.5)' }}>
                            <img src={tempImage} alt="Crop preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 border-2 border-primary/50" style={{ boxShadow: 'inset 0 0 0 9999px rgba(0,0,0,0.5)' }} />
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="text-[11px] font-mono text-white/40 mb-2 block uppercase">Zoom Level</label>
                              <input
                                type="range"
                                min="50"
                                max="100"
                                value={cropPosition.size}
                                onChange={e => setCropPosition(p => ({ ...p, size: parseInt(e.target.value) }))}
                                className="w-full"
                                style={{ accentColor: '#FF5C00' }}
                              />
                            </div>

                            <div className="flex gap-3">
                              <button onClick={() => setShowCropModal(false)}
                                className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                Cancel
                              </button>
                              <button onClick={handleCropAndSave} disabled={uploadLoading}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                                style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
                                {uploadLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                {uploadLoading ? 'Processing...' : 'Save Cropped'}
                              </button>
                            </div>
                          </div>

                          <canvas ref={canvasRef} className="hidden" />
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Card title="Personal Information" subtitle="Update your public profile details">
                    <div className="space-y-4">
                      <InputField label="Username" value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} placeholder="Your username" />
                      <InputField label="Email Address" value={profile.email} placeholder="your@email.com" disabled hint="Email cannot be changed — contact support if needed" />
                    </div>
                    <button onClick={() => { saveMutation.mutate({ full_name: profile.full_name }); }} disabled={saveMutation.isPending || !profile.full_name.trim()}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                      style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
                      <Save className="w-4 h-4" /> {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
                    </button>
                  </Card>
                </>
              )}

              {/* ── SECURITY & AUTH ── */}
              {activeTab === 'security' && (
                <>
                  {/* Google Auth */}
                  <Card title="Google Authentication" subtitle="Link your Google account for one-click sign-in">
                    <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <Chrome className="w-5 h-5 text-white/70" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white">Google Sign-In</div>
                            <div className="text-[11px] text-white/30 font-mono mt-0.5">
                              {user?.google_linked ? `Connected as ${user.email}` : 'Not connected'}
                            </div>
                          </div>
                        </div>
                        <StatusBadge verified={!!user?.google_linked} />
                      </div>
                      
                      <button
                        onClick={handleGoogleAuth}
                        disabled={googleLoading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                        style={{
                          background: user?.google_linked ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.06)',
                          border: user?.google_linked ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(255,255,255,0.12)',
                          color: user?.google_linked ? '#ef4444' : 'rgba(255,255,255,0.9)',
                        }}>
                        {googleLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Chrome className="w-4 h-4" />}
                        {googleLoading ? 'Processing...' : user?.google_linked ? 'Disconnect Google' : 'Connect with Google'}
                      </button>

                      {user?.google_linked && (
                        <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
                          <div className="flex items-center gap-2 text-[11px] text-emerald-400/80">
                            <CheckCircle className="w-3 h-3" />
                            <span>Google authentication enabled for quick login</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Phone Verification */}
                  <Card title="Phone Verification" subtitle="Verify your phone number for enhanced account security">
                    <div className="space-y-4">
                      <div>
                        <label className="text-[11px] font-mono text-white/40 mb-1.5 block uppercase tracking-wider">Phone Number</label>
                        <div className="flex gap-2">
                          {/* Country selector */}
                          <div className="relative">
                            <button
                              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                              disabled={phoneVerified}
                              className="flex items-center gap-2 px-3 py-3 rounded-xl text-sm text-white font-medium disabled:opacity-50 min-w-[140px]"
                              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
                              <span className="text-lg">{selectedCountry.flag}</span>
                              <span className="text-xs font-mono">{selectedCountry.code}</span>
                              <ChevronDown className="w-3 h-3 ml-auto text-white/40" />
                            </button>
                            
                            {showCountryDropdown && (
                              <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute top-full left-0 mt-2 w-56 max-h-64 overflow-y-auto rounded-xl border shadow-2xl z-50"
                                style={{ background: 'rgba(10,11,16,0.98)', borderColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>
                                <div className="p-2">
                                  {COUNTRY_CODES.map(country => (
                                    <button
                                      key={country.code}
                                      onClick={() => { setSelectedCountry(country); setShowCountryDropdown(false); }}
                                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-white/[0.05] transition-colors"
                                    >
                                      <span className="text-lg">{country.flag}</span>
                                      <span className="flex-1 text-left text-white/80">{country.country}</span>
                                      <span className="text-xs font-mono text-white/40">{country.code}</span>
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </div>

                          <input
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder="1234567890"
                            disabled={phoneVerified}
                            className="flex-1 rounded-xl px-4 py-3 text-sm text-white outline-none disabled:opacity-50"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
                          />
                          {!phoneVerified && (
                            <button onClick={handleSendPhoneCode} disabled={phoneLoading || phone.length < 7}
                              className="px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40 flex items-center gap-1.5 flex-shrink-0"
                              style={{ background: 'rgba(255,92,0,0.2)', border: '1px solid rgba(255,92,0,0.3)' }}>
                              {phoneLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Smartphone className="w-3 h-3" />}
                              {phoneSent ? 'Resend' : 'Send Code'}
                            </button>
                          )}
                          {phoneVerified && <StatusBadge verified />}
                        </div>
                        {phoneVerified && (
                          <div className="mt-2 text-xs font-mono" style={{ color: '#10b981' }}>
                            ✓ Verified: {selectedCountry.code}{phone}
                          </div>
                        )}
                      </div>

                      {phoneSent && !phoneVerified && (
                        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                          <InputField
                            label="Verification Code"
                            value={phoneCode}
                            onChange={e => setPhoneCode(e.target.value)}
                            placeholder="Enter 6-digit code"
                            hint="Enter the code sent to your phone via SMS"
                          />
                          <button onClick={handleVerifyPhone} disabled={phoneCode.length < 4}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                            style={{ background: 'linear-gradient(90deg, #10b981, #059669)' }}>
                            <CheckCircle className="w-4 h-4" /> Verify Phone
                          </button>
                        </motion.div>
                      )}
                    </div>
                  </Card>

                  {/* Two-Factor Auth */}
                  <Card title="Two-Factor Authentication" subtitle="Add an extra layer of security with authenticator app 2FA">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: twoFAEnabled ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.06)', border: `1px solid ${twoFAEnabled ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.1)'}` }}>
                          <Key className="w-5 h-5" style={{ color: twoFAEnabled ? '#10b981' : 'rgba(255,255,255,0.4)' }} />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">Authenticator App (TOTP)</div>
                          <div className="text-[11px] text-white/30 font-mono mt-0.5">{twoFAEnabled ? 'Active — Your account is protected' : 'Not enabled — Recommended for security'}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge verified={twoFAEnabled} />
                        <button onClick={() => setTwoFAEnabled(v => !v)}
                          className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                          style={{
                            background: twoFAEnabled ? 'rgba(239,68,68,0.1)' : 'rgba(255,92,0,0.15)',
                            border: twoFAEnabled ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(255,92,0,0.3)',
                            color: twoFAEnabled ? '#ef4444' : '#FF5C00',
                          }}>
                          {twoFAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                        </button>
                      </div>
                    </div>
                  </Card>

                  {/* Password */}
                  <Card title="Password" subtitle="Update your login password">
                    <div className="space-y-3">
                      <InputField label="Current Password" type="password" placeholder="••••••••" />
                      <InputField label="New Password" type="password" placeholder="••••••••" hint="At least 8 characters with a mix of letters and numbers" />
                      <InputField label="Confirm New Password" type="password" placeholder="••••••••" />
                    </div>
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                      style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
                      <Save className="w-4 h-4" /> Update Password
                    </button>
                  </Card>
                </>
              )}

              {/* ── WALLETS ── */}
              {activeTab === 'wallets' && (
                <>
                  <Card title="Primary Payout Wallet" subtitle="Select your preferred withdrawal method">
                    <div className="space-y-4">
                      <div>
                        <label className="text-[11px] font-mono text-white/40 mb-2 block uppercase tracking-wider">Wallet Type & Network</label>
                        <div className="grid grid-cols-2 gap-3">
                          {WALLET_TYPES.map(wallet => (
                            <button
                              key={wallet.value}
                              onClick={() => setSelectedWalletType(wallet.value)}
                              className={`p-4 rounded-xl text-left border transition-all ${
                                selectedWalletType === wallet.value
                                  ? 'border-primary/50'
                                  : 'border-white/[0.08] hover:border-white/20'
                              }`}
                              style={{
                                background: selectedWalletType === wallet.value
                                  ? 'linear-gradient(135deg, rgba(255,92,0,0.1), rgba(255,92,0,0.05))'
                                  : 'rgba(255,255,255,0.03)'
                              }}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <div className={`w-2 h-2 rounded-full ${
                                  selectedWalletType === wallet.value ? 'bg-primary' : 'bg-white/20'
                                }`} />
                                <span className="text-sm font-semibold text-white">{wallet.label}</span>
                              </div>
                              <div className="text-[10px] font-mono text-white/40 ml-4">{wallet.network}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <InputField
                          label={`${WALLET_TYPES.find(w => w.value === selectedWalletType)?.label} Address`}
                          value={wallets[selectedWalletType] || ''}
                          onChange={e => setWallets(w => ({ ...w, [selectedWalletType]: e.target.value }))}
                          placeholder={WALLET_TYPES.find(w => w.value === selectedWalletType)?.placeholder || ''}
                          hint={`Enter your ${selectedWalletType.toUpperCase()} wallet address for withdrawals`}
                        />
                      </div>
                    </div>
                    <button onClick={() => saveMutation.mutate({ ...wallets, payout_wallet_type: selectedWalletType, payout_wallet_address: wallets[selectedWalletType] })}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                      style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
                      <Save className="w-4 h-4" /> Save Primary Wallet
                    </button>
                  </Card>

                  <Card title="Additional Wallet Addresses" subtitle="Save multiple wallets for flexibility">
                    <div className="space-y-4">
                      {WALLET_TYPES.filter(w => w.value !== selectedWalletType).map(({ value, label, placeholder }) => (
                        <InputField
                          key={value}
                          label={label}
                          value={wallets[value] || ''}
                          onChange={e => setWallets(w => ({ ...w, [value]: e.target.value }))}
                          placeholder={placeholder}
                        />
                      ))}
                    </div>
                    <button onClick={() => saveMutation.mutate(wallets)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                      style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
                      <Save className="w-4 h-4" /> Save All Wallets
                    </button>
                  </Card>
                </>
              )}

              {/* ── NOTIFICATIONS ── */}
              {activeTab === 'notifications' && (
                <Card title="Notification Preferences" subtitle="Choose what alerts you want to receive">
                  <div className="space-y-1">
                    {[
                      { key: 'email', label: 'Email Notifications', sub: 'Receive account updates via email', icon: Mail },
                      { key: 'payouts', label: 'Payout Alerts', sub: 'Get notified when payouts are processed', icon: Wallet },
                      { key: 'news', label: 'Market News', sub: 'Breaking market news and economic alerts', icon: Bell },
                      { key: 'marketing', label: 'Promotions & Offers', sub: 'Promotional offers and discounts', icon: Bell },
                    ].map(({ key, label, sub, icon: Icon }) => (
                      <div key={key} className="flex items-center justify-between py-4 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                            <Icon className="w-4 h-4 text-white/30" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white">{label}</div>
                            <div className="text-[11px] text-white/30 font-mono">{sub}</div>
                          </div>
                        </div>
                        <button onClick={() => setNotifs(n => ({ ...n, [key]: !n[key] }))}
                          className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0`}
                          style={{ background: notifs[key] ? '#FF5C00' : 'rgba(255,255,255,0.1)' }}>
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${notifs[key] ? 'left-7' : 'left-1'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}