"use client";

import { useEffect, useRef } from "react";

type BandsintownWidgetProps = {
  bandsintownUrl: string;
};

export default function BandsintownWidget({ bandsintownUrl }: BandsintownWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !bandsintownUrl) return;
    containerRef.current.innerHTML = "";

    const a = document.createElement("a");
    a.setAttribute("class", "bit-widget-initializer");
    a.setAttribute("data-artist-name", bandsintownUrl);
    a.setAttribute("data-display-local-dates", "false");
    a.setAttribute("data-display-past-dates", "false");
    a.setAttribute("data-auto-style", "true");
    a.setAttribute("data-language", "en");
    a.setAttribute("data-widget-width", "100%");
    a.setAttribute("data-background-color", "transparent");

    const script = document.createElement("script");
    script.src = "https://widget.bandsintown.com/main.min.js";
    script.charset = "utf-8";
    script.async = true;

    containerRef.current.appendChild(a);
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [bandsintownUrl]);

  return <div className="bit-widget-container" ref={containerRef} />;
}
