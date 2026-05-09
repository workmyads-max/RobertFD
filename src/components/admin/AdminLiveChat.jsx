import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Send, Search, Circle, CheckCircle2, Clock, User } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function AdminLiveChat() {
  const qc = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef(null);

  const { data: tickets = [] } = useQuery({
    queryKey: ['admin-chat-tickets'],
    queryFn: () => base44.entities.SupportTicket.list('-created_date', 100),
    refetchInterval: 5000,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['admin-chat-messages', selectedTicket?.id],
    queryFn: () => base44.entities.LiveChatMessage.filter({ ticket_id: selectedTicket?.id }),
    enabled: !!selectedTicket?.id,
    refetchInterval: 3000,
  });

  const sendMutation = useMutation({
    mutationFn: (msg) => base44.entities.LiveChatMessage.create({
      ticket_id: selectedTicket.id,
      sender_email: 'support@robertfunds.com',
      sender_name: 'Support Team',
      sender_role: 'admin',
      message: msg,
      is_read: false,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-chat-messages', selectedTicket?.id] }); setReply(''); },
  });

  const updateTicketMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.SupportTicket.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-chat-tickets'] }),
  });

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const filtered = tickets.filter(t => !search || t.user_email?.toLowerCase().includes(search.toLowerCase()) || t.subject?.toLowerCase().includes(search.toLowerCase()));

  const STATUS_COLOR = { open: '#10b981', in_progress: '#f59e0b', resolved: '#60a5fa', closed: '#666' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-primary" /> Live Support Chat
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">{tickets.filter(t => t.status === 'open').length} open conversations</p>
        </div>
      </div>

      <div className="flex gap-0 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)', height: 600 }}>
        {/* Ticket List */}
        <div className="w-72 flex flex-col border-r border-white/5 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="p-3 border-b border-white/5">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="flex-1 bg-transparent text-xs text-foreground outline-none" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.map(ticket => {
              const sc = STATUS_COLOR[ticket.status] || '#666';
              const isActive = selectedTicket?.id === ticket.id;
              return (
                <button key={ticket.id} onClick={() => setSelectedTicket(ticket)}
                  className={`w-full text-left p-4 border-b border-white/[0.04] transition-all ${isActive ? 'bg-primary/10' : 'hover:bg-white/[0.03]'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-foreground truncate pr-2">{ticket.user_email?.split('@')[0]}</span>
                    <Circle className="w-2 h-2 flex-shrink-0" style={{ fill: sc, color: sc }} />
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">{ticket.subject}</div>
                  <div className="text-[10px] font-mono text-muted-foreground/50 mt-1">{new Date(ticket.created_date).toLocaleDateString()}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {!selectedTicket ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                <div className="text-sm text-muted-foreground">Select a conversation to start replying</div>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 flex-shrink-0">
                <div>
                  <div className="text-sm font-bold text-foreground">{selectedTicket.user_email}</div>
                  <div className="text-xs text-muted-foreground">{selectedTicket.subject}</div>
                </div>
                <div className="flex gap-2">
                  {selectedTicket.status !== 'resolved' && (
                    <button onClick={() => updateTicketMutation.mutate({ id: selectedTicket.id, status: 'resolved' })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                    </button>
                  )}
                  <select value={selectedTicket.status}
                    onChange={e => updateTicketMutation.mutate({ id: selectedTicket.id, status: e.target.value })}
                    className="px-2 py-1.5 rounded-lg text-xs outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(var(--foreground))' }}>
                    {['open', 'in_progress', 'resolved', 'closed'].map(s => <option key={s} value={s} className="bg-[#0e0e10] capitalize">{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {messages.map(msg => {
                  const isAdmin = msg.sender_role === 'admin';
                  return (
                    <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      {!isAdmin && (
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                          <User className="w-3.5 h-3.5 text-primary" />
                        </div>
                      )}
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs ${isAdmin ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                        style={{ background: isAdmin ? 'rgba(255,92,0,0.15)' : 'rgba(255,255,255,0.07)', border: `1px solid ${isAdmin ? 'rgba(255,92,0,0.25)' : 'rgba(255,255,255,0.08)'}` }}>
                        {isAdmin && <div className="text-[10px] font-bold text-primary mb-1">Support Team</div>}
                        <div className="text-foreground leading-relaxed">{msg.message}</div>
                        <div className="text-[9px] text-muted-foreground/50 mt-1">{new Date(msg.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply */}
              <div className="flex items-center gap-3 p-4 border-t border-white/5 flex-shrink-0">
                <input value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && reply.trim() && sendMutation.mutate(reply.trim())}
                  placeholder="Type a reply..." className="flex-1 px-4 py-2.5 rounded-xl text-sm text-foreground outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                <button onClick={() => reply.trim() && sendMutation.mutate(reply.trim())} disabled={!reply.trim() || sendMutation.isPending}
                  className="w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-40"
                  style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}