import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * fetchEconomicCalendar
 * ────────────────────
 * Fetches economic calendar events from the FREE ForexFactory/FairEconomy JSON feeds
 * (no API key required), parses them, converts event times to UTC, and upserts into
 * the EconomicEvent entity (dedup by title + currency + event_time).
 *
 * Sources:
 *   https://nfs.faireconomy.media/ff_calendar_thisweek.json
 *   https://nfs.faireconomy.media/ff_calendar_nextweek.json
 *
 * Callable by:
 *   1. Scheduled automation (SCHEDULER_SECRET_TOKEN passed as query param or body)
 *   2. Authenticated users (manual refresh from the Economic Calendar page)
 *
 * Uses service role for all DB writes since EconomicEvent is admin-create only.
 */

const FEED_URLS = [
  'https://nfs.faireconomy.media/ff_calendar_thisweek.json',
  'https://nfs.faireconomy.media/ff_calendar_nextweek.json',
];

const VALID_IMPACTS = new Set(['High', 'Medium', 'Low']);

// Country code → currency code mapping (FairEconomy uses country names)
const COUNTRY_TO_CURRENCY = {
  'us': 'USD', 'united states': 'USD', 'usa': 'USD',
  'eu': 'EUR', 'euro zone': 'EUR', 'eurozone': 'EUR',
  'gb': 'GBP', 'united kingdom': 'GBP', 'britain': 'GBP',
  'ca': 'CAD', 'canada': 'CAD',
  'jp': 'JPY', 'japan': 'JPY',
  'au': 'AUD', 'australia': 'AUD',
  'nz': 'NZD', 'new zealand': 'NZD',
  'ch': 'CHF', 'switzerland': 'CHF',
  'cn': 'CNY', 'china': 'CNY',
};

function resolveCurrency(countryRaw) {
  if (!countryRaw) return null;
  const key = countryRaw.trim().toLowerCase();
  if (COUNTRY_TO_CURRENCY[key]) return COUNTRY_TO_CURRENCY[key];
  // Some feeds already use 3-letter currency codes directly
  if (key.length === 3 && /^[a-z]{3}$/.test(key)) return key.toUpperCase();
  return countryRaw.trim().toUpperCase().slice(0, 3);
}

function parseEventTime(dateStr) {
  if (!dateStr) return null;
  // The feed's date field includes a timezone offset, e.g. "2024-06-22T08:30:00-04:00"
  // new Date() parses this correctly, and toISOString() gives UTC.
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

function buildDedupeKey(title, currency, eventTime) {
  return `${(title || '').trim().toLowerCase()}|${(currency || '').trim().toUpperCase()}|${eventTime}`;
}

Deno.serve(async (req) => {
  try {
    // ── Auth: accept either scheduler token or authenticated user ──────────
    const url = new URL(req.url);
    const schedulerToken = url.searchParams.get('token') || (req.method === 'POST' ? (() => {
      try { return null; } catch { return null; }
    })() : null);

    let isAuthorized = false;

    // Check scheduler token from body or query
    let bodyToken = null;
    if (req.method === 'POST') {
      try {
        const cloned = req.clone();
        const parsed = await cloned.json().catch(() => ({}));
        bodyToken = parsed.token || parsed.scheduler_token;
      } catch {}
    }

    if (schedulerToken === Deno.env.get('SCHEDULER_SECRET_TOKEN') || bodyToken === Deno.env.get('SCHEDULER_SECRET_TOKEN')) {
      isAuthorized = true;
    }

    // If not scheduler, check user auth
    if (!isAuthorized) {
      const base44 = createClientFromRequest(req);
      const user = await base44.auth.me().catch(() => null);
      if (user) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Fetch both feeds ──────────────────────────────────────────────────
    const feedResponses = await Promise.all(
      FEED_URLS.map(async (feedUrl) => {
        try {
          const resp = await fetch(feedUrl, {
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(15000),
          });
          if (!resp.ok) return [];
          const data = await resp.json();
          return Array.isArray(data) ? data : [];
        } catch {
          return [];
        }
      })
    );

    const allRawEvents = [...feedResponses[0], ...feedResponses[1]];

    // ── Parse + normalize events ──────────────────────────────────────────
    const parsedEvents = [];
    for (const raw of allRawEvents) {
      try {
        const title = (raw.title || '').trim();
        const currency = resolveCurrency(raw.country);
        const eventTime = parseEventTime(raw.date);
        const impact = VALID_IMPACTS.has(raw.impact) ? raw.impact : 'Low';
        const forecast = raw.forecast != null ? String(raw.forecast).trim() : '';
        const previous = raw.previous != null ? String(raw.previous).trim() : '';

        if (!title || !currency || !eventTime) continue;
        parsedEvents.push({ title, currency, event_time: eventTime, impact, forecast, previous });
      } catch {}
    }

    // ── Dedup against existing records (service role) ──────────────────────
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole;

    // Fetch all existing events to build dedup set (cap at 2000 for safety)
    const existing = await db.entities.EconomicEvent.list('event_time', 2000);
    const existingKeys = new Set(
      (existing || []).map(e => buildDedupeKey(e.title, e.currency, e.event_time))
    );

    const toCreate = [];
    const seenKeys = new Set();
    for (const ev of parsedEvents) {
      const key = buildDedupeKey(ev.title, ev.currency, ev.event_time);
      if (existingKeys.has(key) || seenKeys.has(key)) continue;
      seenKeys.add(key);
      toCreate.push(ev);
    }

    // Bulk create new events
    let created = 0;
    if (toCreate.length > 0) {
      // Batch in groups of 50 to avoid payload limits
      for (let i = 0; i < toCreate.length; i += 50) {
        const batch = toCreate.slice(i, i + 50);
        try {
          const result = await db.entities.EconomicEvent.bulkCreate(batch);
          created += Array.isArray(result) ? result.length : (batch.length);
        } catch {}
      }
    }

    return Response.json({
      success: true,
      fetched: parsedEvents.length,
      created,
      deduped: parsedEvents.length - created,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});