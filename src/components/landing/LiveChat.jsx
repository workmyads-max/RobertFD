import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send } from 'lucide-react';

export default function LiveChat() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="glass rounded-2xl w-80 mb-4 overflow-hidden"
          >
            <div className="p-4 border-b border-border/30 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-foreground">AlphaFund Support</div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  <span className="text-xs text-muted-foreground">Online — avg. 15min response</span>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 h-56 flex flex-col justify-end">
              <div className="glass-light rounded-xl p-3 mb-3 max-w-[80%]">
                <p className="text-sm text-foreground">
                  👋 Welcome to AlphaFund! How can we help you today?
                </p>
                <span className="text-[10px] text-muted-foreground mt-1 block">Just now</span>
              </div>
            </div>

            <div className="p-3 border-t border-border/30 flex items-center gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              <button className="w-8 h-8 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors">
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full bg-primary flex items-center justify-center glow-orange shadow-2xl"
      >
        {open ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </motion.button>
    </div>
  );
}