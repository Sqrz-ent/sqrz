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
    a.setAttribute("data-font-color", "#FFFFFF");
    a.setAttribute("data-button-label-capitalization", "capitalize");
    a.setAttribute("data-header-capitalization", "uppercase");
    a.setAttribute("data-background-color", "transparent");
    a.setAttribute("data-separator-color", "rgba(255,255,255,0.1)");
    a.setAttribute("data-language", "en");
    a.setAttribute("data-widget-width", "100%");

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

  return <div ref={containerRef} />;
}
