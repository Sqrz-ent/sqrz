"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ViewTracker({ username }: { username: string }) {
  const searchParams = useSearchParams();
  const isPreview = searchParams.get("preview") === "1";

  useEffect(() => {
    if (isPreview) return;

    fetch(
      `https://xuwq-ib46-ag3b.f2.xano.io/api:ZUfHfBuE/profileCounter/${username}`,
      {
        method: "POST",
      }
    );
  }, [isPreview, username]);

  return null;
}
