"use client";

import { useTracking } from "@/components/hooks/useTracking";

type TrackingGateProps = {
  profileSlug: string | null;
  profileId: string | null;
  hasCustomPixels: boolean;
  viewId: string;
};

export default function TrackingGate({
  profileSlug,
  profileId,
  hasCustomPixels,
  viewId,
}: TrackingGateProps) {
  useTracking({ profileSlug, profileId, hasCustomPixels, viewId });
  return null;
}
