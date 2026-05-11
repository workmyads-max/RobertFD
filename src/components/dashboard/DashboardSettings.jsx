import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, User, Lock, Wallet, Bell, Save, Upload,
  Smartphone, Shield, CheckCircle, AlertCircle, Mail,
  Phone, Key, Eye, EyeOff, Chrome, RefreshCw
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';

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

export default function DashboardSettings({ user }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({ full_name: user?.full_name || '', email: user?.email || '' });
  const [wallets, setWallets] = useState({ usdt_trc20: user?.usdt_trc20 || '', bitcoin: user?.bitcoin || '' });
  const [notifs, setNotifs] = useState({ email: true, payouts: true, news: false, marketing: false });
  const [uploadLoading, setUploadLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(user?.profile_photo_url || user?.avatar_url || null);
  const fileInputRef = useRef(null);

  // Phone verification state
  const [phone, setPhone] = useState(user?.phone || '');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneSent, setPhoneSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);

  // 2FA state
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);

  const saveMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
  });

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    setUploadLoading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProfilePhoto(file_url);
      await base44.auth.updateMe({ avatar_url: file_url, profile_photo_url: file_url });
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSendPhoneCode = () => {
    if (!phone) return;
    setPhoneLoading(true);
    setTimeout(() => { setPhoneSent(true); setPhoneLoading(false); }, 1200);
  };

  const handleVerifyPhone = () => {
    if (phoneCode === '123456' || phoneCode.length === 6) {
      setPhoneVerified(true);
      saveMutation.mutate({ phone });
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
                        <p className="text-[10px] text-white/25 font-mono mt-1.5">JPG, PNG, max 5MB</p>
                      </div>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={e => handlePhotoUpload(e.target.files?.[0])} className="hidden" />
                    </div>
                  </Card>

                  <Card title="Personal Information" subtitle="Update your public profile details">
                    <div className="space-y-4">
                      <InputField label="Full Name" value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} placeholder="Your full name" />
                      <InputField label="Email Address" value={profile.email} placeholder="your@email.com" disabled hint="Email cannot be changed — contact support if needed" />
                    </div>
                    <button onClick={() => saveMutation.mutate({ full_name: profile.full_name })} disabled={saveMutation.isPending}
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
                    <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
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
                      <div className="flex items-center gap-3">
                        <StatusBadge verified={!!user?.google_linked} />
                        <button
                          className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                          style={{
                            background: user?.google_linked ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.06)',
                            border: user?.google_linked ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(255,255,255,0.12)',
                            color: user?.google_linked ? '#ef4444' : 'rgba(255,255,255,0.7)',
                          }}>
                          {user?.google_linked ? 'Disconnect' : 'Connect Google'}
                        </button>
                      </div>
                    </div>
                  </Card>

                  {/* Phone Verification */}
                  <Card title="Phone Verification" subtitle="Verify your phone number for enhanced account security">
                    <div className="space-y-4">
                      <div>
                        <label className="text-[11px] font-mono text-white/40 mb-1.5 block uppercase tracking-wider">Phone Number</label>
                        <div className="flex gap-2">
                          <div className="flex items-center px-3 rounded-xl text-sm text-white/60 flex-shrink-0"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
                            <Phone className="w-3.5 h-3.5 mr-1.5 text-white/30" />
                            <span className="text-xs font-mono">+1</span>
                          </div>
                          <input
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder="(555) 000-0000"
                            disabled={phoneVerified}
                            className="flex-1 rounded-xl px-4 py-3 text-sm text-white outline-none disabled:opacity-50"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
                          />
                          {!phoneVerified && (
                            <button onClick={handleSendPhoneCode} disabled={phoneLoading || !phone}
                              className="px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40 flex items-center gap-1.5 flex-shrink-0"
                              style={{ background: 'rgba(255,92,0,0.2)', border: '1px solid rgba(255,92,0,0.3)' }}>
                              {phoneLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Smartphone className="w-3 h-3" />}
                              {phoneSent ? 'Resend' : 'Send Code'}
                            </button>
                          )}
                          {phoneVerified && <StatusBadge verified />}
                        </div>
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
                <Card title="Payout Wallet Addresses" subtitle="These wallets will be used for profit withdrawals">
                  <div className="space-y-4">
                    {[
                      { label: '₮ USDT TRC20 Address', key: 'usdt_trc20', placeholder: 'T...', hint: 'Tron (TRC20) USDT wallet address' },
                      { label: '₿ Bitcoin Address', key: 'bitcoin', placeholder: '1... or bc1...', hint: 'Native SegWit (bc1...) or Legacy (1...)' },
                    ].map(({ label, key, placeholder, hint }) => (
                      <InputField key={key} label={label} value={wallets[key]} onChange={e => setWallets(w => ({ ...w, [key]: e.target.value }))} placeholder={placeholder} hint={hint} />
                    ))}
                  </div>
                  <button onClick={() => saveMutation.mutate(wallets)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
                    <Save className="w-4 h-4" /> Save Wallets
                  </button>
                </Card>
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