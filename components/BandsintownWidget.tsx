"use client";

import { useEffect, useMemo, useRef } from "react";
import { getBandsintownArtistFromUrl } from "@/lib/bandsintown";

type BandsintownWidgetProps = {
  bandsintownUrl: string;
};

export default function BandsintownWidget({ bandsintownUrl }: BandsintownWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const artist = useMemo(() => {
    return getBandsintownArtistFromUrl(bandsintownUrl);
  }, [bandsintownUrl]);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    if (!artist) return;

    const script = document.createElement("script");
    script.src = "https://widget.bandsintown.com/main.min.js";
    script.async = true;

    const a = document.createElement("a");
    a.setAttribute("class", "bit-widget-initializer");
    a.setAttribute("data-artist-name", artist);

    containerRef.current.appendChild(a);
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [artist]);

  return <div ref={containerRef} />;
}
