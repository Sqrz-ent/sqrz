// Single source of truth for "should this request count as a real visitor?".
// Every analytics write path (main-profile view insert in app/page.tsx,
// /api/track-view, /api/track, and the private-link use_count increment in
// app/[slug]/page.tsx) imports this — previously the lists were copy-pasted per
// file and had already drifted (track-view had no datacenter check at all,
// /api/track had no filter of any kind).
//
// Edge-safe on purpose (no Node built-ins): /api/track runs on the edge runtime.
//
// This is a reactive, best-effort filter. Meta's ad-review/preview renderers
// send a realistic consumer UA by design, so no UA list catches them — the
// datacenter-city list is what catches them today, and it only works for sites
// we've already identified. A durable fix needs a "the page actually ran JS"
// signal or IP/ASN-level filtering, not a longer list.

const BOT_UA_PATTERNS = [
  'bot', 'crawler', 'spider', 'crawling',
  'googlebot', 'bingbot', 'slurp', 'duckduckbot',
  'baiduspider', 'yandexbot', 'sogou', 'exabot',
  'facebot', 'ia_archiver', 'python-requests',
  'curl/', 'wget/', 'axios/', 'node-fetch',
  'go-http-client', 'java/', 'ruby',
  'headlesschrome', 'phantomjs', 'selenium',
  'lighthouse', 'pagespeed', 'chrome-lighthouse',
  'vercel-screenshot', 'unfurl', 'whatsapp',
  'telegrambot', 'twitterbot', 'linkedinbot',
  'slackbot', 'discordbot',
  // Meta's link-preview/ad crawlers — neither contains "bot", so the generic
  // fallback above never caught them. facebookexternalhit also covers Apple's
  // iMessage link previews, which send a UA containing that token.
  'facebookexternalhit', 'meta-externalagent', 'meta-externalfetcher',
]

// Matched against Vercel's x-vercel-ip-city header (lowercased). Prefer small
// towns that are essentially only a datacenter; a big city here (e.g. Fort
// Worth) also drops that city's real visitors — accepted for now because the
// GCMN incident (2026-10) showed Meta's Fort Worth DC bursting 20+ fake views
// per minute at Boost ad destination URLs.
const DATACENTER_CITIES = new Set([
  // US datacenters
  'santa clara', 'ashburn', 'boardman', 'hillsboro', 'ogden',
  'los lunas', 'manassas', 'dekalb', 'north charleston', 'chicago',
  'council bluffs', 'the dalles', 'gallatin', 'social circle',
  'huntsville', 'north bergen', 'burlington', 'monte vista',
  // Meta datacenters confirmed in the GCMN incident (2026-10)
  'prineville', 'altoona', 'fort worth',
  // Other long-standing Meta datacenter towns
  'forest city', 'papillion', 'eagle mountain', 'new albany',
  // Singapore, Seoul, etc.
  'singapore', 'seoul', 'pune', 'são paulo', 'sao paulo', 'falkenstein',
])

// Accepts Headers, Next's ReadonlyHeaders, or a NextRequest's headers.
type HeaderReader = { get(name: string): string | null }

export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true
  const ua = userAgent.toLowerCase()
  return BOT_UA_PATTERNS.some(p => ua.includes(p))
}

export function isDatacenterCity(city: string | null | undefined): boolean {
  return !!city && DATACENTER_CITIES.has(city.toLowerCase())
}

type RequestSignals = {
  userAgent: string | null | undefined
  country: string | null | undefined
  city: string | null | undefined
}

// True when the request should NOT be counted as a visitor. country 'T1' is
// Vercel's code for Tor exit nodes; CN is excluded wholesale (scraper volume).
export function isLikelyBot({ userAgent, country, city }: RequestSignals): boolean {
  return (
    isBotUserAgent(userAgent) ||
    country === 'T1' ||
    country === 'CN' ||
    isDatacenterCity(city)
  )
}

// Reads the signals straight off request headers (Vercel geo headers), so every
// caller classifies the same way and none trusts client-supplied geo.
export function isLikelyBotRequest(headers: HeaderReader): boolean {
  return isLikelyBot({
    userAgent: headers.get('user-agent'),
    country: headers.get('x-vercel-ip-country'),
    city: safeDecode(headers.get('x-vercel-ip-city')),
  })
}

function safeDecode(value: string | null): string | null {
  if (!value) return null
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}
