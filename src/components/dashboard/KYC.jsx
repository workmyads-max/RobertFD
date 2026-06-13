import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Upload, CheckCircle2, Clock, XCircle, AlertTriangle, FileText, User, Home, Camera, RefreshCw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const STATUS_CONFIG = {
  not_submitted: { label: 'Not Submitted', color: '#888', bg: 'rgba(136,136,136,0.1)', icon: FileText },
  pending: { label: 'Pending Review', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: Clock },
  approved: { label: 'Verified', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: XCircle },
  resubmit_required: { label: 'Resubmission Required', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: RefreshCw },
};

function UploadCard({ label, icon: Icon, field, value, onUpload, uploading, disabled }) {
  const ref = useRef();
  const hasFile = !!value;

  return (
    <div
      onClick={() => !disabled && !uploading && ref.current?.click()}
      className={`relative rounded-2xl p-5 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-primary/40 hover:bg-white/[0.04]'
      }`}
      style={{
        background: hasFile ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.03)',
        border: `1px ${hasFile ? 'solid rgba(16,185,129,0.3)' : 'dashed rgba(255,255,255,0.1)'}`,
        minHeight: 140,
      }}
    >
      <input ref={ref} type="file" accept="image/*,application/pdf" className="hidden" onChange={e => onUpload(field, e.target.files[0])} />
      {uploading === field ? (
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      ) : hasFile ? (
        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
      ) : (
        <Icon className="w-8 h-8 text-muted-foreground/40" />
      )}
      <div className="text-center">
        <div className={`text-xs font-semibold ${hasFile ? 'text-emerald-400' : 'text-muted-foreground'}`}>
          {hasFile ? 'Uploaded ✓' : label}
        </div>
        {!hasFile && <div className="text-[10px] text-muted-foreground/50 mt-0.5">Click or drag to upload</div>}
      </div>
    </div>
  );
}

export default function KYC({ user }) {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(null);
  const [form, setForm] = useState({ id_type: 'passport', full_name: user?.full_name || '', date_of_birth: '', nationality: '' });

  const { data: kyc, isLoading } = useQuery({
    queryKey: ['kyc', user?.email],
    queryFn: async () => {
      const results = await base44.entities.KYCVerification.filter({ user_email: user?.email });
      return results[0] || null;
    },
    enabled: !!user?.email,
  });

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      if (kyc?.id) return base44.entities.KYCVerification.update(kyc.id, { ...data, status: 'pending', submitted_at: new Date().toISOString() });
      return base44.entities.KYCVerification.create({ ...data, user_email: user?.email, status: 'pending', submitted_at: new Date().toISOString() });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kyc', user?.email] }),
  });

  const handleUpload = async (field, file) => {
    if (!file) return;
    setUploading(field);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    if (kyc?.id) {
      await base44.entities.KYCVerification.update(kyc.id, { [field]: file_url });
    } else {
      // stage locally until submit
      setForm(f => ({ ...f, [field]: file_url }));
    }
    qc.invalidateQueries({ queryKey: ['kyc', user?.email] });
    setUploading(null);
  };

  const handleSubmit = () => {
    const data = {
      ...form,
      id_front_url: kyc?.id_front_url || form.id_front_url,
      id_back_url: kyc?.id_back_url || form.id_back_url,
      selfie_url: kyc?.selfie_url || form.selfie_url,
      proof_of_address_url: kyc?.proof_of_address_url || form.proof_of_address_url,
    };
    submitMutation.mutate(data);
  };

  const effectiveKyc = kyc || form;
  const status = kyc?.status || 'not_submitted';
  const statusCfg = STATUS_CONFIG[status];
  const StatusIcon = statusCfg.icon;
  const isSubmitted = status === 'pending' || status === 'approved';
  const canEdit = status === 'not_submitted' || status === 'rejected' || status === 'resubmit_required';

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-primary" /> KYC Verification
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">Identity verification required for payouts</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: statusCfg.bg, border: `1px solid ${statusCfg.color}40` }}>
          <StatusIcon className="w-4 h-4" style={{ color: statusCfg.color }} />
          <span className="text-xs font-bold" style={{ color: statusCfg.color }}>{statusCfg.label}</span>
        </div>
      </div>

      {status === 'approved' && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-4 p-5 rounded-2xl mb-6"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
          <div>
            <div className="text-sm font-bold text-emerald-400 mb-1">Identity Verified</div>
            <div className="text-xs text-muted-foreground">Your identity has been successfully verified. You are eligible for all platform features including payouts.</div>
          </div>
        </motion.div>
      )}

      {(status === 'rejected' || status === 'resubmit_required') && kyc?.rejection_reason && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-4 p-5 rounded-2xl mb-6"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
          <div>
            <div className="text-sm font-bold text-red-400 mb-1">Action Required</div>
            <div className="text-xs text-muted-foreground">{kyc.rejection_reason}</div>
          </div>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Personal Information
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Full Legal Name', key: 'full_name', type: 'text' },
                { label: 'Date of Birth', key: 'date_of_birth', type: 'date' },
                { label: 'Nationality', key: 'nationality', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[10px] font-mono text-muted-foreground uppercase mb-1 block">{f.label}</label>
                  <input
                    type={f.type}
                    value={form[f.key] || kyc?.[f.key] || ''}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    disabled={!canEdit}
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-foreground outline-none disabled:opacity-60"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
              ))}
              <div>
                <label className="text-[10px] font-mono text-muted-foreground uppercase mb-1 block">Document Type</label>
                <select
                  value={form.id_type || kyc?.id_type || 'passport'}
                  onChange={e => setForm(prev => ({ ...prev, id_type: e.target.value }))}
                  disabled={!canEdit}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-foreground outline-none disabled:opacity-60"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <option value="passport" className="bg-[#0e0e10]">Passport</option>
                  <option value="national_id" className="bg-[#0e0e10]">National ID</option>
                  <option value="driving_license" className="bg-[#0e0e10]">Driving License</option>
                </select>
              </div>
            </div>
          </div>

          {/* Document Uploads */}
          <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Document Uploads
            </div>
            <div className="grid grid-cols-2 gap-4">
              <UploadCard label="ID Front" icon={FileText} field="id_front_url" value={effectiveKyc?.id_front_url} onUpload={handleUpload} uploading={uploading} disabled={!canEdit} />
              <UploadCard label="ID Back" icon={FileText} field="id_back_url" value={effectiveKyc?.id_back_url} onUpload={handleUpload} uploading={uploading} disabled={!canEdit} />
              <UploadCard label="Selfie with ID" icon={Camera} field="selfie_url" value={effectiveKyc?.selfie_url} onUpload={handleUpload} uploading={uploading} disabled={!canEdit} />
              <UploadCard label="Proof of Address" icon={Home} field="proof_of_address_url" value={effectiveKyc?.proof_of_address_url} onUpload={handleUpload} uploading={uploading} disabled={!canEdit} />
            </div>
          </div>

          {canEdit && (
            <button
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50 transition-all hover:scale-[1.01]"
              style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)', boxShadow: '0 4px 20px rgba(255,92,0,0.3)' }}
            >
              {submitMutation.isPending ? 'Submitting...' : status === 'not_submitted' ? 'Submit for Verification' : 'Resubmit Documents'}
            </button>
          )}
        </div>

        {/* Status Panel */}
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-xs font-bold text-foreground mb-4">Verification Steps</div>
            {[
              { label: 'Personal Information', done: !!(kyc?.full_name || form.full_name) },
              { label: 'ID Document (Front)', done: !!(kyc?.id_front_url || form.id_front_url) },
              { label: 'ID Document (Back)', done: !!(kyc?.id_back_url || form.id_back_url) },
              { label: 'Selfie Verification', done: !!(kyc?.selfie_url || form.selfie_url) },
              { label: 'Proof of Address', done: !!(kyc?.proof_of_address_url || form.proof_of_address_url) },
              { label: 'Admin Review', done: status === 'approved' },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center gap-3 mb-3 last:mb-0">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
                  {step.done ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <span className="text-[9px] font-mono text-muted-foreground">{i + 1}</span>}
                </div>
                <span className={`text-xs ${step.done ? 'text-emerald-400' : 'text-muted-foreground'}`}>{step.label}</span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-xs font-bold text-foreground mb-3">Why KYC?</div>
            <div className="space-y-2 text-[11px] text-muted-foreground">
              <p>• Required for all payouts above $100</p>
              <p>• Regulatory compliance (AML/KYC)</p>
              <p>• Protects your account from fraud</p>
              <p>• One-time verification only</p>
              <p>• Reviewed within 24-48 hours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}