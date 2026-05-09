import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Paperclip, ChevronDown, Circle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function LiveChat({ user }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [ticketId, setTicketId] = useState(null);
  const messagesEndRef = useRef(null);

  // Get or create ticket for this user
  const { data: ticket } = useQuery({
    queryKey: ['live-chat-ticket', user?.email],
    queryFn: async () => {
      const tickets = await base44.entities.SupportTicket.filter({ user_email: user?.email, category: 'technical' });
      const open = tickets.find(t => t.status === 'open' || t.status === 'in_progress');
      return open || null;
    },
    enabled: !!user?.email,
  });

  useEffect(() => { if (ticket?.id) setTicketId(ticket.id); }, [ticket]);

  const { data: messages = [] } = useQuery({
    queryKey: ['chat-messages', ticketId],
    queryFn: () => base44.entities.LiveChatMessage.filter({ ticket_id: ticketId }),
    enabled: !!ticketId,
    refetchInterval: open ? 3000 : false,
  });

  const sendMutation = useMutation({
    mutationFn: async (msg) => {
      let tid = ticketId;
      if (!tid) {
        const t = await base44.entities.SupportTicket.create({
          subject: 'Live Chat Support',
          category: 'technical',
          message: msg,
          status: 'open',
          priority: 'medium',
          user_email: user?.email,
        });
        tid = t.id;
        setTicketId(tid);
        qc.invalidateQueries({ queryKey: ['live-chat-ticket', user?.email] });
      }
      return base44.entities.LiveChatMessage.create({
        ticket_id: tid,
        sender_email: user?.email,
        sender_name: user?.full_name || 'User',
        sender_role: 'user',
        message: msg,
        is_read: false,
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['chat-messages', ticketId] }); setMessage(''); },
  });

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const unreadCount = messages.filter(m => m.sender_role === 'admin' && !m.is_read).length;

  const handleSend = () => {
    if (!message.trim()) return;
    sendMutation.mutate(message.trim());
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl"
        style={{ background: 'linear-gradient(135deg,#FF5C00,#FF7A2F)', boxShadow: '0 8px 32px rgba(255,92,0,0.4)' }}
      >
        {open ? <X className="w-5 h-5 text-white" /> : <MessageCircle className="w-5 h-5 text-white" />}
        {!open && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">{unreadCount}</span>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-80 rounded-2xl flex flex-col overflow-hidden"
            style={{ background: '#0e0e10', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 80px rgba(0,0,0,0.6)', height: 440 }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ background: 'linear-gradient(90deg,rgba(255,92,0,0.15),rgba(255,92,0,0.05))', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-foreground">Robert Funds Support</div>
                <div className="flex items-center gap-1.5">
                  <Circle className="w-1.5 h-1.5 fill-emerald-400 text-emerald-400" />
                  <span className="text-[10px] text-emerald-400 font-mono">Online · Avg reply 5 min</span>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-6">
                  <div className="text-2xl mb-2">👋</div>
                  <div className="text-xs font-semibold text-foreground mb-1">Hi {user?.full_name?.split(' ')[0] || 'there'}!</div>
                  <div className="text-[11px] text-muted-foreground">How can we help you today? Send us a message and our team will respond shortly.</div>
                </div>
              )}
              {messages.map((msg) => {
                const isMe = msg.sender_role === 'user';
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${isMe ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                      style={{ background: isMe ? 'rgba(255,92,0,0.2)' : 'rgba(255,255,255,0.07)', border: `1px solid ${isMe ? 'rgba(255,92,0,0.3)' : 'rgba(255,255,255,0.08)'}` }}>
                      {!isMe && <div className="text-[10px] font-bold text-primary mb-1">Support Team</div>}
                      <div className="text-foreground leading-relaxed">{msg.message}</div>
                      <div className="text-[9px] text-muted-foreground/50 mt-1">{new Date(msg.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 p-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <input
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Type a message..."
                className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/40"
              />
              <button
                onClick={handleSend}
                disabled={!message.trim() || sendMutation.isPending}
                className="w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-40 transition-all hover:scale-105"
                style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}