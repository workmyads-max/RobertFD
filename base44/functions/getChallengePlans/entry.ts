import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Use service role so this works for ALL users including unauthenticated/mobile
    const plans = await base44.asServiceRole.entities.ChallengePlan.list('-created_date', 200);
    const result = Array.isArray(plans) ? plans : [];
    return Response.json({ plans: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});