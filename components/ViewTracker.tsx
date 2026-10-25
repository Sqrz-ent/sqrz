'use client'
import { useEffect } from 'react'

type Props = {
  profileId: string
  slug: string
  country: string | null
  city: string | null
  referrer: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  utmContent: string | null
  linkId: string | null
  // Server-issued per-load id (lib/tracking/visitor.ts) — becomes
  // profile_views.session_id, matching this load's jitsu_events pings.
  viewId: string
}

// The ONLY writer of profile_views for both the main profile page and private
// links: a view counts once a real browser has run this page's JS and actually
// shown it. Server-only fetches (crawlers, link-preview bots, uptime monitors)
// never run JS; pages prerendered in the background (Meta's in-app browser
// prefetches ad destinations) only count if the visitor actually opens them.
// Fires immediately on visibility rather than after a dwell delay, so ad
// visitors who bounce within seconds are still counted. Fingerprint and bot
// filtering are done server-side in /api/track-view.
export default function ViewTracker(props: Props) {
  useEffect(() => {
    let sent = false
    const send = () => {
      if (sent || document.visibilityState !== 'visible') return
      sent = true
      document.removeEventListener('visibilitychange', send)
      fetch('/api/track-view', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...props, sessionId: props.viewId }),
      }).catch(() => {}) // silent fail — never block the page
    }

    send()
    document.addEventListener('visibilitychange', send)
    return () => document.removeEventListener('visibilitychange', send)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
