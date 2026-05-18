import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Plus, Edit, Trash2, Shield, CheckCircle, XCircle, Globe, Key } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const PROVIDER_LABELS = {
  checkout_com: 'Checkout.com (Cards)',
  confirmo: 'Confirmo (Crypto)',
  manual_crypto: 'Manual Crypto',
  nowpayments: 'NOWPayments',
  coinpayments: 'CoinPayments',
  coinbase_commerce: 'Coinbase Commerce',
  binance_pay: 'Binance Pay',
  custom: 'Custom API',
};

const BLANK_WALLET = { currency: '', network: '', address: '', label: '' };
const BLANK_GW = {
  name: '', provider: 'manual_crypto', is_active: true,
  api_key: '', secret_key: '', webhook_secret: '', webhook_url: '',
  networks: [], wallets: [], notes: '',
  sandbox_mode: false,
  supported_cards: ['visa', 'mastercard', 'amex'],
  supported_crypto: ['BTC', 'ETH', 'USDT', 'USDC'],
};

function Field({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label className="text-[10px] font-mono text-muted-foreground mb-1 block uppercase tracking-wider">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-lg px-3 py-2 text-xs font-mono text-foreground outline-none"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
    </div>
  );
}

export default function AdminWalletSettings() {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(BLANK_GW);
  const [newWallet, setNewWallet] = useState(BLANK_WALLET);
  const qc = useQueryClient();

  const { data: gateways = [], isLoading } = useQuery({
    queryKey: ['payment-gateways'],
    queryFn: () => base44.entities.PaymentGateway.list('-created_date', 50),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editItem
      ? base44.entities.PaymentGateway.update(editItem.id, data)
      : base44.entities.PaymentGateway.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payment-gateways'] }); setShowForm(false); setEditItem(null); setForm(BLANK_GW); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PaymentGateway.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment-gateways'] }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.PaymentGateway.update(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment-gateways'] }),
  });

  const openNew = () => { setEditItem(null); setForm({ ...BLANK_GW }); setShowForm(true); };
  const openEdit = (gw) => { setEditItem(gw); setForm({ ...gw }); setShowForm(true); };

  const addWallet = () => {
    if (!newWallet.currency || !newWallet.address) return;
    setForm(f => ({ ...f, wallets: [...(f.wallets || []), { ...newWallet }] }));
    setNewWallet(BLANK_WALLET);
  };
  const removeWallet = (idx) => setForm(f => ({ ...f, wallets: f.wallets.filter((_, i) => i !== idx) }));

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <Wallet className="w-6 h-6 text-primary" /> Payment Gateways & Wallets
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">Manage crypto payment APIs, wallet addresses and networks</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white hover:scale-105 transition-all"
          style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)', boxShadow: '0 4px 16px rgba(255,92,0,0.3)' }}>
          <Plus className="w-4 h-4" /> Add Gateway
        </button>
      </div>

      {isLoading ? (
        <div className="py-16 text-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : gateways.length === 0 ? (
        <div className="rounded-2xl p-10 text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <div className="text-3xl mb-3">💳</div>
          <div className="text-sm font-semibold text-foreground mb-1">No payment gateways configured</div>
          <div className="text-xs text-muted-foreground">Add your first gateway to enable crypto payment processing</div>
        </div>
      ) : (
        <div className="space-y-4">
          {gateways.map(gw => (
            <motion.div key={gw.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${gw.is_active ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.07)'}` }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">{gw.name}</div>
                    <div className="text-xs font-mono text-muted-foreground">{PROVIDER_LABELS[gw.provider] || gw.provider}</div>
                  </div>
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ml-2 ${gw.is_active ? 'text-emerald-400' : 'text-muted-foreground'}`}
                    style={{ background: gw.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${gw.is_active ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)'}` }}>
                    {gw.is_active ? <CheckCircle className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                    {gw.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleMutation.mutate({ id: gw.id, is_active: !gw.is_active })}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all hover:bg-white/5"
                    style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(var(--muted-foreground))' }}>
                    {gw.is_active ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => openEdit(gw)} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <Edit className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => { if (confirm('Delete this gateway?')) deleteMutation.mutate(gw.id); }}
                    className="p-2 rounded-lg hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>

              {/* Wallets */}
              {gw.wallets?.length > 0 && (
                <div className="grid gap-2 md:grid-cols-2">
                  {gw.wallets.map((w, i) => (
                    <div key={i} className="rounded-xl p-3"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-bold text-foreground">{w.currency} ({w.network})</span>
                        {w.label && <span className="text-[10px] font-mono text-muted-foreground">{w.label}</span>}
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground/70 break-all">{w.address}</div>
                    </div>
                  ))}
                </div>
              )}

              {gw.api_key && (
                <div className="flex items-center gap-2 mt-3 text-[10px] font-mono text-muted-foreground/50">
                  <Key className="w-3 h-3" />
                  <span>API Key: {gw.api_key.slice(0, 8)}••••••••</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="w-full max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto"
              style={{ background: '#0e0e10', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <h2 className="text-base font-black">{editItem ? 'Edit Gateway' : 'Add Payment Gateway'}</h2>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground text-xl">×</button>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Gateway Name" value={form.name} onChange={set('name')} placeholder="e.g. USDT TRC20 Manual" />
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground mb-1 block uppercase tracking-wider">Provider</label>
                    <select value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))}
                      className="w-full rounded-lg px-3 py-2 text-xs font-mono text-foreground outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {Object.entries(PROVIDER_LABELS).map(([v, l]) => (
                        <option key={v} value={v} style={{ background: '#0e0e10' }}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {form.provider !== 'manual_crypto' && (
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="col-span-2 text-[10px] font-mono text-primary uppercase tracking-widest flex items-center gap-2">
                      <Shield className="w-3 h-3" /> API Credentials
                    </div>
                    
                    {/* Sandbox/Live Toggle */}
                    {(form.provider === 'checkout_com' || form.provider === 'confirmo') && (
                      <div className="col-span-2 flex items-center gap-3 p-3 rounded-lg"
                        style={{ background: 'rgba(255,92,0,0.05)', border: '1px solid rgba(255,92,0,0.2)' }}>
                        <label className="text-xs font-semibold text-foreground">Sandbox Mode</label>
                        <button onClick={() => setForm(f => ({ ...f, sandbox_mode: !f.sandbox_mode }))}
                          className={`w-10 h-5 rounded-full transition-all relative ${form.sandbox_mode ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${form.sandbox_mode ? 'left-0.5' : 'left-5'}`} />
                        </button>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {form.sandbox_mode ? 'Testing (Sandbox)' : 'Live Production'}
                        </span>
                      </div>
                    )}

                    <Field label="API Key" value={form.api_key} onChange={set('api_key')} placeholder="Your API key" />
                    <Field label="Secret Key" value={form.secret_key} onChange={set('secret_key')} type="password" placeholder="Your secret key" />
                    <Field label="Webhook Secret" value={form.webhook_secret} onChange={set('webhook_secret')} placeholder="Webhook signing secret" />
                    <div className="col-span-2">
                      <Field label="Webhook URL" value={form.webhook_url} onChange={set('webhook_url')} placeholder="https://your-domain.com/functions/..." />
                      {form.provider === 'checkout_com' && (
                        <p className="text-[9px] font-mono text-muted-foreground mt-1">
                          Use: https://your-domain.com/functions/checkoutWebhook
                        </p>
                      )}
                      {form.provider === 'confirmo' && (
                        <p className="text-[9px] font-mono text-muted-foreground mt-1">
                          Use: https://your-domain.com/functions/confirmoWebhook
                        </p>
                      )}
                    </div>

                    {/* Provider-specific options */}
                    {form.provider === 'checkout_com' && (
                      <>
                        <div className="col-span-2 text-[10px] font-mono text-primary uppercase tracking-widest mt-2">
                          Supported Payment Methods
                        </div>
                        <div className="col-span-2 flex gap-2 flex-wrap">
                          {['visa', 'mastercard', 'amex', 'apple_pay', 'google_pay'].map(card => (
                            <button
                              key={card}
                              onClick={() => {
                                const cards = form.supported_cards || [];
                                const has = cards.includes(card);
                                setForm(f => ({
                                  ...f,
                                  supported_cards: has ? cards.filter(c => c !== card) : [...cards, card]
                                }));
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                (form.supported_cards || []).includes(card)
                                  ? 'bg-primary text-white'
                                  : 'bg-white/5 text-muted-foreground border border-white/10'
                              }`}
                            >
                              {card.replace('_', ' ').toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    {form.provider === 'confirmo' && (
                      <>
                        <div className="col-span-2 text-[10px] font-mono text-primary uppercase tracking-widest mt-2">
                          Supported Cryptocurrencies
                        </div>
                        <div className="col-span-2 flex gap-2 flex-wrap">
                          {['BTC', 'ETH', 'USDT', 'USDC', 'TRX', 'BNB'].map(crypto => (
                            <button
                              key={crypto}
                              onClick={() => {
                                const cryptoList = form.supported_crypto || [];
                                const has = cryptoList.includes(crypto);
                                setForm(f => ({
                                  ...f,
                                  supported_crypto: has ? cryptoList.filter(c => c !== crypto) : [...cryptoList, crypto]
                                }));
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                (form.supported_crypto || []).includes(crypto)
                                  ? 'bg-primary text-white'
                                  : 'bg-white/5 text-muted-foreground border border-white/10'
                              }`}
                            >
                              {crypto}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Wallet Addresses */}
                <div>
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">Wallet Addresses</div>
                  <div className="space-y-2 mb-3">
                    {(form.wallets || []).map((w, i) => (
                      <div key={i} className="flex items-center gap-2 p-3 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-foreground">{w.currency} ({w.network})</span>
                          <p className="text-[10px] font-mono text-muted-foreground/70 truncate">{w.address}</p>
                        </div>
                        <button onClick={() => removeWallet(i)} className="p-1 hover:text-red-400 text-muted-foreground transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-2 p-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    {['currency', 'network', 'address', 'label'].map(k => (
                      <input key={k} value={newWallet[k]} onChange={e => setNewWallet(w => ({ ...w, [k]: e.target.value }))}
                        placeholder={k.charAt(0).toUpperCase() + k.slice(1)}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-mono text-foreground outline-none"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    ))}
                    <button onClick={addWallet}
                      className="col-span-4 py-2 rounded-lg text-xs font-bold text-primary transition-all hover:bg-primary/10"
                      style={{ border: '1px solid rgba(255,92,0,0.3)' }}>
                      + Add Wallet
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-muted-foreground mb-1 block uppercase tracking-wider">Notes (internal)</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                    className="w-full rounded-lg px-3 py-2 text-xs font-mono text-foreground outline-none resize-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-xs font-mono text-foreground">Active</label>
                  <button onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                    className={`w-10 h-5 rounded-full transition-all relative ${form.is_active ? 'bg-emerald-500' : 'bg-white/10'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${form.is_active ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>

              <div className="flex gap-3 p-5 pt-0">
                <button onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-muted-foreground"
                  style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Cancel</button>
                <button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.name}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
                  {saveMutation.isPending ? 'Saving...' : editItem ? 'Update Gateway' : 'Save Gateway'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}