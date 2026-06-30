import React, { useState } from 'react';
import { DollarSign, Percent, Calendar, Clock, Users, Shield, Check, X, Save } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AdminFirstTimeDiscount() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['promotion-settings'],
    queryFn: async () => {
      const list = await base44.entities.PromotionSettings.filter({ setting_key: 'first_time_discount' });
      return list[0] || null;
    },
  });

  const { data: discountUsage } = useQuery({
    queryKey: ['discount-usage'],
    queryFn: () => base44.entities.FirstTimeDiscount.list('-created_at', 100),
    enabled: !!settings,
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (settings?.id) {
        return await base44.entities.PromotionSettings.update(settings.id, data);
      } else {
        return await base44.entities.PromotionSettings.create({
          setting_key: 'first_time_discount',
          ...data,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotion-settings'] });
      toast.success('Settings saved successfully');
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error('Failed to save settings: ' + error.message);
    },
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = {
    total: discountUsage?.length || 0,
    used: discountUsage?.filter(d => d.is_used)?.length || 0,
    active: discountUsage?.filter(d => !d.is_used && new Date(d.expires_at) > new Date())?.length || 0,
    expired: discountUsage?.filter(d => new Date(d.expires_at) < new Date())?.length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">First-Time Discount Settings</h2>
          <p className="text-sm text-white/40 mt-1">Manage the 25% off promotion for new users</p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => {
              setFormData(settings || {
                setting_key: 'first_time_discount',
                is_first_time_discount_active: true,
                first_time_discount_code: 'NEW25',
                first_time_discount_percent: 25,
                max_account_size_for_discount: 50000,
                one_per_ip_mac: true,
                discount_end_date: null,
              });
              setIsEditing(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: '#FF5C00', color: '#FFFFFF' }}
          >
            <Save className="w-4 h-4" /> Edit Settings
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(255,255,255,0.1)', color: '#FFFFFF' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: '#10b981', color: '#FFFFFF' }}
            >
              <Check className="w-4 h-4" /> Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Issued', value: stats.total, icon: Users, color: '#6366F1' },
          { label: 'Used', value: stats.used, icon: Check, color: '#10b981' },
          { label: 'Active', value: stats.active, icon: Clock, color: '#FF5C00' },
          { label: 'Expired', value: stats.expired, icon: X, color: '#ef4444' },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-white/40">{stat.label}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}20` }}>
                  <Icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
              </div>
              <div className="text-2xl font-black text-white">{stat.value}</div>
            </div>
          );
        })}
      </div>

      {/* Settings Form */}
      {isEditing && formData && (
        <div className="rounded-2xl p-6 space-y-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 className="text-lg font-bold text-white mb-4">Promotion Configuration</h3>

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div>
              <div className="text-sm font-semibold text-white">Promotion Active</div>
              <div className="text-xs text-white/40 mt-1">Enable or disable the first-time discount</div>
            </div>
            <button
              onClick={() => setFormData({ ...formData, is_first_time_discount_active: !formData.is_first_time_discount_active })}
              className={`w-12 h-6 rounded-full transition-colors ${formData.is_first_time_discount_active ? 'bg-green-500' : 'bg-white/20'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${formData.is_first_time_discount_active ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Discount Code */}
          <div>
            <label className="text-xs font-semibold text-white/60 mb-2 block">Discount Code</label>
            <input
              type="text"
              value={formData.first_time_discount_code}
              onChange={(e) => setFormData({ ...formData, first_time_discount_code: e.target.value })}
              className="w-full px-4 py-3 rounded-xl text-sm font-mono"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFFFFF' }}
              placeholder="NEW25"
            />
          </div>

          {/* Discount Percent */}
          <div>
            <label className="text-xs font-semibold text-white/60 mb-2 block">Discount Percentage</label>
            <div className="relative">
              <input
                type="number"
                value={formData.first_time_discount_percent}
                onChange={(e) => setFormData({ ...formData, first_time_discount_percent: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 rounded-xl text-sm font-mono pr-12"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFFFFF' }}
                min="0"
                max="100"
              />
              <Percent className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            </div>
          </div>

          {/* Max Account Size */}
          <div>
            <label className="text-xs font-semibold text-white/60 mb-2 block">Max Account Size ($)</label>
            <div className="relative">
              <input
                type="number"
                value={formData.max_account_size_for_discount}
                onChange={(e) => setFormData({ ...formData, max_account_size_for_discount: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 rounded-xl text-sm font-mono"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFFFFF' }}
                min="0"
              />
              <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            </div>
            <p className="text-xs text-white/30 mt-2">Discount applies to accounts up to this size</p>
          </div>

          {/* One Per IP/MAC Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div>
              <div className="text-sm font-semibold text-white">One Per IP/Device</div>
              <div className="text-xs text-white/40 mt-1">Prevent multiple discounts from same IP or device</div>
            </div>
            <button
              onClick={() => setFormData({ ...formData, one_per_ip_mac: !formData.one_per_ip_mac })}
              className={`w-12 h-6 rounded-full transition-colors ${formData.one_per_ip_mac ? 'bg-green-500' : 'bg-white/20'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${formData.one_per_ip_mac ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* End Date */}
          <div>
            <label className="text-xs font-semibold text-white/60 mb-2 block">Promotion End Date</label>
            <input
              type="datetime-local"
              value={formData.discount_end_date ? new Date(formData.discount_end_date).toISOString().slice(0, 16) : ''}
              onChange={(e) => setFormData({ ...formData, discount_end_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFFFFF' }}
            />
            <p className="text-xs text-white/30 mt-2">Leave empty for no expiration</p>
          </div>
        </div>
      )}

      {/* Usage Table */}
      {discountUsage && discountUsage.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <h3 className="text-sm font-bold text-white">Recent Discount Usage</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {['User', 'Code', 'Discount', 'IP Address', 'Created', 'Status', 'Used At'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-white/30">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {discountUsage.slice(0, 20).map(d => (
                  <tr key={d.id} className="border-b hover:bg-white/[0.02] transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <td className="px-6 py-3 text-white/70">{d.user_email}</td>
                    <td className="px-6 py-3">
                      <span className="px-2 py-1 rounded-md text-xs font-mono font-bold" style={{ background: '#FF5C0020', color: '#FF5C00' }}>
                        {d.discount_code}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-white/70">{d.discount_percent}%</td>
                    <td className="px-6 py-3 text-white/40 font-mono text-[10px]">{d.ip_address}</td>
                    <td className="px-6 py-3 text-white/40">
                      {new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${d.is_used ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                        {d.is_used ? 'USED' : 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-white/40">
                      {d.used_at ? new Date(d.used_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}