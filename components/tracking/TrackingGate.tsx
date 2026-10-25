"use client";

import { useTracking } from "@/components/hooks/useTracking";

type TrackingGateProps = {
  profileSlug: string | null;
  profileId: string | null;
  userTier: number | null;
  hasCustomPixels: boolean;
  viewId: string;
};

export default function TrackingGate({
  profileSlug,
  profileId,
  userTier,
  hasCustomPixels,
  viewId,
}: TrackingGateProps) {
  useTracking({ profileSlug, profileId, userTier, hasCustomPixels, viewId });
  return null;
}
