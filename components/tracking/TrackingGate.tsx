"use client";

import { useTracking } from "@/components/hooks/useTracking";

type TrackingGateProps = {
  profileSlug: string | null;
  profileId: string | null;
  userTier: number | null;
  hasCustomPixels: boolean;
};

export default function TrackingGate({
  profileSlug,
  profileId,
  userTier,
  hasCustomPixels,
}: TrackingGateProps) {
  useTracking({ profileSlug, profileId, userTier, hasCustomPixels });
  return null;
}
