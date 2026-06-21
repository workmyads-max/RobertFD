/**
 * registerUser — Creates a user account via Supabase admin API (no email verification required).
 * Called AFTER custom OTP verification is complete.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    const { email, password, firstName, lastName, country, otp_id } = await req.json();

    if (!email || !password || !otp_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Verify the OTP was marked as verified
    const otpRecords = await sr.entities.OTP.filter({ id: otp_id });
    if (!otpRecords.length) {
      return Response.json({ error: 'Invalid OTP session' }, { status: 400 });
    }
    const otpRecord = otpRecords[0];

    if (!otpRecord.verified) {
      return Response.json({ error: 'OTP not verified' }, { status: 400 });
    }

    if (otpRecord.email !== email) {
      return Response.json({ error: 'Email mismatch' }, { status: 400 });
    }

    // 2. Create account via Supabase Admin API (auto-confirms email, no verification email)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const fullName = [firstName, lastName].filter(Boolean).join(' ');

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // skip email verification
      user_metadata: {
        full_name: fullName,
        first_name: firstName || '',
        last_name: lastName || '',
        country: country || '',
      }
    });

    if (createError) {
      // If user already exists, that's okay — they may be retrying
      if (!createError.message?.toLowerCase().includes('already') &&
          !createError.message?.toLowerCase().includes('exist')) {
        return Response.json({ error: createError.message }, { status: 400 });
      }
    }

    return Response.json({ success: true, message: 'Account created successfully' });

  } catch (error) {
    console.error('registerUser error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});