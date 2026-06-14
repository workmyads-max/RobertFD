/**
 * syncOrdersToSupabase — ARCHIVED (Base44 Consolidation, Priority 10)
 * Order data lives exclusively in Base44 entities. Supabase sync is removed.
 */
Deno.serve(async () => {
  return Response.json({
    success: false,
    archived: true,
    message: 'syncOrdersToSupabase is archived. Use Base44 entities for all order data.',
  }, { status: 410 });
});