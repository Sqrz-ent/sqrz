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


    fetch(`/api/profile/view/${username}`, {
      method: "POST",
    });
  }, [isPreview, username]); // 👈 dependency array goes here

  return null;
}
