// Supabase Backend Integration Layer
// Production-grade database operations for Funded Firms CRM

import { supabase } from './supabaseClient';

// ==================================================
// PROFILES
// ==================================================

export async function getProfile(email) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateProfile(email, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('email', email)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ==================================================
// CHALLENGE ACCOUNTS
// ==================================================

export async function getChallengeAccounts(email) {
  const { data, error } = await supabase
    .from('challenge_accounts')
    .select('*')
    .eq('user_email', email)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function getChallengeAccount(accountId) {
  const { data, error } = await supabase
    .from('challenge_accounts')
    .select('*')
    .eq('account_id', accountId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateChallengeAccount(id, updates) {
  const { data, error } = await supabase
    .from('challenge_accounts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function createChallengeAccount(account) {
  const { data, error } = await supabase
    .from('challenge_accounts')
    .insert(account)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Subscribe to account changes in real-time
export function subscribeToAccountChanges(accountId, callback) {
  const channel = supabase
    .channel(`account:${accountId}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'challenge_accounts',
        filter: `account_id=eq.${accountId}`
      }, 
      callback
    )
    .subscribe();
  
  return () => channel.unsubscribe();
}

// ==================================================
// ORDERS
// ==================================================

export async function getOrders(email) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_email', email)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function createOrder(order) {
  const { data, error } = await supabase
    .from('orders')
    .insert(order)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateOrder(id, updates) {
  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ==================================================
// WITHDRAWALS
// ==================================================

export async function getWithdrawals(email) {
  const { data, error } = await supabase
    .from('withdrawal_requests')
    .select('*')
    .eq('user_email', email)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function createWithdrawal(withdrawal) {
  const { data, error } = await supabase
    .from('withdrawal_requests')
    .insert(withdrawal)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateWithdrawal(id, updates) {
  const { data, error } = await supabase
    .from('withdrawal_requests')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Subscribe to withdrawal updates
export function subscribeToWithdrawals(email, callback) {
  const channel = supabase
    .channel(`withdrawals:${email}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'withdrawal_requests',
        filter: `user_email=eq.${email}`
      }, 
      callback
    )
    .subscribe();
  
  return () => channel.unsubscribe();
}

// ==================================================
// AFFILIATE
// ==================================================

export async function getAffiliateProfile(email) {
  const { data, error } = await supabase
    .from('affiliate_profiles')
    .select('*')
    .eq('user_email', email)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
  return data;
}

export async function getAffiliateCommissions(email) {
  const { data, error } = await supabase
    .from('affiliate_commissions')
    .select('*')
    .eq('affiliate_email', email)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function updateAffiliateProfile(id, updates) {
  const { data, error } = await supabase
    .from('affiliate_profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ==================================================
// COUPONS
// ==================================================

export async function getCoupon(code) {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function incrementCouponUsage(code) {
  const { data, error } = await supabase.rpc('increment_coupon_uses', { 
    coupon_code: code 
  });
  
  if (error) throw error;
  return data;
}

// ==================================================
// KYC
// ==================================================

export async function getKYC(email) {
  const { data, error } = await supabase
    .from('kyc_verifications')
    .select('*')
    .eq('user_email', email)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createKYC(kyc) {
  const { data, error } = await supabase
    .from('kyc_verifications')
    .insert(kyc)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateKYC(id, updates) {
  const { data, error } = await supabase
    .from('kyc_verifications')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ==================================================
// CERTIFICATES
// ==================================================

export async function getCertificates(email) {
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_email', email)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function createCertificate(certificate) {
  const { data, error } = await supabase
    .from('certificates')
    .insert(certificate)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ==================================================
// NOTIFICATIONS
// ==================================================

export async function getActiveNotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export function subscribeToNotifications(callback) {
  const channel = supabase
    .channel('notifications')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'notifications',
        filter: 'is_active=eq.true'
      }, 
      callback
    )
    .subscribe();
  
  return () => channel.unsubscribe();
}

// ==================================================
// SUPPORT
// ==================================================

export async function getSupportTickets(email) {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('user_email', email)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function createSupportTicket(ticket) {
  const { data, error } = await supabase
    .from('support_tickets')
    .insert(ticket)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function createSupportMessage(message) {
  const { data, error } = await supabase
    .from('support_messages')
    .insert(message)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Subscribe to ticket messages
export function subscribeToTicket(ticketId, callback) {
  const channel = supabase
    .channel(`ticket:${ticketId}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'support_messages',
        filter: `ticket_id=eq.${ticketId}`
      }, 
      callback
    )
    .subscribe();
  
  return () => channel.unsubscribe();
}

// ==================================================
// TRADE RECORDS
// ==================================================

export async function getTradeRecords(accountId) {
  const { data, error } = await supabase
    .from('trade_records')
    .select('*')
    .eq('account_id', accountId)
    .order('open_time', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function createTradeRecord(trade) {
  const { data, error } = await supabase
    .from('trade_records')
    .insert(trade)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateTradeRecord(id, updates) {
  const { data, error } = await supabase
    .from('trade_records')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Subscribe to trade changes
export function subscribeToTrades(accountId, callback) {
  const channel = supabase
    .channel(`trades:${accountId}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'trade_records',
        filter: `account_id=eq.${accountId}`
      }, 
      callback
    )
    .subscribe();
  
  return () => channel.unsubscribe();
}

// ==================================================
// STORAGE
// ==================================================

export async function uploadFile(bucket, path, file) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true });
  
  if (error) throw error;
  return data;
}

export async function getFileUrl(bucket, path) {
  const { data } = await supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
}

export async function deleteFile(bucket, path) {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);
  
  if (error) throw error;
}

// ==================================================
// AUTH
// ==================================================

export async function signUp(email, password, metadata) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });
  
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/dashboard` },
  });
  
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// ==================================================
// ADMIN FUNCTIONS
// ==================================================

export async function getAllUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function getAllOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function getAllAccounts() {
  const { data, error } = await supabase
    .from('challenge_accounts')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function getAllWithdrawals() {
  const { data, error } = await supabase
    .from('withdrawal_requests')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function getAllAffiliateProfiles() {
  const { data, error } = await supabase
    .from('affiliate_profiles')
    .select('*')
    .order('total_earned', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function getAllCommissions() {
  const { data, error } = await supabase
    .from('affiliate_commissions')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function updateCouponUsage(code, increment = 1) {
  const { data, error } = await supabase.rpc('increment_coupon_uses', {
    coupon_code: code,
    use_count: increment
  });
  
  if (error) throw error;
  return data;
}