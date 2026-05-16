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
}

export default function ViewTracker(props: Props) {
  useEffect(() => {
    const ua = navigator.userAgent
    const screen = `${window.screen.width}x${window.screen.height}`
    const raw = ua + screen + (props.slug ?? '')

    let hash = 0
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) - hash) + raw.charCodeAt(i)
      hash |= 0
    }
    const fingerprint = Math.abs(hash).toString(36).padStart(8, '0')
    const sessionId = sessionStorage.getItem('sqrz_session') ?? (() => {
      const id = Math.random().toString(36).slice(2)
      sessionStorage.setItem('sqrz_session', id)
      return id
    })()

    const timer = setTimeout(() => {
      fetch('/api/track-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...props, fingerprint, sessionId }),
      }).catch(() => {}) // silent fail — never block the page
    }, 5000)

    return () => clearTimeout(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
