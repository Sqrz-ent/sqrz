"use client";

import { useEffect, useMemo, useRef } from "react";
import { getBandsintownArtistFromUrl } from "@/lib/bandsintown";

type BandsintownWidgetProps = {
  bandsintownUrl: string; // <-- from your DB
  height?: number;
};

export default function BandsintownWidget({
  bandsintownUrl,
  height = 600,
}: BandsintownWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const artist = useMemo(() => {
    return getBandsintownArtistFromUrl(bandsintownUrl);
  }, [bandsintownUrl]);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = "";

    if (!artist) {
      containerRef.current.innerHTML =
        "<p style='opacity:.6;font-size:14px;'>Bandsintown link is missing or invalid.</p>";
      return;
    }

    const script = document.createElement("script");
    script.src = "https://widget.bandsintown.com/main.min.js";
    script.async = true;

    const a = document.createElement("a");
    a.setAttribute("class", "bit-widget-initializer");

    // IMPORTANT:
    // Bandsintown accepts either:
    // - "Coldplay"
    // - "a/1234567"
    a.setAttribute("data-artist-name", artist);

    a.setAttribute("data-display-local-dates", "true");
    a.setAttribute("data-display-past-dates", "false");
    a.setAttribute("data-auto-style", "true");
    a.setAttribute("data-text-color", "#111111");
    a.setAttribute("data-link-color", "#f3b130");
    a.setAttribute("data-background-color", "transparent");
    a.setAttribute("data-display-limit", "10");
    a.setAttribute("data-separator-color", "rgba(0,0,0,0.08)");

    const wrapper = document.createElement("div");
    wrapper.style.minHeight = `${height}px`;

    wrapper.appendChild(a);
    containerRef.current.appendChild(wrapper);
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [artist, height]);

  return <div ref={containerRef} className="w-full" />;
}
