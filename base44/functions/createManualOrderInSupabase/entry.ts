/**
 * createManualOrderInSupabase — ARCHIVED (Base44 Consolidation, Priority 10)
 * Orders are created via Base44 entities SDK. Supabase direct writes are removed.
 */
Deno.serve(async () => {
  return Response.json({
    success: false,
    archived: true,
    message: 'createManualOrderInSupabase is archived. Use Base44 entities to create orders.',
  }, { status: 410 });
});