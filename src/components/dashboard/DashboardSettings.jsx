import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Settings, User, Lock, Wallet, Bell, Save, Upload, Camera } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'wallets', label: 'Payout Wallets', icon: Wallet },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

export default function DashboardSettings({ user }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({ full_name: user?.full_name || '', email: user?.email || '' });
  const [wallets, setWallets] = useState({ usdt_trc20: '', bitcoin: '' });
  const [notifs, setNotifs] = useState({ email: true, payouts: true, news: false, marketing: false });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef(null);

  const saveMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
  });

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    setUploadLoading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProfilePhoto(file_url);
      await base44.auth.updateMe({ profile_photo_url: file_url });
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
          <Settings className="w-6 h-6 text-primary" /> Settings
        </h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">Manage your Robert Funds account</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-44 flex-shrink-0">
          <div className="space-y-1">
            {tabs.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    activeTab === t.id ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}>
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="text-base font-bold text-foreground mb-5">Profile Information</h3>
              
              {/* Profile Photo */}
              <div className="mb-6">
                <label className="text-xs font-mono text-muted-foreground mb-3 block uppercase">Profile Photo</label>
                <div className="flex items-center gap-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="w-20 h-20 rounded-xl flex items-center justify-center text-2xl font-bold border-2"
                    style={{
                      background: profilePhoto ? `url(${profilePhoto})` : 'linear-gradient(135deg, rgba(255,92,0,0.1), rgba(204,255,0,0.05))',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderColor: 'rgba(255,92,0,0.3)',
                    }}>
                    {!profilePhoto && (user?.full_name?.charAt(0)?.toUpperCase() || '?')}
                  </motion.div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadLoading}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                      style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
                      <Upload className="w-4 h-4" /> {uploadLoading ? 'Uploading...' : 'Upload Photo'}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={e => handlePhotoUpload(e.target.files?.[0])}
                      className="hidden"
                    />
                    <p className="text-[11px] text-muted-foreground">JPG, PNG max 5MB</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                {[
                  { label: 'Full Name', key: 'full_name', placeholder: 'Your full name' },
                  { label: 'Email', key: 'email', placeholder: 'your@email.com', disabled: true },
                ].map(({ label, key, placeholder, disabled }) => (
                  <div key={key}>
                    <label className="text-xs font-mono text-muted-foreground mb-1.5 block uppercase">{label}</label>
                    <input value={profile[key] || ''} onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder} disabled={disabled}
                      className="w-full rounded-xl px-4 py-3 text-sm text-foreground outline-none disabled:opacity-50"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                ))}
              </div>
              <button onClick={() => saveMutation.mutate({ full_name: profile.full_name })}
                disabled={saveMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
                <Save className="w-4 h-4" /> {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {activeTab === 'wallets' && (
            <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="text-base font-bold text-foreground mb-5">Payout Wallet Addresses</h3>
              <div className="space-y-4 mb-6">
                {[
                  { label: '₮ USDT TRC20 Address', key: 'usdt_trc20', placeholder: 'T...' },
                  { label: '₿ Bitcoin Address', key: 'bitcoin', placeholder: '1... or bc1...' },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs font-mono text-muted-foreground mb-1.5 block">{label}</label>
                    <input value={wallets[key]} onChange={e => setWallets(w => ({ ...w, [key]: e.target.value }))} placeholder={placeholder}
                      className="w-full rounded-xl px-4 py-3 text-sm font-mono text-foreground outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                ))}
              </div>
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
                <Save className="w-4 h-4" /> Save Wallets
              </button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="text-base font-bold text-foreground mb-5">Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { key: 'email', label: 'Email Notifications', sub: 'Receive updates via email' },
                  { key: 'payouts', label: 'Payout Alerts', sub: 'Get notified when payouts are processed' },
                  { key: 'news', label: 'Market News', sub: 'Breaking market news alerts' },
                  { key: 'marketing', label: 'Promotions', sub: 'Promotional offers and discounts' },
                ].map(({ key, label, sub }) => (
                  <div key={key} className="flex items-center justify-between py-3 border-b border-white/5">
                    <div>
                      <div className="text-sm font-semibold text-foreground">{label}</div>
                      <div className="text-xs text-muted-foreground">{sub}</div>
                    </div>
                    <button onClick={() => setNotifs(n => ({ ...n, [key]: !n[key] }))}
                      className={`w-11 h-6 rounded-full transition-all relative ${notifs[key] ? 'bg-primary' : 'bg-white/10'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${notifs[key] ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="text-base font-bold text-foreground mb-5">Security Settings</h3>
              <p className="text-sm text-muted-foreground mb-4">Password changes are managed through the Robert Funds authentication system.</p>
              <button className="px-5 py-2.5 rounded-xl text-sm font-semibold text-foreground transition-colors hover:bg-white/5"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                Change Password
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}