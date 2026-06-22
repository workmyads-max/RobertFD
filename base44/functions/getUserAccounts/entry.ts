/**
 * getUserAccounts — Returns ALL ChallengeAccount records belonging to the
 * authenticated user, using the service role (bypasses RLS) with
 * CASE-INSENSITIVE, TRIMMED email matching.
 *
 * WHY THIS EXISTS:
 *   The per-user RLS read filter (user_email = {{user.email}}) does exact
 *   string matching. If the stored user_email differs in casing or has stray
 *   whitespace vs the auth-token email, the RLS hides the user's OWN accounts
 *   even though they exist in the database. This function eliminates that
 *   failure mode by using the service role and normalizing emails.
 *
 * PRIVACY:
 *   Only returns accounts whose user_email matches the caller's email
 *   (case-insensitive, trimmed). No admin/staff bypass — every caller sees
 *   ONLY their own accounts. Admins use adminListAllAccounts for all-user views.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || !user.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const normalizedEmail = user.email.toLowerCase().trim();
    const sr = base44.asServiceRole;

    // Helper: case-insensitive match against the normalized caller email
    const matchesUser = (a) =>
      (a?.user_email || '').toLowerCase().trim() === normalizedEmail;

    // Step 1: Try exact-match filter (most common case — 1 query)
    let accounts = await sr.entities.ChallengeAccount.filter(
      { user_email: user.email },
      '-created_date',
      200
    );

    // Step 2: If empty, try the normalized (lowercased) email
    if (!accounts || accounts.length === 0) {
      accounts = await sr.entities.ChallengeAccount.filter(
        { user_email: normalizedEmail },
        '-created_date',
        200
      );
    }

    // Safety filter: always enforce case-insensitive ownership on the results
    const userAccounts = (accounts || []).filter(matchesUser);

    return Response.json({ accounts: userAccounts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});