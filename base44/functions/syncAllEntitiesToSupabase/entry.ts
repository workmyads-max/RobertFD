import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { createClient } from 'npm:@supabase/supabase-js@2.106.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return Response.json({ error: 'Supabase not configured' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const stats = {
      profiles: { total: 0, synced: 0, errors: 0 },
      challenge_accounts: { total: 0, synced: 0, errors: 0 },
      withdrawals: { total: 0, synced: 0, errors: 0 },
      affiliate_profiles: { total: 0, synced: 0, errors: 0 },
      affiliate_commissions: { total: 0, synced: 0, errors: 0 },
      kyc_verifications: { total: 0, synced: 0, errors: 0 },
      support_tickets: { total: 0, synced: 0, errors: 0 },
      certificates: { total: 0, synced: 0, errors: 0 },
    };

    // 0. Create all user profiles first (to avoid FK constraint errors)
    const allEmails = new Set();
    const allOrders = await base44.asServiceRole.entities.Order.list();
    const allAccounts = await base44.asServiceRole.entities.ChallengeAccount.list();
    const allAffiliates = await base44.asServiceRole.entities.AffiliateProfile.list();
    const allKYCs = await base44.asServiceRole.entities.KYCVerification.list();
    const allTickets = await base44.asServiceRole.entities.SupportTicket.list();
    const allCerts = await base44.asServiceRole.entities.Certificate.list();
    const allWithdrawals = await base44.asServiceRole.entities.WithdrawalRequest.list();
    
    // Collect all emails
    allOrders.forEach(o => o.email && allEmails.add(o.email));
    allAccounts.forEach(a => a.user_email && allEmails.add(a.user_email));
    allAffiliates.forEach(a => a.user_email && allEmails.add(a.user_email));
    allKYCs.forEach(k => k.user_email && allEmails.add(k.user_email));
    allTickets.forEach(t => t.user_email && allEmails.add(t.user_email));
    allCerts.forEach(c => c.user_email && allEmails.add(c.user_email));
    allWithdrawals.forEach(w => w.user_email && allEmails.add(w.user_email));
    
    stats.profiles.total = allEmails.size;
    for (const email of allEmails) {
      try {
        const { error } = await supabase.from('profiles').upsert({
          email,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'email' });
        
        if (error) {
          console.error(`Failed to create profile for ${email}:`, error);
          stats.profiles.errors++;
        } else {
          stats.profiles.synced++;
        }
      } catch (err) {
        console.error(`Error creating profile for ${email}:`, err);
        stats.profiles.errors++;
      }
    }

    // 1. Sync Challenge Accounts
    stats.challenge_accounts.total = allAccounts.length;
    for (const account of allAccounts) {
      try {
        // Skip accounts without user_email or with invalid challenge_type
        if (!account.user_email) {
          console.log(`Skipping account ${account.account_id}: no user_email`);
          stats.challenge_accounts.errors++;
          continue;
        }
        if (account.challenge_type === 'funded') {
          console.log(`Skipping account ${account.account_id}: 'funded' challenge_type not in enum`);
          stats.challenge_accounts.errors++;
          continue;
        }
        
        const { error } = await supabase.from('challenge_accounts').upsert({
          account_id: account.account_id,
          user_email: account.user_email,
          challenge_type: account.challenge_type,
          account_type: account.account_type || 'standard',
          account_size: account.account_size,
          platform: account.platform || 'xtrading',
          leverage: account.leverage || '1:100',
          status: account.status || 'pending',
          phase: account.phase || 'phase1',
          balance: account.balance || 0,
          equity: account.equity || 0,
          pnl: account.pnl || 0,
          daily_pnl: account.daily_pnl || 0,
          daily_drawdown_used: account.daily_drawdown_used || 0,
          max_drawdown_used: account.max_drawdown_used || 0,
          high_water_mark: account.high_water_mark || 0,
          profit_target_progress: account.profit_target_progress || 0,
          win_rate: account.win_rate || 0,
          total_trades: account.total_trades || 0,
          trading_days: account.trading_days || 0,
          daily_reset_at: account.daily_reset_at,
          phase_passed_at: account.phase_passed_at,
          login_credentials: account.login_credentials,
          server: account.server,
          mt_login: account.mt_login,
          mt_password: account.mt_password,
          mt_server: account.mt_server,
          mt_group: account.mt_group,
          provisioned_at: account.provisioned_at,
          last_synced_at: account.last_synced_at,
          updated_at: account.updated_date,
        }, { onConflict: 'account_id' });
        
        if (error) {
          console.error(`Failed to sync account ${account.account_id}:`, error);
          stats.challenge_accounts.errors++;
        } else {
          stats.challenge_accounts.synced++;
        }
      } catch (err) {
        console.error(`Error processing account ${account.account_id}:`, err);
        stats.challenge_accounts.errors++;
      }
    }

    // 2. Sync Withdrawal Requests
    stats.withdrawals.total = allWithdrawals.length;
    for (const withdrawal of allWithdrawals) {
      try {
        // Skip if missing required fields
        if (!withdrawal.withdrawal_id || !withdrawal.user_email) {
          console.log(`Skipping withdrawal ${withdrawal.id}: missing withdrawal_id or user_email`);
          stats.withdrawals.errors++;
          continue;
        }
        
        const { error } = await supabase.from('withdrawal_requests').upsert({
          withdrawal_id: withdrawal.withdrawal_id,
          user_email: withdrawal.user_email,
          account_id: withdrawal.account_id,
          amount: withdrawal.amount,
          payout_method: withdrawal.method,
          wallet_address: withdrawal.wallet_address,
          status: withdrawal.status || 'pending',
          trader_share: withdrawal.trader_share,
          company_share: withdrawal.company_share,
          processing_fee: withdrawal.processing_fee || 0,
          affiliate_commission: withdrawal.affiliate_commission || 0,
          net_payout: withdrawal.net_payout,
          processed_by: withdrawal.processed_by,
          processed_at: withdrawal.processed_at,
          rejection_reason: withdrawal.rejection_reason,
          notes: withdrawal.notes,
          updated_at: withdrawal.updated_date,
        }, { onConflict: 'withdrawal_id' });
        
        if (error) {
          console.error(`Failed to sync withdrawal ${withdrawal.withdrawal_id}:`, error);
          stats.withdrawals.errors++;
        } else {
          stats.withdrawals.synced++;
        }
      } catch (err) {
        console.error(`Error processing withdrawal ${withdrawal.withdrawal_id}:`, err);
        stats.withdrawals.errors++;
      }
    }

    // 3. Sync Affiliate Profiles
    const affiliates = await base44.asServiceRole.entities.AffiliateProfile.list();
    stats.affiliate_profiles.total = affiliates.length;
    for (const affiliate of affiliates) {
      try {
        const { error } = await supabase.from('affiliate_profiles').upsert({
          user_email: affiliate.user_email,
          referral_code: affiliate.referral_code,
          referred_by_code: affiliate.referred_by_code,
          referred_by_email: affiliate.referred_by_email,
          level: affiliate.level || 1,
          tier: affiliate.tier || 'standard',
          custom_l1_rate: affiliate.custom_l1_rate,
          custom_l2_rate: affiliate.custom_l2_rate,
          custom_l3_rate: affiliate.custom_l3_rate,
          custom_payout_rate: affiliate.custom_payout_rate,
          total_earned: affiliate.total_earned || 0,
          total_pending: affiliate.total_pending || 0,
          total_paid: affiliate.total_paid || 0,
          total_purchase_commissions: affiliate.total_purchase_commissions || 0,
          total_payout_commissions: affiliate.total_payout_commissions || 0,
          referral_clicks: affiliate.referral_clicks || 0,
          total_referrals: affiliate.total_referrals || 0,
          active_funded_traders: affiliate.active_funded_traders || 0,
          conversions: affiliate.conversions || 0,
          is_active: affiliate.is_active ?? true,
          is_frozen: affiliate.is_frozen ?? false,
          admin_notes: affiliate.admin_notes,
          updated_at: affiliate.updated_date,
        }, { onConflict: 'user_email' });
        
        if (error) {
          console.error(`Failed to sync affiliate ${affiliate.user_email}:`, error);
          stats.affiliate_profiles.errors++;
        } else {
          stats.affiliate_profiles.synced++;
        }
      } catch (err) {
        console.error(`Error processing affiliate ${affiliate.user_email}:`, err);
        stats.affiliate_profiles.errors++;
      }
    }

    // 4. Sync Affiliate Commissions
    const commissions = await base44.asServiceRole.entities.AffiliateCommission.list();
    stats.affiliate_commissions.total = commissions.length;
    for (const commission of commissions) {
      try {
        const { error } = await supabase.from('affiliate_commissions').upsert({
          affiliate_email: commission.affiliate_email,
          referred_email: commission.referred_email,
          commission_type: commission.commission_type || 'challenge_purchase',
          level: commission.level || 1,
          source_amount: commission.source_amount,
          commission_rate: commission.commission_rate,
          commission_amount: commission.commission_amount,
          order_id: commission.order_id,
          withdrawal_id: commission.withdrawal_id,
          account_id: commission.account_id,
          status: commission.status || 'pending',
          notes: commission.notes,
          paid_at: commission.paid_at,
          approved_by: commission.approved_by,
          updated_at: commission.updated_date,
        }, { onConflict: 'id' });
        
        if (error) {
          console.error(`Failed to sync commission:`, error);
          stats.affiliate_commissions.errors++;
        } else {
          stats.affiliate_commissions.synced++;
        }
      } catch (err) {
        console.error(`Error processing commission:`, err);
        stats.affiliate_commissions.errors++;
      }
    }

    // 5. Sync KYC Verifications
    const kyCs = await base44.asServiceRole.entities.KYCVerification.list();
    stats.kyc_verifications.total = kyCs.length;
    for (const kyc of kyCs) {
      try {
        const { error } = await supabase.from('kyc_verifications').upsert({
          user_email: kyc.user_email,
          status: kyc.status || 'not_submitted',
          id_front_url: kyc.id_front_url,
          id_back_url: kyc.id_back_url,
          selfie_url: kyc.selfie_url,
          proof_of_address_url: kyc.proof_of_address_url,
          id_type: kyc.id_type,
          id_number: kyc.id_number,
          full_name: kyc.full_name,
          date_of_birth: kyc.date_of_birth,
          nationality: kyc.nationality,
          occupation: kyc.occupation,
          source_of_funds: kyc.source_of_funds,
          expected_volume: kyc.expected_volume,
          trading_experience: kyc.trading_experience,
          reviewed_by: kyc.reviewed_by,
          reviewed_at: kyc.reviewed_at,
          rejection_reason: kyc.rejection_reason,
          updated_at: kyc.updated_date,
        }, { onConflict: 'user_email' });
        
        if (error) {
          console.error(`Failed to sync KYC ${kyc.user_email}:`, error);
          stats.kyc_verifications.errors++;
        } else {
          stats.kyc_verifications.synced++;
        }
      } catch (err) {
        console.error(`Error processing KYC ${kyc.user_email}:`, err);
        stats.kyc_verifications.errors++;
      }
    }

    // 6. Sync Support Tickets
    stats.support_tickets.total = allTickets.length;
    for (const ticket of allTickets) {
      try {
        // Skip if missing user_email
        if (!ticket.user_email) {
          console.log(`Skipping ticket ${ticket.id}: missing user_email`);
          stats.support_tickets.errors++;
          continue;
        }
        
        const { error } = await supabase.from('support_tickets').upsert({
          ticket_id: ticket.ticket_id || `TICKET-${ticket.id}`,
          user_email: ticket.user_email,
          subject: ticket.subject,
          description: ticket.message,
          category: ticket.category,
          status: ticket.status || 'open',
          priority: ticket.priority || 'medium',
          assigned_to: ticket.assigned_to,
          resolved_at: ticket.resolved_at,
          resolved_by: ticket.resolved_by,
          updated_at: ticket.updated_date,
        }, { onConflict: 'ticket_id' });
        
        if (error) {
          console.error(`Failed to sync ticket ${ticket.id}:`, error);
          stats.support_tickets.errors++;
        } else {
          stats.support_tickets.synced++;
        }
      } catch (err) {
        console.error(`Error processing ticket ${ticket.id}:`, err);
        stats.support_tickets.errors++;
      }
    }

    // 7. Sync Certificates
    stats.certificates.total = allCerts.length;
    for (const cert of allCerts) {
      try {
        // Skip if missing user_email
        if (!cert.user_email) {
          console.log(`Skipping certificate ${cert.certificate_id}: missing user_email`);
          stats.certificates.errors++;
          continue;
        }
        
        const { error } = await supabase.from('certificates').upsert({
          certificate_id: cert.certificate_id,
          user_email: cert.user_email,
          trader_name: cert.trader_name,
          type: cert.type,
          title: cert.title,
          account_id: cert.account_id,
          account_size: cert.account_size,
          challenge_type: cert.challenge_type,
          issue_date: cert.issue_date,
          is_verified: cert.is_verified ?? true,
          certificate_url: cert.certificate_url,
          created_at: cert.created_date,
        }, { onConflict: 'certificate_id' });
        
        if (error) {
          console.error(`Failed to sync certificate ${cert.certificate_id}:`, error);
          stats.certificates.errors++;
        } else {
          stats.certificates.synced++;
        }
      } catch (err) {
        console.error(`Error processing certificate ${cert.certificate_id}:`, err);
        stats.certificates.errors++;
      }
    }

    return Response.json({
      success: true,
      message: 'All entities synced to Supabase',
      stats,
      summary: {
        total_records: Object.values(stats).reduce((sum, s) => sum + s.total, 0),
        total_synced: Object.values(stats).reduce((sum, s) => sum + s.synced, 0),
        total_errors: Object.values(stats).reduce((sum, s) => sum + s.errors, 0),
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});