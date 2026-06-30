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
      <label className="text-sm font-bold text-white/45 mb-2.5 block uppercase tracking-wide">{label}</label>
      <div className="relative">
        <input
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          type={isPass ? (show ? 'text' : 'password') : type}
          className="w-full rounded-xl px-4 py-3 text-base text-white outline-none disabled:opacity-40 transition-all"
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
      {hint && <p className="text-xs text-white/25 mt-1.5 font-mono">{hint}</p>}
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
  { code: '+1', country: 'Canada', flag: '🇨🇦' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+7', country: 'Russia', flag: '🇷🇺' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+52', country: 'Mexico', flag: '🇲🇽' },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
  { code: '+63', country: 'Philippines', flag: '🇵🇭' },
  { code: '+66', country: 'Thailand', flag: '🇹🇭' },
  { code: '+84', country: 'Vietnam', flag: '🇻🇳' },
  { code: '+90', country: 'Turkey', flag: '🇹🇷' },
  { code: '+98', country: 'Iran', flag: '🇮🇷' },
  { code: '+20', country: 'Egypt', flag: '🇪🇬' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+254', country: 'Kenya', flag: '🇰🇪' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
  { code: '+968', country: 'Oman', flag: '🇴🇲' },
  { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
  { code: '+964', country: 'Iraq', flag: '🇮🇶' },
  { code: '+962', country: 'Jordan', flag: '🇯🇴' },
  { code: '+961', country: 'Lebanon', flag: '🇱🇧' },
  { code: '+972', country: 'Israel', flag: '🇮🇱' },
  { code: '+30', country: 'Greece', flag: '🇬🇷' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
  { code: '+32', country: 'Belgium', flag: '🇧🇪' },
  { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
  { code: '+43', country: 'Austria', flag: '🇦🇹' },
  { code: '+45', country: 'Denmark', flag: '🇩🇰' },
  { code: '+46', country: 'Sweden', flag: '🇸🇪' },
  { code: '+47', country: 'Norway', flag: '🇳🇴' },
  { code: '+358', country: 'Finland', flag: '🇫🇮' },
  { code: '+48', country: 'Poland', flag: '🇵🇱' },
  { code: '+420', country: 'Czech Republic', flag: '🇨🇿' },
  { code: '+36', country: 'Hungary', flag: '🇭🇺' },
  { code: '+40', country: 'Romania', flag: '🇷🇴' },
  { code: '+380', country: 'Ukraine', flag: '🇺🇦' },
  { code: '+351', country: 'Portugal', flag: '🇵🇹' },
  { code: '+353', country: 'Ireland', flag: '🇮🇪' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+852', country: 'Hong Kong', flag: '🇭🇰' },
  { code: '+886', country: 'Taiwan', flag: '🇹🇼' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
  { code: '+82', country: 'South Korea', flag: '🇰🇷' },
  { code: '+54', country: 'Argentina', flag: '🇦🇷' },
  { code: '+56', country: 'Chile', flag: '🇨🇱' },
  { code: '+57', country: 'Colombia', flag: '🇨🇴' },
  { code: '+58', country: 'Venezuela', flag: '🇻🇪' },
  { code: '+51', country: 'Peru', flag: '🇵🇪' },
  { code: '+593', country: 'Ecuador', flag: '🇪🇨' },
  { code: '+507', country: 'Panama', flag: '🇵🇦' },
  { code: '+506', country: 'Costa Rica', flag: '🇨🇷' },
  { code: '+212', country: 'Morocco', flag: '🇲🇦' },
  { code: '+213', country: 'Algeria', flag: '🇩🇿' },
  { code: '+216', country: 'Tunisia', flag: '🇹🇳' },
  { code: '+233', country: 'Ghana', flag: '🇬🇭' },
  { code: '+255', country: 'Tanzania', flag: '🇹🇿' },
  { code: '+256', country: 'Uganda', flag: '🇺🇬' },
  { code: '+251', country: 'Ethiopia', flag: '🇪🇹' },
  { code: '+93', country: 'Afghanistan', flag: '🇦🇫' },
  { code: '+7', country: 'Kazakhstan', flag: '🇰🇿' },
  { code: '+998', country: 'Uzbekistan', flag: '🇺🇿' },
  { code: '+994', country: 'Azerbaijan', flag: '🇦🇿' },
  { code: '+374', country: 'Armenia', flag: '🇦🇲' },
  { code: '+995', country: 'Georgia', flag: '🇬🇪' },
  { code: '+370', country: 'Lithuania', flag: '🇱🇹' },
  { code: '+371', country: 'Latvia', flag: '🇱🇻' },
  { code: '+372', country: 'Estonia', flag: '🇪🇪' },
  { code: '+385', country: 'Croatia', flag: '🇭🇷' },
  { code: '+381', country: 'Serbia', flag: '🇷🇸' },
  { code: '+386', country: 'Slovenia', flag: '🇸🇮' },
  { code: '+421', country: 'Slovakia', flag: '🇸🇰' },
  { code: '+354', country: 'Iceland', flag: '🇮🇸' },
  { code: '+352', country: 'Luxembourg', flag: '🇱🇺' },
  { code: '+356', country: 'Malta', flag: '🇲🇹' },
  { code: '+377', country: 'Monaco', flag: '🇲🇨' },
];

const ALL_COUNTRIES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina','Armenia','Australia','Austria',
  'Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados','Belarus','Belgium','Belize','Benin','Bhutan',
  'Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria','Burkina Faso','Burundi','Cabo Verde','Cambodia',
  'Cameroon','Canada','Central African Republic','Chad','Chile','China','Colombia','Comoros','Congo','Costa Rica',
  'Croatia','Cuba','Cyprus','Czech Republic','Denmark','Djibouti','Dominica','Dominican Republic','Ecuador','Egypt',
  'El Salvador','Equatorial Guinea','Eritrea','Estonia','Eswatini','Ethiopia','Fiji','Finland','France','Gabon',
  'Gambia','Georgia','Germany','Ghana','Greece','Grenada','Guatemala','Guinea','Guinea-Bissau','Guyana',
  'Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel',
  'Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kiribati','Kosovo','Kuwait','Kyrgyzstan',
  'Laos','Latvia','Lebanon','Lesotho','Liberia','Libya','Liechtenstein','Lithuania','Luxembourg','Madagascar',
  'Malawi','Malaysia','Maldives','Mali','Malta','Marshall Islands','Mauritania','Mauritius','Mexico','Micronesia',
  'Moldova','Monaco','Mongolia','Montenegro','Morocco','Mozambique','Myanmar','Namibia','Nauru','Nepal',
  'Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Korea','North Macedonia','Norway','Oman','Pakistan',
  'Palau','Palestine','Panama','Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal','Qatar',
  'Romania','Russia','Rwanda','Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines','Samoa','San Marino','Sao Tome and Principe','Saudi Arabia',
  'Senegal','Serbia','Seychelles','Sierra Leone','Singapore','Slovakia','Slovenia','Solomon Islands','Somalia','South Africa',
  'South Korea','South Sudan','Spain','Sri Lanka','Sudan','Suriname','Sweden','Switzerland','Syria','Taiwan',
  'Tajikistan','Tanzania','Thailand','Timor-Leste','Togo','Tonga','Trinidad and Tobago','Tunisia','Turkey','Turkmenistan',
  'Tuvalu','Uganda','Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan','Vanuatu','Vatican City',
  'Venezuela','Vietnam','Yemen','Zambia','Zimbabwe'
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
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
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
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  // 2FA state
  const [twoFAEnabled, setTwoFAEnabled] = useState(user?.two_factor_enabled || false);

  // Google auth state
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleDisconnectLoading, setGoogleDisconnectLoading] = useState(false);

  // Payout wallet selection
  const [selectedWalletType, setSelectedWalletType] = useState(user?.payout_wallet_type || 'usdt_trc20');

  const saveMutation = useMutation({
       mutationFn: (data) => base44.auth.updateMe(data),
     });

    const passwordUpdateMutation = useMutation({
      mutationFn: async (newPassword) => {
        // Base44 Auth - update current user's password
        await base44.auth.updateMe({ password: newPassword });
      },
      onSuccess: () => {
        alert('Password updated successfully!');
        setPasswords({ current: '', new: '', confirm: '' });
      },
      onError: (error) => {
        alert(`Error updating password: ${error.message}`);
      },
    });

    const handlePasswordUpdate = () => {
      if (passwords.new !== passwords.confirm) {
        return alert('New passwords do not match.');
      }
      if (passwords.new.length < 8) {
        return alert('New password must be at least 8 characters long.');
      }
      passwordUpdateMutation.mutate(passwords.new);
    };

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
      // Ensure transparent background for PNG
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, x, y, size, size, 0, 0, 400, 400);

      // Convert to blob and upload - preserve PNG transparency
      canvas.toBlob(async (blob) => {
        // Use PNG format to preserve transparency
        const file = new File([blob], 'profile.png', { type: 'image/png' });
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setProfilePhoto(file_url);
        await base44.auth.updateMe({ avatar_url: file_url, profile_photo_url: file_url });
        setShowCropModal(false);
        setTempImage(null);
      }, 'image/png');
    } catch (err) {
      console.error('Crop failed:', err);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSavePhone = async () => {
    if (!phone || phone.length < 7) return;
    setPhoneLoading(true);
    try {
      const fullPhone = `${selectedCountry.code}${phone.replace(/\D/g, '')}`;
      await base44.auth.updateMe({ phone: fullPhone, phone_verified: true });
    } catch (err) {
      console.error('Failed to save phone:', err);
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleGoogleConnect = async () => {
    setGoogleLoading(true);
    try {
      // Redirect to Google OAuth - the googleAuth function handles the redirect
      window.location.href = '/api/auth/google';
    } catch (err) {
      console.error('Google auth failed:', err);
      setGoogleLoading(false);
    }
  };

  const handleGoogleDisconnect = async () => {
    setGoogleDisconnectLoading(true);
    try {
      await base44.auth.updateMe({ 
        google_linked: false, 
        google_id: null 
      });
    } catch (err) {
      console.error('Google disconnect failed:', err);
    } finally {
      setGoogleDisconnectLoading(false);
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
                  {/* Profile Photo */}
                  <Card title="Profile Photo" subtitle="Upload a profile picture">
                    <div className="flex items-center gap-5">
                      <div className="relative flex-shrink-0">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
                          {profilePhoto
                            ? <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                            : <User className="w-8 h-8 text-white/30" />}
                        </div>
                        {uploadLoading && (
                          <div className="absolute inset-0 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
                            <RefreshCw className="w-5 h-5 text-white animate-spin" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white/60 mb-3">JPG, PNG or WEBP. Max 5MB.</p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                              alert('Please upload JPG, PNG, or WEBP only');
                              return;
                            }
                            if (file.size > 5 * 1024 * 1024) {
                              alert('Image must be under 5MB');
                              return;
                            }
                            setUploadLoading(true);
                            try {
                              const { file_url } = await base44.integrations.Core.UploadFile({ file });
                              setProfilePhoto(file_url);
                              await base44.auth.updateMe({ avatar_url: file_url, profile_photo_url: file_url });
                            } catch (err) {
                              alert('Upload failed: ' + err.message);
                            } finally {
                              setUploadLoading(false);
                              e.target.value = '';
                            }
                          }}
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadLoading}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
                          style={{ background: 'rgba(255,92,0,0.15)', border: '1px solid rgba(255,92,0,0.3)' }}>
                          <Upload className="w-4 h-4" />
                          {uploadLoading ? 'Uploading...' : 'Upload Photo'}
                        </button>
                      </div>
                    </div>
                  </Card>

                  <Card title="Personal Information" subtitle="Update your profile and contact details">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField label="Full Name" value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} placeholder="John Doe" />
                      <InputField label="Email Address" value={profile.email} placeholder="your@email.com" disabled hint="Email cannot be changed" />
                      <InputField label="Phone" value={profile.phone || user?.phone || ''} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+1234567890" />
                      <InputField label="Username" value={profile.username || ''} onChange={e => setProfile(p => ({ ...p, username: e.target.value }))} placeholder="trader_john" />
                      {/* Country - searchable dropdown */}
                      <div>
                        <label className="text-sm font-bold text-white/45 mb-2.5 block uppercase tracking-wide">Country</label>
                        <div className="relative">
                          <select
                            value={profile.country || user?.country || ''}
                            onChange={e => setProfile(p => ({ ...p, country: e.target.value }))}
                            className="w-full rounded-xl px-4 py-3 text-base text-white outline-none appearance-none"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
                            onFocus={e => e.currentTarget.style.borderColor = 'rgba(255,92,0,0.4)'}
                            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'}>
                            <option value="">Select Country</option>
                            {ALL_COUNTRIES.map(c => (
                              <option key={c} value={c} style={{ background: '#0c0c0f' }}>{c}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                        </div>
                      </div>
                      <InputField label="City" value={profile.city || user?.city || ''} onChange={e => setProfile(p => ({ ...p, city: e.target.value }))} placeholder="New York" />
                      <InputField label="Address" value={profile.address || user?.address || ''} onChange={e => setProfile(p => ({ ...p, address: e.target.value }))} placeholder="123 Main St" />
                      <InputField label="Postal Code" value={profile.postal_code || user?.postal_code || ''} onChange={e => setProfile(p => ({ ...p, postal_code: e.target.value }))} placeholder="10001" />
                    </div>
                    <button onClick={() => { saveMutation.mutate(profile); }} disabled={saveMutation.isPending}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                      style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
                      <Save className="w-4 h-4" /> {saveMutation.isPending ? 'Saving…' : 'Save All Changes'}
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
                        onClick={user?.google_linked ? handleGoogleDisconnect : handleGoogleConnect}
                        disabled={googleLoading || googleDisconnectLoading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                        style={{
                          background: user?.google_linked ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.06)',
                          border: user?.google_linked ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(255,255,255,0.12)',
                          color: user?.google_linked ? '#ef4444' : 'rgba(255,255,255,0.9)',
                        }}>
                        {googleLoading || googleDisconnectLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Chrome className="w-4 h-4" />}
                        {googleLoading ? 'Connecting...' : googleDisconnectLoading ? 'Disconnecting...' : user?.google_linked ? 'Disconnect Google' : 'Connect with Google'}
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
                              className="flex items-center gap-2 px-3 py-3 rounded-xl text-sm text-white font-medium min-w-[140px]"
                              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
                              <span className="text-lg">{selectedCountry.flag}</span>
                              <span className="text-xs font-mono">{selectedCountry.code}</span>
                              <ChevronDown className="w-3 h-3 ml-auto text-white/40" />
                            </button>
                            
                            {showCountryDropdown && (
                              <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute top-full left-0 mt-2 w-64 max-h-96 overflow-y-auto rounded-xl border shadow-2xl z-50"
                                style={{ background: 'rgba(10,11,16,0.98)', borderColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>
                                <div className="p-2 sticky top-0 bg-[rgba(10,11,16,0.98)] border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                  <input
                                    type="text"
                                    placeholder="Search country..."
                                    className="w-full px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10 text-white outline-none focus:border-primary/50"
                                    onChange={(e) => {
                                      const search = e.target.value.toLowerCase();
                                      const buttons = document.querySelectorAll('[data-country-btn]');
                                      buttons.forEach(btn => {
                                        const text = btn.textContent.toLowerCase();
                                        btn.style.display = text.includes(search) ? 'flex' : 'none';
                                      });
                                    }}
                                  />
                                </div>
                                <div className="p-2 max-h-[320px] overflow-y-auto">
                                  {COUNTRY_CODES.map(country => (
                                    <button
                                      key={country.code + country.country}
                                      data-country-btn
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
                            className="flex-1 rounded-xl px-4 py-3 text-sm text-white outline-none"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
                          />
                          <button onClick={handleSavePhone} disabled={phoneLoading || phone.length < 7}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40 flex items-center gap-1.5 flex-shrink-0"
                            style={{ background: 'rgba(255,92,0,0.2)', border: '1px solid rgba(255,92,0,0.3)' }}>
                            {phoneLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                            Save
                          </button>
                        </div>
                        {user?.phone && (
                          <div className="mt-2 text-xs font-mono" style={{ color: '#10b981' }}>
                            ✓ Saved: {user.phone}
                          </div>
                        )}
                      </div>
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
                          <div className="text-[11px] text-white/30 font-mono mt-0.5">{twoFAEnabled ? 'Active - Your account is protected' : 'Not enabled - Recommended for security'}</div>
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
                      <InputField label="New Password" type="password" placeholder="••••••••" value={passwords.new} onChange={e => setPasswords(p => ({...p, new: e.target.value}))} hint="At least 8 characters with a mix of letters and numbers" />
                      <InputField label="Confirm New Password" type="password" placeholder="••••••••" value={passwords.confirm} onChange={e => setPasswords(p => ({...p, confirm: e.target.value}))} />
                      
                    </div>
                    <button onClick={handlePasswordUpdate}
                                           disabled={passwordUpdateMutation.isPending}
                                           className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                                           style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
                                           <Save className="w-4 h-4" /> {passwordUpdateMutation.isPending ? 'Updating...' : 'Update Password'}
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