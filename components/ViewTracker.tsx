"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ViewTracker({ username }: { username: string }) {
  const searchParams = useSearchParams();
  const isPreview = searchParams.get("preview") === "1";

  console.log("ViewTracker loaded", { username, isPreview });

  useEffect(() => {
    console.log("ViewTracker effect", { isPreview, username });

    if (isPreview) {
      console.log("Preview mode — not counting");
      return;
    }

    console.log("Sending view to API...");

    fetch(`/api/profile/view/${username}`, {
      method: "POST",
    });
  }, [isPreview, username]); // 👈 dependency array goes here

  return null;
}
