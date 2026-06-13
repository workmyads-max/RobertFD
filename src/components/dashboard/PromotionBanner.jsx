import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag, ExternalLink, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function PromotionBanner({ location = 'dashboard' }) {
  const [dismissed, setDismissed] = useState([]);

  const { data: promotions = [] } = useQuery({
    queryKey: ['active-promotions', location],
    queryFn: async () => {
      const all = await base44.entities.Promotion.filter({ is_active: true });
      const now = new Date();
      return all.filter(p => {
        // Filter by display location
        if (p.display_location !== 'all' && p.display_location !== location) return false;
        // Filter by date range
        if (p.start_date && new Date(p.start_date) > now) return false;
        if (p.end_date && new Date(p.end_date) < now) return false;
        return true;
      }).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const visible = promotions.filter(p => !dismissed.includes(p.id));

  if (visible.length === 0) return null;

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {visible.map((promo) => (
          <motion.div
            key={promo.id}
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,92,0,0.1) 0%, rgba(255,92,0,0.04) 100%)',
              border: '1px solid rgba(255,92,0,0.25)',
            }}
          >
            {/* Accent line */}
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ background: '#FF5C00' }} />

            <div className="flex items-start gap-4 px-5 py-4 pl-6">
              {/* Icon */}
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(255,92,0,0.15)', border: '1px solid rgba(255,92,0,0.25)' }}>
                {promo.discount_percent > 0
                  ? <Tag className="w-4 h-4 text-primary" />
                  : <Zap className="w-4 h-4 text-primary" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm font-bold text-foreground">{promo.title}</span>
                  {promo.discount_percent > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black"
                      style={{ background: '#FF5C00', color: '#fff' }}>
                      -{promo.discount_percent}%
                    </span>
                  )}
                  {promo.tag && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ background: 'rgba(204,255,0,0.12)', color: '#CCFF00', border: '1px solid rgba(204,255,0,0.25)' }}>
                      {promo.tag}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{promo.description}</p>

                {/* End date countdown */}
                {promo.end_date && (
                  <p className="text-[11px] text-white/40 mt-1 font-mono">
                    Ends {new Date(promo.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
              </div>

              {/* CTA */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {promo.cta_url && (
                  <a
                    href={promo.cta_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: '#FF5C00' }}
                  >
                    {promo.cta_text || 'Learn More'}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <button
                  onClick={() => setDismissed(d => [...d, promo.id])}
                  className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}