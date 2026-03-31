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
    containerRef.current.appendChild(a);

    // Remove any existing BIT script first
    const existingScript = document.querySelector('script[src*="bandsintown"]');
    if (existingScript) existingScript.remove();

    // Also remove any existing widget state BIT may have cached
    if ((window as any).BIT) delete (window as any).BIT;

    // Load script AFTER anchor is in DOM
    const script = document.createElement("script");
    script.src = "https://widget.bandsintown.com/main.min.js";
    script.charset = "utf-8";
    // NOT async — must execute synchronously after anchor is ready
    document.body.appendChild(script);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [bandsintownUrl]);

  return <div ref={containerRef} />;
}
