import { createHash, randomUUID } from 'crypto'

// Server-only helpers (Node crypto) shared by every profile_views write path,
// so rows from the main profile page and private-link pages are comparable.

// Accepts Headers, Next's ReadonlyHeaders, or a NextRequest's headers.
type HeaderReader = { get(name: string): string | null }

// One id per page render, generated on the server and handed to the page's
// client trackers as a prop. profile_views.session_id and every jitsu_events
// row fired from that same load carry it, which is what lets
// build_engagement_funnel join the two tables. It is never written to
// cookies/sessionStorage — like a UTM value, it lives only for that one page
// load — so it doesn't need analytics consent.
export function newViewId(): string {
  return randomUUID()
}

// Non-reversible hash of UA + IP, used for unique-visitor dedup. Computed
// server-side on every path (previously link pages used a separate client-side
// UA+screen hash, so the two paths' fingerprints never matched).
export function visitorFingerprint(headers: HeaderReader): string {
  const userAgent = headers.get('user-agent') || ''
  const ip =
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    ''
  return createHash('sha256').update(userAgent + ip).digest('base64').slice(0, 16)
}
