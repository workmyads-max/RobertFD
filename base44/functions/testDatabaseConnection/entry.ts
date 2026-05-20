/**
 * testDatabaseConnection - Health check for Supabase and Base44 database
 */
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;
    
    const results = {
      timestamp: new Date().toISOString(),
      checks: {},
      status: 'healthy',
      errors: []
    };
    
    // Test 1: Base44 Entity Access
    try {
      const userAccounts = await sr.entities.UserAccount.list({ limit: 1 });
      results.checks.base44_entities = {
        status: '✅ OK',
        count: userAccounts.length,
        message: 'Can access UserAccount entity'
      };
    } catch (error) {
      results.checks.base44_entities = {
        status: '❌ FAILED',
        error: error.message
      };
      results.status = 'degraded';
      results.errors.push('Base44 entity access failed');
    }
    
    // Test 2: Supabase Connection
    try {
      const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      
      const { data, error } = await supabase.from('challenge_plans').select('id').limit(1);
      
      if (error) {
        results.checks.supabase_database = {
          status: '❌ FAILED',
          error: error.message
        };
        results.status = 'degraded';
        results.errors.push('Supabase database query failed');
      } else {
        results.checks.supabase_database = {
          status: '✅ OK',
          message: 'Can query Supabase tables'
        };
      }
    } catch (error) {
      results.checks.supabase_database = {
        status: '❌ FAILED',
        error: error.message
      };
      results.status = 'unhealthy';
      results.errors.push('Supabase connection failed');
    }
    
    // Test 3: Supabase Auth
    try {
      const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
      const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1 });
      
      if (error) {
        results.checks.supabase_auth = {
          status: '❌ FAILED',
          error: error.message
        };
        results.status = 'degraded';
        results.errors.push('Supabase auth API failed');
      } else {
        results.checks.supabase_auth = {
          status: '✅ OK',
          total_users: users.length
        };
      }
    } catch (error) {
      results.checks.supabase_auth = {
        status: '❌ FAILED',
        error: error.message
      };
      results.status = 'unhealthy';
      results.errors.push('Supabase auth connection failed');
    }
    
    // Test 4: Secrets Check
    const secrets = {
      SUPABASE_URL: !!SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!SERVICE_ROLE_KEY,
      SMTP_HOST: !!Deno.env.get('SMTP_HOST'),
      SMTP_USERNAME: !!Deno.env.get('SMTP_USERNAME'),
      SMTP_PASSWORD: !!Deno.env.get('SMTP_PASSWORD'),
    };
    
    results.checks.secrets = {
      status: Object.values(secrets).every(v => v) ? '✅ OK' : '⚠️ MISSING',
      details: secrets
    };
    
    if (!Object.values(secrets).every(v => v)) {
      results.status = 'degraded';
      results.errors.push('Some secrets are missing');
    }
    
    // Test 5: Count UserAccount records
    try {
      const allAccounts = await sr.entities.UserAccount.list({ limit: 1000 });
      const verifiedCount = allAccounts.filter(a => a.is_verified).length;
      const unverifiedCount = allAccounts.filter(a => !a.is_verified).length;
      
      results.checks.user_accounts = {
        status: '✅ OK',
        total: allAccounts.length,
        verified: verifiedCount,
        unverified: unverifiedCount,
        has_admin: allAccounts.some(a => a.role === 'admin')
      };
    } catch (error) {
      results.checks.user_accounts = {
        status: '❌ FAILED',
        error: error.message
      };
    }
    
    return Response.json(results);
    
  } catch (error) {
    return Response.json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
});