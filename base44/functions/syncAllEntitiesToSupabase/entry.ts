/**
 * syncAllEntitiesToSupabase — ARCHIVED (Base44 Consolidation, Priority 10)
 * Base44 entities are the single source of truth. Supabase sync is removed.
 */
Deno.serve(async () => {
  return Response.json({
    success: false,
    archived: true,
    message: 'syncAllEntitiesToSupabase is archived. Base44 entities are the single source of truth.',
  }, { status: 410 });
});