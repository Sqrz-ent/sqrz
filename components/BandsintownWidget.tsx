"use client";

import { useEffect, useRef } from "react";

type BandsintownWidgetProps = {
  bandsintownUrl: string;
};

export default function BandsintownWidget({ bandsintownUrl }: BandsintownWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    if (!bandsintownUrl) return;

    const script = document.createElement("script");
    script.src = "https://widget.bandsintown.com/main.min.js";
    script.async = true;

    const a = document.createElement("a");
    a.setAttribute("class", "bit-widget-initializer");
    a.setAttribute("data-artist-name", bandsintownUrl);
    a.setAttribute("data-text-color", "#ffffff");
    a.setAttribute("data-link-color", "var(--accent-color)"); // brand CTA color
    a.setAttribute("data-background-color", "transparent");
    a.setAttribute("data-separator-color", "rgba(255, 255, 255, 0.73)");
    a.setAttribute("data-auto-style", "false");
    a.setAttribute("data-text-alignment", "left");
    a.setAttribute("data-display-limit", "4");



    containerRef.current.appendChild(a);
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [bandsintownUrl]);

  return <div ref={containerRef} />;
}
