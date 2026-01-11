"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ViewTracker({ username }: { username: string }) {
  const searchParams = useSearchParams();
  const isPreview = searchParams.get("preview") === "1";

  // Debug log (safe here)
  console.log("ViewTracker loaded", { username, isPreview });

  useEffect(() => {
    console.log("ViewTracker effect", { isPreview, username });

    if (isPreview) {
      console.log("Preview mode — not counting");
      return;
    }

    console.log("Sending view to Xano...");

    fetch(
      `https://xuwq-ib46-ag3b.f2.xano.io/api:ZUfHfBuE/profileCounter/${username}`,
      {
        method: "POST",
      }
    );
  }, [isPreview, username]);

  return null;
}
