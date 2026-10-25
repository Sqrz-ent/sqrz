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

// Private-link page views are only counted once this beacon lands — i.e. the
// page actually ran JS and stayed open 5 seconds. Fingerprint and bot
// filtering are done server-side in /api/track-view.
export default function ViewTracker(props: Props) {
  useEffect(() => {
    const timer = setTimeout(() => {
      fetch('/api/track-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...props, sessionId: props.viewId }),
      }).catch(() => {}) // silent fail — never block the page
    }, 5000)

    return () => clearTimeout(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
