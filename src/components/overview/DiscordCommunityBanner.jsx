import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

export default function DiscordCommunityBanner({ discordUrl }) {
  if (!discordUrl) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="rounded-xl p-5"
      style={{
        background: '#161B22',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-lg">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#5865F2">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.11 18.1.127 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">
            Join Our Discord Community
          </h3>
          <p className="text-xs text-white/40 leading-relaxed mt-0.5">
            Connect with traders, share strategies, get updates
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <motion.div
        className="relative rounded-full p-0.5"
        style={{
          background: 'linear-gradient(90deg, #2563EB 0%, #1E3A8A 100%)',
          boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
        }}
      >
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-full"
          style={{ background: 'rgba(13,17,23,0.95)' }}>
          
          {/* Left Side: Avatars */}
          <div className="flex items-center gap-2.5">
            {/* Discord Logo */}
            <motion.div 
              className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-md"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.2 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#5865F2">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.11 18.1.127 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </motion.div>

            {/* User Avatars */}
            <div className="flex -space-x-2">
              <motion.img
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&h=64&fit=crop&crop=face"
                alt="Member"
                className="w-7 h-7 rounded-full border-2 border-[#1E3A8A] object-cover"
                whileHover={{ scale: 1.15, zIndex: 10 }}
              />
              <motion.img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&crop=face"
                alt="Member"
                className="w-7 h-7 rounded-full border-2 border-[#1E3A8A] object-cover"
                whileHover={{ scale: 1.15, zIndex: 10 }}
              />
              <motion.img
                src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=64&h=64&fit=crop&crop=face"
                alt="Member"
                className="w-7 h-7 rounded-full border-2 border-[#1E3A8A] object-cover"
                whileHover={{ scale: 1.15, zIndex: 10 }}
              />
            </div>

            {/* Online Dots */}
            <div className="flex -space-x-0.5 ml-0.5">
              <motion.div 
                className="w-2 h-2 rounded-full bg-[#22C55E] border border-[#1E3A8A]"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div 
                className="w-2 h-2 rounded-full bg-[#22C55E] border border-[#1E3A8A]"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              />
            </div>
          </div>

          {/* Action Button */}
          <motion.a
            href={discordUrl}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md"
          >
            <ArrowUpRight className="w-4 h-4" style={{ color: '#2563EB' }} strokeWidth={2.5} />
          </motion.a>
        </div>
      </motion.div>
    </motion.div>
  );
}