/**
 * customAuth — ARCHIVED (Base44 Auth Consolidation, Priority 10)
 * All auth is now handled by Base44 native auth exclusively.
 * This endpoint returns a deprecation notice to prevent silent failures.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  return Response.json({
    success: false,
    archived: true,
    message: 'customAuth is archived. Use Base44 native auth (base44.auth.*) exclusively.',
  }, { status: 410 });
});