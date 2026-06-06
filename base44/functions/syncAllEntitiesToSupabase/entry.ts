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
      challenge_plans: { total: 0, synced: 0, errors: 0 },
      orders: { total: 0, synced: 0, errors: 0 },
      withdrawals: { total: 0, synced: 0, errors: 0 },
      affiliate_profiles: { total: 0, synced: 0, errors: 0 },
      affiliate_commissions: { total: 0, synced: 0, errors: 0 },
      kyc_verifications: { total: 0, synced: 0, errors: 0 },
      support_tickets: { total: 0, synced: 0, errors: 0 },
      certificates: { total: 0, synced: 0, errors: 0 },
      notifications: { total: 0, synced: 0, errors: 0 },
      coupons: { total: 0, synced: 0, errors: 0 },
      payment_gateways: { total: 0, synced: 0, errors: 0 },
      trade_records: { total: 0, synced: 0, errors: 0 },
      platform_settings: { total: 0, synced: 0, errors: 0 },
      social_media_settings: { total: 0, synced: 0, errors: 0 },
      affiliate_settings: { total: 0, synced: 0, errors: 0 },
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
    const allPlans = await base44.asServiceRole.entities.ChallengePlan.list();
    const allNotifications = await base44.asServiceRole.entities.Notification.list();
    const allCoupons = await base44.asServiceRole.entities.Coupon.list();
    const allGateways = await base44.asServiceRole.entities.PaymentGateway.list();
    const allTrades = await base44.asServiceRole.entities.TradeRecord.list();
    const allPlatformSettings = await base44.asServiceRole.entities.PlatformSettings.list();
    const allSocialSettings = await base44.asServiceRole.entities.SocialMediaSettings.list();
    const allAffiliateSettings = await base44.asServiceRole.entities.AffiliateSettings.list();
    
    // Collect all emails
    allOrders.forEach(o => o.email && allEmails.add(o.email));
    allAccounts.forEach(a => a.user_email && allEmails.add(a.user_email));
    allAffiliates.forEach(a => a.user_email && allEmails.add(a.user_email));
    allKYCs.forEach(k => k.user_email && allEmails.add(k.user_email));
    allTickets.forEach(t => t.user_email && allEmails.add(t.user_email));
    allCerts.forEach(c => c.user_email && allEmails.add(c.user_email));
    allWithdrawals.forEach(w => w.user_email && allEmails.add(w.user_email));
    
    // 0.5 Sync Challenge Plans (no user_email needed)
    stats.challenge_plans.total = allPlans.length;
    for (const plan of allPlans) {
      try {
        // Use plan_id as conflict key (text field, always set)
        const planPayload = {
          plan_id: plan.plan_id || `plan-${plan.id}`,
          name: plan.name,
          type: plan.type,
          account_type: plan.account_type || 'standard',
          size: plan.size,
          price: plan.price,
          leverage_standard: plan.leverage_standard || '1:100',
          leverage_swing: plan.leverage_swing || '1:30',
          phase1_target: plan.phase1_target || 10,
          phase2_target: plan.phase2_target || 5,
          daily_dd: plan.daily_dd || 5,
          max_dd: plan.max_dd || 10,
          profit_split: plan.profit_split || 80,
          max_lots: plan.max_lots || 20,
          news_trading: plan.news_trading ?? false,
          overnight_holding: plan.overnight_holding ?? false,
          weekend_holding: plan.weekend_holding ?? false,
          hedging: plan.hedging ?? false,
          is_active: plan.is_active ?? true,
          is_popular: plan.is_popular ?? false,
          sort_order: plan.sort_order || 0,
          updated_at: plan.updated_date,
        };
        const { error } = await supabase.from('challenge_plans').upsert(planPayload, { onConflict: 'plan_id' });
        
        if (error) {
          console.error(`Failed to sync plan ${plan.plan_id}:`, error);
          stats.challenge_plans.errors++;
        } else {
          stats.challenge_plans.synced++;
        }
      } catch (err) {
        console.error(`Error processing plan ${plan.plan_id}:`, err);
        stats.challenge_plans.errors++;
      }
    }
    
    // 0.6 Sync Orders
    stats.orders.total = allOrders.length;
    for (const order of allOrders) {
      try {
        if (!order.order_id || !order.email) {
          console.log(`Skipping order ${order.id}: missing order_id or email`);
          stats.orders.errors++;
          continue;
        }
        
        // Map payment methods to valid enum values
        const validPaymentMethods = ['usdt_trc20','bitcoin','checkout_com_card','checkout_com_apple_pay','checkout_com_google_pay','confirmo_crypto','nowpayments','coinpayments'];
        const pmRaw = order.payment_method || '';
        let pm = pmRaw;
        if (pmRaw === 'confirmo') pm = 'confirmo_crypto';
        if (!validPaymentMethods.includes(pm)) pm = null;

        const { error } = await supabase.from('orders').upsert({
          order_id: order.order_id,
          user_email: order.email,
          challenge_type: order.challenge_type,
          account_type: order.account_type || 'standard',
          account_size: order.account_size,
          platform: order.platform,
          leverage: order.leverage,
          price: order.price,
          payment_method: pm,
          payment_gateway: order.payment_gateway || 'manual',
          payment_address: order.payment_address,
          payment_status: order.payment_status || 'pending',
          full_name: order.full_name,
          username: order.username,
          email: order.email,
          phone: order.phone,
          country: order.country,
          city: order.city,
          address: order.address,
          postal_code: order.postal_code,
          transaction_id: order.transaction_id,
          account_id: order.account_id,
          coupon_code: order.coupon_code,
          discount_amount: order.discount_amount || 0,
          affiliate_code: order.affiliate_code,
          updated_at: order.updated_date,
        }, { onConflict: 'order_id' });
        
        if (error) {
          console.error(`Failed to sync order ${order.order_id}:`, error);
          stats.orders.errors++;
        } else {
          stats.orders.synced++;
        }
      } catch (err) {
        console.error(`Error processing order ${order.order_id}:`, err);
        stats.orders.errors++;
      }
    }
    
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

    // 0.7 Sync Notifications
    stats.notifications.total = allNotifications.length;
    for (const notif of allNotifications) {
      try {
        // Use INSERT ... ON CONFLICT DO UPDATE with a stable external_id column approach
        // First try to find existing by title+type, then upsert
        // Use external_id (Base44 id) to avoid duplicates on re-sync
        // First check if already exists
        const { data: existingNotif } = await supabase
          .from('notifications')
          .select('id')
          .eq('title', notif.title)
          .eq('type', notif.type || 'announcement')
          .maybeSingle();

        const notifPayload = {
          title: notif.title,
          message: notif.message,
          type: notif.type || 'announcement',
          priority: notif.priority || 'medium',
          display_mode: notif.display_mode || 'sidebar',
          is_active: notif.is_active ?? true,
          cta_label: notif.cta_label,
          cta_link: notif.cta_link,
          target: notif.target || 'all',
          scheduled_at: notif.scheduled_at,
          expires_at: notif.expires_at,
          updated_at: notif.updated_date,
        };

        let error;
        if (existingNotif?.id) {
          ({ error } = await supabase.from('notifications').update(notifPayload).eq('id', existingNotif.id));
        } else {
          ({ error } = await supabase.from('notifications').insert(notifPayload));
        }
        
        if (error) {
          console.error(`Failed to sync notification ${notif.id}:`, error);
          stats.notifications.errors++;
        } else {
          stats.notifications.synced++;
        }
      } catch (err) {
        console.error(`Error processing notification ${notif.id}:`, err);
        stats.notifications.errors++;
      }
    }
    
    // 0.8 Sync Coupons
    stats.coupons.total = allCoupons.length;
    for (const coupon of allCoupons) {
      try {
        const { error } = await supabase.from('coupons').upsert({
          code: coupon.code,
          name: coupon.name,
          discount_type: coupon.discount_type || 'percentage',
          discount_value: coupon.discount_value,
          is_active: coupon.is_active ?? true,
          max_uses: coupon.max_uses,
          uses_count: coupon.uses_count || 0,
          per_user_limit: coupon.per_user_limit || 1,
          expires_at: coupon.expires_at,
          applicable_challenge_types: coupon.applicable_challenge_types || [],
          applicable_account_sizes: coupon.applicable_account_sizes || [],
          applicable_platforms: coupon.applicable_platforms || [],
          notes: coupon.notes,
          updated_at: coupon.updated_date,
        }, { onConflict: 'code' });
        
        if (error) {
          console.error(`Failed to sync coupon ${coupon.code}:`, error);
          stats.coupons.errors++;
        } else {
          stats.coupons.synced++;
        }
      } catch (err) {
        console.error(`Error processing coupon ${coupon.code}:`, err);
        stats.coupons.errors++;
      }
    }
    
    // 0.9 Sync Payment Gateways
    stats.payment_gateways.total = allGateways.length;
    for (const gw of allGateways) {
      try {
        const { error } = await supabase.from('payment_gateways').upsert({
          name: gw.name,
          provider: gw.provider,
          is_active: gw.is_active ?? true,
          sandbox_mode: gw.sandbox_mode ?? false,
          api_key: gw.api_key,
          secret_key: gw.secret_key,
          webhook_secret: gw.webhook_secret,
          webhook_url: gw.webhook_url,
          supported_cards: gw.supported_cards || [],
          supported_crypto: gw.supported_crypto || [],
          networks: gw.networks || [],
          wallets: gw.wallets || [],
          notes: gw.notes,
          updated_at: gw.updated_date,
        }, { onConflict: 'name' });
        
        if (error) {
          console.error(`Failed to sync gateway ${gw.name}:`, error);
          stats.payment_gateways.errors++;
        } else {
          stats.payment_gateways.synced++;
        }
      } catch (err) {
        console.error(`Error processing gateway ${gw.name}:`, err);
        stats.payment_gateways.errors++;
      }
    }
    
    // 0.10 Sync Trade Records
    stats.trade_records.total = allTrades.length;
    for (const trade of allTrades) {
      try {
        if (!trade.account_id || !trade.trade_id) {
          console.log(`Skipping trade ${trade.id}: missing account_id or trade_id`);
          stats.trade_records.errors++;
          continue;
        }
        
        // Helper: only pass timestamp if it looks like a full ISO datetime
        const safeTs = (v) => {
          if (!v) return null;
          // If it's just a time string like "1:25:35 PM", skip it
          if (/^\d{1,2}:\d{2}/.test(String(v))) return null;
          return v;
        };
        // Don't pass Base44 hex id — use trade_id as unique key instead
        // First check if trade_id already exists
        const { data: existing } = await supabase.from('trade_records').select('id').eq('trade_id', trade.trade_id).single();
        const tradePayload = {
          account_id: trade.account_id,
          user_email: trade.user_email,
          trade_id: trade.trade_id,
          symbol: trade.symbol,
          type: trade.type,
          order_type: trade.order_type,
          lots: trade.lots,
          entry: trade.entry,
          close: trade.close,
          sl: trade.sl,
          tp: trade.tp,
          margin: trade.margin,
          pnl: trade.pnl,
          status: trade.status || 'open',
          close_reason: trade.close_reason,
          open_time: safeTs(trade.open_time),
          close_time: safeTs(trade.close_time),
          updated_at: trade.updated_date,
        };
        let error;
        if (existing?.id) {
          // Update existing
          ({ error } = await supabase.from('trade_records').update(tradePayload).eq('id', existing.id));
        } else {
          // Insert new
          ({ error } = await supabase.from('trade_records').insert(tradePayload));
        }
        
        if (error) {
          console.error(`Failed to sync trade ${trade.trade_id}:`, error);
          stats.trade_records.errors++;
        } else {
          stats.trade_records.synced++;
        }
      } catch (err) {
        console.error(`Error processing trade ${trade.trade_id}:`, err);
        stats.trade_records.errors++;
      }
    }
    
    // 0.11 Sync Platform Settings
    stats.platform_settings.total = allPlatformSettings.length;
    for (const setting of allPlatformSettings) {
      try {
        const { error } = await supabase.from('platform_settings').upsert({
          setting_key: setting.setting_key,
          label: setting.label,
          is_enabled: setting.is_enabled ?? true,
          category: setting.category || 'system',
          description: setting.description,
          updated_at: setting.updated_date,
        }, { onConflict: 'setting_key' });
        
        if (error) {
          console.error(`Failed to sync platform setting ${setting.setting_key}:`, error);
          stats.platform_settings.errors++;
        } else {
          stats.platform_settings.synced++;
        }
      } catch (err) {
        console.error(`Error processing platform setting ${setting.setting_key}:`, err);
        stats.platform_settings.errors++;
      }
    }
    
    // 0.12 Sync Social Media Settings
    stats.social_media_settings.total = allSocialSettings.length;
    for (const social of allSocialSettings) {
      try {
        const { error } = await supabase.from('social_media_settings').upsert({
          setting_key: social.setting_key,
          discord_url: social.discord_url,
          discord_enabled: social.discord_enabled ?? true,
          instagram_url: social.instagram_url,
          instagram_enabled: social.instagram_enabled ?? true,
          twitter_url: social.twitter_url,
          twitter_enabled: social.twitter_enabled ?? true,
          youtube_url: social.youtube_url,
          youtube_enabled: social.youtube_enabled ?? true,
          updated_at: social.updated_date,
        }, { onConflict: 'setting_key' });
        
        if (error) {
          console.error(`Failed to sync social media setting ${social.setting_key}:`, error);
          stats.social_media_settings.errors++;
        } else {
          stats.social_media_settings.synced++;
        }
      } catch (err) {
        console.error(`Error processing social media setting ${social.setting_key}:`, err);
        stats.social_media_settings.errors++;
      }
    }
    
    // 0.13 Sync Affiliate Settings
    stats.affiliate_settings.total = allAffiliateSettings.length;
    for (const affSetting of allAffiliateSettings) {
      try {
        const { error } = await supabase.from('affiliate_settings').upsert({
          setting_key: affSetting.setting_key,
          l1_rate: affSetting.l1_rate || 8,
          l2_rate: affSetting.l2_rate || 2,
          l3_rate: affSetting.l3_rate || 1,
          payout_tier_0_rate: affSetting.payout_tier_0_rate || 7,
          payout_tier_10_rate: affSetting.payout_tier_10_rate || 11,
          payout_tier_25_rate: affSetting.payout_tier_25_rate || 17,
          payout_tier_50_rate: affSetting.payout_tier_50_rate || 25,
          min_withdrawal: affSetting.min_withdrawal || 50,
          withdrawal_fee: affSetting.withdrawal_fee || 0,
          is_program_active: affSetting.is_program_active ?? true,
          updated_at: affSetting.updated_date,
        }, { onConflict: 'setting_key' });
        
        if (error) {
          console.error(`Failed to sync affiliate setting ${affSetting.setting_key}:`, error);
          stats.affiliate_settings.errors++;
        } else {
          stats.affiliate_settings.synced++;
        }
      } catch (err) {
        console.error(`Error processing affiliate setting ${affSetting.setting_key}:`, err);
        stats.affiliate_settings.errors++;
      }
    }

    // 1. Sync Challenge Accounts
    stats.challenge_accounts.total = allAccounts.length;
    for (let account of allAccounts) {
      try {
        // Add placeholder email for accounts without user_email
        if (!account.user_email) {
          account = { ...account, user_email: 'admin@placeholder.com' };
          // Ensure placeholder profile exists
          await supabase.from('profiles').upsert({ email: 'admin@placeholder.com', updated_at: new Date().toISOString() }, { onConflict: 'email' });
        }
        const validChallengeTypes = ['two-step', 'instant', 'instant_light'];
        if (!validChallengeTypes.includes(account.challenge_type)) {
          console.log(`Skipping account ${account.account_id}: invalid challenge_type '${account.challenge_type}'`);
          stats.challenge_accounts.errors++;
          continue;
        }
        
        const { error } = await supabase.from('challenge_accounts').upsert({
          account_id: account.account_id || account.id,
          user_email: account.user_email || 'unknown@placeholder.com',
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

    // 3. Sync Affiliate Profiles (reuse allAffiliates already fetched above)
    const affiliates = allAffiliates;
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

    // 4. Sync Affiliate Commissions (fetched once at top)
    const allCommissions = await base44.asServiceRole.entities.AffiliateCommission.list();
    const commissions = allCommissions;
    stats.affiliate_commissions.total = commissions.length;
    for (const commission of commissions) {
      try {
        // Check if commission already exists by affiliate_email + order_id combo
        const { data: existingComm } = await supabase
          .from('affiliate_commissions')
          .select('id')
          .eq('affiliate_email', commission.affiliate_email)
          .eq('order_id', commission.order_id || '')
          .maybeSingle();

        const commPayload = {
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
        };

        let error;
        if (existingComm?.id) {
          ({ error } = await supabase.from('affiliate_commissions').update(commPayload).eq('id', existingComm.id));
        } else {
          ({ error } = await supabase.from('affiliate_commissions').insert(commPayload));
        }
        
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
        // Use placeholder for tickets without user_email
        let ticketData = ticket.user_email ? ticket : { ...ticket, user_email: 'admin@placeholder.com' };
        
        const { error } = await supabase.from('support_tickets').upsert({
          ticket_id: ticketData.ticket_id || `TICKET-${ticketData.id}`,
          user_email: ticketData.user_email,
          subject: ticketData.subject,
          description: ticketData.message,
          category: ticketData.category,
          status: ticketData.status || 'open',
          priority: ticketData.priority || 'medium',
          assigned_to: ticketData.assigned_to,
          resolved_at: ticketData.resolved_at,
          resolved_by: ticketData.resolved_by,
          updated_at: ticketData.updated_date,
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
        
        if (!cert.certificate_id) {
          console.log(`Skipping certificate ${cert.id}: missing certificate_id`);
          stats.certificates.errors++;
          continue;
        }
        const { error } = await supabase.from('certificates').upsert({
          certificate_id: cert.certificate_id,
          user_email: cert.user_email,
          trader_name: cert.trader_name || cert.user_email || 'Trader',
          type: cert.type,
          title: cert.title || cert.type,
          account_id: cert.account_id || null,
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