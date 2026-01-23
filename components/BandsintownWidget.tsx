"use client";

import { useEffect, useRef } from "react";

type BandsintownWidgetProps = {
  artistName: string; // e.g. "Coldplay"
  height?: number; // optional
};

export default function BandsintownWidget({
  artistName,
  height = 600,
}: BandsintownWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear old widget when artistName changes
    containerRef.current.innerHTML = "";

    // Bandsintown widget script (official embed)
    const script = document.createElement("script");
    script.src = "https://widget.bandsintown.com/main.min.js";
    script.async = true;

    // Add the widget anchor element
    const a = document.createElement("a");
    a.setAttribute("class", "bit-widget-initializer");
    a.setAttribute("data-artist-name", artistName);
    a.setAttribute("data-display-local-dates", "true");
    a.setAttribute("data-display-past-dates", "false");
    a.setAttribute("data-auto-style", "true");
    a.setAttribute("data-text-color", "#111111");
    a.setAttribute("data-link-color", "#f3b130"); // your brand color
    a.setAttribute("data-background-color", "transparent");
    a.setAttribute("data-display-limit", "10");
    a.setAttribute("data-separator-color", "rgba(0,0,0,0.08)");

    // Optional: give it a minimum height
    const wrapper = document.createElement("div");
    wrapper.style.minHeight = `${height}px`;

    wrapper.appendChild(a);
    containerRef.current.appendChild(wrapper);
    containerRef.current.appendChild(script);

    return () => {
      // cleanup
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [artistName, height]);

  return <div ref={containerRef} className="w-full" />;
}
