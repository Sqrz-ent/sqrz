"use client";

import { useEffect, useRef } from "react";

type BandsintownWidgetProps = {
  bandsintownUrl: string;
};

const getSlug = (value: string): string => {
  if (!value) return '';
  if (value.includes('bandsintown.com/a/')) {
    return value.split('/a/')[1].split('?')[0].split('/')[0];
  }
  return value.trim();
};

export default function BandsintownWidget({ bandsintownUrl }: BandsintownWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = () => {
      if (!containerRef.current || !bandsintownUrl) return;
      containerRef.current.innerHTML = "";

      const artist = getSlug(bandsintownUrl);
      if (!artist) return;

      const script = document.createElement("script");
      script.src = "https://widget.bandsintown.com/main.min.js";
      script.async = true;

      const a = document.createElement("a");
      a.setAttribute("class", "bit-widget-initializer");
      a.setAttribute("data-artist-name", artist);
      a.setAttribute("data-text-color", "#ffffff");
      a.setAttribute("data-link-color", "var(--accent-color)"); // brand CTA color
      a.setAttribute("data-background-color", "transparent");
      a.setAttribute("data-separator-color", "rgba(255, 255, 255, 0.73)");
      a.setAttribute("data-auto-style", "false");
      a.setAttribute("data-text-alignment", "left");
      a.setAttribute("data-display-limit", "4");

      containerRef.current.appendChild(a);
      containerRef.current.appendChild(script);
    };

    if (document.readyState === 'complete') {
      init();
    } else {
      window.addEventListener('load', init, { once: true });
    }

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [bandsintownUrl]);

  return <div ref={containerRef} />;
}
