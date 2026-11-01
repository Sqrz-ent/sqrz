import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { randomUUID } from 'crypto'
import { isLikelyBotRequest } from '@/lib/tracking/botFilter'
import { visitorFingerprint } from '@/lib/tracking/visitor'

export async function POST(request: Request) {
  try {
    if (isLikelyBotRequest(request.headers)) return new NextResponse(null, { status: 204 })

    const body = await request.json()
    const {
      profileId, country, city,
      referrer, utmSource, utmMedium, utmCampaign, utmContent, utmId,
      linkId, sessionId,
    } = body

    if (!profileId) return NextResponse.json({ ok: false }, { status: 400 })

    await supabaseServer.from('profile_views').insert({
      profile_id: profileId,
      session_id: sessionId ?? randomUUID(),
      visitor_fingerprint: visitorFingerprint(request.headers),
      country_code: country,
      city: city,
      referrer: referrer,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      utm_content: utmContent,
      utm_id: utmId ?? null,
      link_id: linkId ?? null,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
