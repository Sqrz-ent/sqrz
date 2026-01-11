"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ViewTracker({ username }: { username: string }) {
  const searchParams = useSearchParams();
  const isPreview = searchParams.get("preview") === "1";


  useEffect(() => {
    console.log("ViewTracker effect", { isPreview, username });

    if (isPreview) {
      return;
    }

console.log("ViewTracker", {
  href: window.location.href,
  preview: searchParams.get("preview"),
});

    fetch(`/api/profile/view/${username}`, {
      method: "POST",
    });
  }, [isPreview, username]); // 👈 dependency array goes here

  return null;
}
