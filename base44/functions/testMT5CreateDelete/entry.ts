/**
 * testMT5CreateDelete — Creates a random test MT5 account then immediately deletes it.
 * Admin-only. Used to verify that the MT5 API supports account creation and deletion.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const MT5_BASE = Deno.env.get('MT5_API_BASE_URL');
    const MT5_KEY  = Deno.env.get('MT5_API_KEY');
    const MT5_SERVER = Deno.env.get('MT5_SERVER_NAME') || 'XyloMarkets-Server';
    const PHASE1_GROUP = Deno.env.get('MT5_PHASE1_GROUP') || '';

    if (!MT5_BASE || !MT5_KEY) {
      return Response.json({ error: 'MT5_API_BASE_URL or MT5_API_KEY not set' }, { status: 500 });
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MT5_KEY}`,
      'ApiKey': MT5_KEY,
    };

    const testPassword = 'TestPass@' + Math.floor(Math.random() * 9000 + 1000);
    const testName = 'TEST_DELETE_ME_' + Date.now();

    // ── STEP 1: Create account ────────────────────────────────────────────────
    console.log('[TEST] Creating test MT5 account...');
    const createBody = {
      Name: testName,
      Email: `test_${Date.now()}@delete.me`,
      Password: testPassword,
      Group: PHASE1_GROUP,
      Leverage: 100,
      Balance: 0,
      Server: MT5_SERVER,
      apikey: MT5_KEY,
    };

    const createRes = await fetch(`${MT5_BASE}/api/v1/user/usercreate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(createBody),
    });

    const createText = await createRes.text();
    let createData;
    try { createData = JSON.parse(createText); } catch { createData = createText; }

    console.log(`[TEST] Create response HTTP ${createRes.status}: ${createText.slice(0, 400)}`);

    if (!createRes.ok) {
      return Response.json({
        success: false,
        step: 'create',
        http_status: createRes.status,
        response: createData,
      });
    }

    // Extract the new login number from response
    const newLogin = createData?.data?.Login ?? createData?.data?.login
      ?? createData?.Login ?? createData?.login ?? null;

    if (!newLogin) {
      return Response.json({
        success: false,
        step: 'create',
        error: 'Account created but could not extract login from response',
        response: createData,
      });
    }

    console.log(`[TEST] ✅ Account created: login=${newLogin}`);

    // ── STEP 2: Verify it exists ──────────────────────────────────────────────
    const verifyRes = await fetch(`${MT5_BASE}/api/v1/user/userget`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ Login: parseInt(newLogin), apikey: MT5_KEY }),
    });
    const verifyData = verifyRes.ok ? await verifyRes.json().catch(() => null) : null;
    const verified = verifyRes.ok && (verifyData?.data?.Login || verifyData?.data?.login);
    console.log(`[TEST] Verify: HTTP ${verifyRes.status}, exists=${verified}`);

    // ── STEP 3: Delete account ────────────────────────────────────────────────
    console.log(`[TEST] Deleting test account login=${newLogin}...`);

    // Try primary delete endpoint
    const deleteBody = { Login: parseInt(newLogin), apikey: MT5_KEY };
    const deleteRes = await fetch(`${MT5_BASE}/api/v1/user/userdelete`, {
      method: 'POST',
      headers,
      body: JSON.stringify(deleteBody),
    });
    const deleteText = await deleteRes.text();
    let deleteData;
    try { deleteData = JSON.parse(deleteText); } catch { deleteData = deleteText; }
    console.log(`[TEST] Delete response HTTP ${deleteRes.status}: ${deleteText.slice(0, 400)}`);

    // If primary delete fails, try archive/disable as fallback
    let archiveResult = null;
    if (!deleteRes.ok || deleteData?.data?.errorcode > 0) {
      console.log('[TEST] Primary delete failed, trying move-disabled as fallback...');
      const archiveRes = await fetch(`${MT5_BASE}/api/v1/user/move-disabled`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ Login: parseInt(newLogin), apikey: MT5_KEY }),
      });
      const archiveText = await archiveRes.text();
      try { archiveResult = JSON.parse(archiveText); } catch { archiveResult = archiveText; }
      console.log(`[TEST] Archive (move-disabled) HTTP ${archiveRes.status}: ${archiveText.slice(0, 300)}`);
    }

    return Response.json({
      success: true,
      new_login: newLogin,
      test_name: testName,
      steps: {
        create: { http: createRes.status, data: createData },
        verify: { http: verifyRes.status, exists: verified, data: verifyData?.data ?? null },
        delete: {
          http: deleteRes.status,
          data: deleteData,
          errorcode: deleteData?.data?.errorcode ?? null,
          archive_fallback: archiveResult,
        },
      },
      conclusion: deleteRes.ok && (deleteData?.data?.errorcode === 0 || deleteData?.data?.errorcode == null)
        ? '✅ Create + Delete both work — safe to auto-delete inactive accounts'
        : archiveResult
          ? '⚠️ Delete endpoint failed but move-disabled works — can archive instead of delete'
          : '❌ Both delete and archive failed — review MT5 broker permissions',
    });

  } catch (err) {
    console.error('[testMT5CreateDelete] Error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});