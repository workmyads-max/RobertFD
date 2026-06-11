/**
 * applyFirstTimeDiscount - Check if user is eligible for first-time discount
 * Returns discount info if eligible, validates IP/MAC address restrictions
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get client IP from headers
    const clientIP = req.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() || 
                     req.headers.get('X-Real-IP') || 
                     'unknown';

    // Get device fingerprint from headers (set by frontend)
    const deviceFingerprint = req.headers.get('X-Device-Fingerprint') || 'unknown';

    // Get promotion settings
    const settingsList = await base44.asServiceRole.entities.PromotionSettings.filter({ setting_key: 'first_time_discount' });
    const settings = settingsList[0];

    if (!settings || !settings.is_first_time_discount_active) {
      return Response.json({ eligible: false, reason: 'Promotion not active' });
    }

    // Check if user already has a discount record
    const existingDiscounts = await base44.asServiceRole.entities.FirstTimeDiscount.filter({ user_email: user.email });
    
    if (existingDiscounts.length > 0) {
      const existing = existingDiscounts[0];
      
      if (existing.is_used) {
        return Response.json({ 
          eligible: false, 
          reason: 'Discount already used',
          used_at: existing.used_at,
          order_id: existing.order_id,
        });
      }

      // Check if still valid (not expired)
      if (existing.expires_at && new Date(existing.expires_at) < new Date()) {
        return Response.json({ eligible: false, reason: 'Discount expired' });
      }

      return Response.json({
        eligible: true,
        discount_code: existing.discount_code,
        discount_percent: existing.discount_percent,
        expires_at: existing.expires_at,
      });
    }

    // Check if IP/MAC already used discount (one per IP/MAC rule)
    if (settings.one_per_ip_mac) {
      const ipDiscounts = await base44.asServiceRole.entities.FirstTimeDiscount.filter({ ip_address: clientIP });
      if (ipDiscounts.length > 0 && ipDiscounts.some(d => d.is_used)) {
        return Response.json({ 
          eligible: false, 
          reason: 'Discount already used from this IP address',
        });
      }

      const deviceDiscounts = await base44.asServiceRole.entities.FirstTimeDiscount.filter({ device_fingerprint: deviceFingerprint });
      if (deviceDiscounts.length > 0 && deviceDiscounts.some(d => d.is_used)) {
        return Response.json({ 
          eligible: false, 
          reason: 'Discount already used from this device',
        });
      }
    }

    // Check max account size limit
    const maxAccountSize = settings.max_account_size_for_discount || 50000;

    // Create discount record for user
    const expiresAt = settings.discount_end_date ? new Date(settings.discount_end_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    const discount = await base44.asServiceRole.entities.FirstTimeDiscount.create({
      user_email: user.email,
      ip_address: clientIP,
      device_fingerprint: deviceFingerprint,
      discount_code: settings.first_time_discount_code || 'NEW25',
      discount_percent: settings.first_time_discount_percent || 25,
      is_used: false,
      created_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    });

    return Response.json({
      eligible: true,
      discount_code: discount.discount_code,
      discount_percent: discount.discount_percent,
      expires_at: discount.expires_at,
      max_account_size: maxAccountSize,
      applicable_plans: settings.applicable_plans || [],
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});