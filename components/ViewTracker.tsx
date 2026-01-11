"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ViewTracker({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const isPreview = searchParams.get("preview") === "1";

  useEffect(() => {
    if (isPreview) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/view/${slug}`, {
      method: "POST",
    });
  }, [isPreview, slug]);

  return null;
}
