import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { randomUUID } from 'crypto'

const BOT_PATTERNS = [
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
]

export async function POST(request: Request) {
  try {
    const ua = request.headers.get('user-agent') ?? ''
    const isBot = !ua || BOT_PATTERNS.some(p => ua.toLowerCase().includes(p))
    if (isBot) return NextResponse.json({ ok: false }, { status: 204 })

    const body = await request.json()
    const {
      profileId, slug, country, city,
      referrer, utmSource, utmMedium, utmCampaign, utmContent,
      linkId, fingerprint, sessionId,
    } = body

    if (!profileId) return NextResponse.json({ ok: false }, { status: 400 })

    await supabaseServer.from('profile_views').insert({
      profile_id: profileId,
      session_id: sessionId ?? randomUUID(),
      visitor_fingerprint: fingerprint,
      country_code: country,
      city: city,
      referrer: referrer,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      utm_content: utmContent,
      link_id: linkId ?? null,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
