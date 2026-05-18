import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Power, RefreshCw, X, Check, AlertCircle, Eye, EyeOff, Copy } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const PROVIDERS = [
  { value: 'checkout_com', label: 'Checkout.com', icon: '💳', color: '#007AFF' },
  { value: 'confirmo', label: 'Confirmo', icon: '🪙', color: '#FF6B00' },
  { value: 'manual_crypto', label: 'Manual Crypto', icon: '🔐', color: '#10B981' },
  { value: 'nowpayments', label: 'NOWPayments', icon: '⚡', color: '#6C5CE7' },
  { value: 'coinpayments', label: 'CoinPayments', icon: '💰', color: '#F39C12' },
];

const CARD_TYPES = ['visa', 'mastercard', 'amex', 'apple_pay', 'google_pay'];
const CRYPTO_NETWORKS = ['TRC20', 'ERC20', 'BTC', 'SOL', 'MATIC', 'BEP20'];

export default function AdminPaymentControl() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showSecrets, setShowSecrets] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    provider: 'manual_crypto',
    is_active: true,
    sandbox_mode: false,
    api_key: '',
    secret_key: '',
    webhook_secret: '',
    webhook_url: '',
    supported_cards: [],
    supported_crypto: [],
    networks: [],
    wallets: [],
    notes: '',
  });

  const { data: gateways = [], isLoading } = useQuery({
    queryKey: ['payment-gateways'],
    queryFn: () => base44.entities.PaymentGateway.list('-created_date', 50),
    retry: 1,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PaymentGateway.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-gateways'] });
      resetForm();
      setShowModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.PaymentGateway.update(editingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-gateways'] });
      resetForm();
      setShowModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PaymentGateway.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payment-gateways'] }),
  });

  const resetForm = () => {
    setFormData({
      name: '',
      provider: 'manual_crypto',
      is_active: true,
      sandbox_mode: false,
      api_key: '',
      secret_key: '',
      webhook_secret: '',
      webhook_url: '',
      supported_cards: [],
      supported_crypto: [],
      networks: [],
      wallets: [],
      notes: '',
    });
    setEditingId(null);
  };

  const handleEdit = (gateway) => {
    setFormData(gateway);
    setEditingId(gateway.id);
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.provider) return;
    if (editingId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleActive = (id, currentStatus) => {
    updateMutation.mutate({ is_active: !currentStatus });
  };

  const provider = PROVIDERS.find(p => p.value === formData.provider);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,92,0,0.12)', border: '1px solid rgba(255,92,0,0.2)' }}>
              💳
            </div>
            Payment Gateways
          </h1>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(90deg, #FF5C00, #FF7A2F)' }}>
            <Plus className="w-4 h-4" /> Add Gateway
          </button>
        </div>
        <p className="text-sm text-white/30 font-mono">Configure payment providers for challenge checkout</p>
      </div>

      {/* Gateways Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-white/30">Loading gateways...</div>
        ) : gateways.length === 0 ? (
          <div className="col-span-full rounded-2xl p-8 text-center" style={{ background: 'rgba(255,92,0,0.05)', border: '1px solid rgba(255,92,0,0.15)' }}>
            <div className="text-2xl mb-2">🔌</div>
            <h3 className="text-lg font-bold text-white mb-1">No Payment Gateways</h3>
            <p className="text-sm text-white/40 mb-4">Add your first payment gateway to enable checkouts</p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="px-4 py-2 rounded-lg text-sm font-bold text-white" style={{ background: '#FF5C00' }}>
              Add Gateway
            </button>
          </div>
        ) : (
          gateways.map(gateway => {
            const prov = PROVIDERS.find(p => p.value === gateway.provider);
            return (
              <motion.div
                key={gateway.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{prov?.icon}</div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{gateway.name}</h3>
                      <p className="text-[10px] text-white/40 font-mono">{prov?.label}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateMutation.mutate({ is_active: !gateway.is_active })}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      gateway.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                    <Power className="w-4 h-4" />
                  </button>
                </div>

                {gateway.sandbox_mode && (
                  <div className="mb-3 px-2 py-1 rounded-lg text-[9px] font-mono text-yellow-400" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)' }}>
                    🧪 SANDBOX MODE
                  </div>
                )}

                <div className="space-y-2 mb-4 text-[10px]">
                  {gateway.api_key && (
                    <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <span className="text-white/40 font-mono">API Key</span>
                      <span className="text-white/60 font-mono">●●●●●●●●</span>
                    </div>
                  )}
                  {gateway.supported_cards?.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap text-white/50">
                      {gateway.supported_cards.map(card => <span key={card} className="px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>{card}</span>)}
                    </div>
                  )}
                  {gateway.networks?.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap text-white/50">
                      {gateway.networks.slice(0, 3).map(net => <span key={net} className="px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,92,0,0.15)', color: '#FF5C00' }}>{net}</span>)}
                      {gateway.networks.length > 3 && <span className="px-2 py-0.5 text-white/40">+{gateway.networks.length - 3}</span>}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(gateway)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white transition-all"
                    style={{ background: 'rgba(255,92,0,0.1)', border: '1px solid rgba(255,92,0,0.25)' }}>
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(gateway.id)}
                    className="flex items-center justify-center px-3 py-2 rounded-lg text-xs font-bold text-red-400 transition-all"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)' }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
              style={{ background: 'rgba(14,14,16,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}>
              
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-white">{editingId ? 'Edit Gateway' : 'Add Payment Gateway'}</h2>
                <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Provider Selection */}
                <div>
                  <label className="text-[11px] font-mono text-white/40 mb-2 block uppercase">Provider</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {PROVIDERS.map(p => (
                      <button
                        key={p.value}
                        onClick={() => setFormData({ ...formData, provider: p.value })}
                        className={`p-3 rounded-lg text-center text-xs font-bold transition-all ${
                          formData.provider === p.value
                            ? 'ring-2 text-white'
                            : 'text-white/50 hover:text-white/70'
                        }`}
                        style={{
                          background: formData.provider === p.value ? `${p.color}20` : 'rgba(255,255,255,0.04)',
                          borderColor: formData.provider === p.value ? p.color : 'rgba(255,255,255,0.08)',
                          border: '1px solid',
                        }}>
                        <div className="text-lg mb-1">{p.icon}</div>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="text-[11px] font-mono text-white/40 mb-1.5 block uppercase">Gateway Name</label>
                  <input
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., My Checkout.com Account"
                    className="w-full rounded-lg px-4 py-2.5 text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>

                {/* Sandbox Mode */}
                {['checkout_com', 'confirmo'].includes(formData.provider) && (
                  <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}>
                    <input
                      type="checkbox"
                      checked={formData.sandbox_mode}
                      onChange={e => setFormData({ ...formData, sandbox_mode: e.target.checked })}
                      className="w-4 h-4" />
                    <label className="text-xs text-white/70">Test Mode (Sandbox)</label>
                  </div>
                )}

                {/* API Keys */}
                {['checkout_com', 'confirmo', 'nowpayments', 'coinpayments'].includes(formData.provider) && (
                  <>
                    <div>
                      <label className="text-[11px] font-mono text-white/40 mb-1.5 block uppercase">API Key</label>
                      <input
                        type="password"
                        value={formData.api_key}
                        onChange={e => setFormData({ ...formData, api_key: e.target.value })}
                        placeholder="Your API Key"
                        className="w-full rounded-lg px-4 py-2.5 text-sm text-white outline-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    </div>

                    {['checkout_com'].includes(formData.provider) && (
                      <div>
                        <label className="text-[11px] font-mono text-white/40 mb-1.5 block uppercase">Secret Key</label>
                        <input
                          type="password"
                          value={formData.secret_key}
                          onChange={e => setFormData({ ...formData, secret_key: e.target.value })}
                          placeholder="Your Secret Key"
                          className="w-full rounded-lg px-4 py-2.5 text-sm text-white outline-none"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                      </div>
                    )}

                    <div>
                      <label className="text-[11px] font-mono text-white/40 mb-1.5 block uppercase">Webhook Secret</label>
                      <input
                        type="password"
                        value={formData.webhook_secret}
                        onChange={e => setFormData({ ...formData, webhook_secret: e.target.value })}
                        placeholder="For signature verification"
                        className="w-full rounded-lg px-4 py-2.5 text-sm text-white outline-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    </div>
                  </>
                )}

                {/* Card Support */}
                {formData.provider === 'checkout_com' && (
                  <div>
                    <label className="text-[11px] font-mono text-white/40 mb-2 block uppercase">Supported Cards</label>
                    <div className="flex flex-wrap gap-2">
                      {CARD_TYPES.map(card => (
                        <button
                          key={card}
                          onClick={() =>
                            setFormData({
                              ...formData,
                              supported_cards: formData.supported_cards.includes(card)
                                ? formData.supported_cards.filter(c => c !== card)
                                : [...formData.supported_cards, card],
                            })
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            formData.supported_cards.includes(card)
                              ? 'text-white'
                              : 'text-white/50'
                          }`}
                          style={{
                            background: formData.supported_cards.includes(card)
                              ? '#FF5C00'
                              : 'rgba(255,255,255,0.05)',
                          }}>
                          {card}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Crypto Networks */}
                {['manual_crypto', 'confirmo', 'nowpayments', 'coinpayments'].includes(formData.provider) && (
                  <div>
                    <label className="text-[11px] font-mono text-white/40 mb-2 block uppercase">Supported Networks</label>
                    <div className="flex flex-wrap gap-2">
                      {CRYPTO_NETWORKS.map(net => (
                        <button
                          key={net}
                          onClick={() =>
                            setFormData({
                              ...formData,
                              networks: formData.networks.includes(net)
                                ? formData.networks.filter(n => n !== net)
                                : [...formData.networks, net],
                            })
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            formData.networks.includes(net)
                              ? 'text-white'
                              : 'text-white/50'
                          }`}
                          style={{
                            background: formData.networks.includes(net)
                              ? '#10B981'
                              : 'rgba(255,255,255,0.05)',
                          }}>
                          {net}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="text-[11px] font-mono text-white/40 mb-1.5 block uppercase">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Internal notes..."
                    rows="3"
                    className="w-full rounded-lg px-4 py-2.5 text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold text-white"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || updateMutation.isPending || !formData.name}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white disabled:opacity-50"
                    style={{ background: '#FF5C00' }}>
                    {createMutation.isPending || updateMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {editingId ? 'Update' : 'Create'} Gateway
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}