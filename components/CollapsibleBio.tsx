"use client";

import { useEffect, useRef, useState } from "react";

const COLLAPSED_MAX_HEIGHT = 220;

export default function CollapsibleBio({ bio }: { bio: string }) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    setOverflows(el.scrollHeight > COLLAPSED_MAX_HEIGHT + 8);
  }, [bio]);

  return (
    <div style={{ position: "relative", textAlign: "left" }}>
      <div
        ref={contentRef}
        style={{
          maxHeight: expanded ? "none" : COLLAPSED_MAX_HEIGHT,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {bio.split("\n\n").map((paragraph, i) => (
          <p
            key={i}
            style={{
              margin: i > 0 ? "1em 0 0" : 0,
              fontSize: 14,
              lineHeight: 1.75,
              color: "rgba(255,255,255,0.78)",
            }}
          >
            {paragraph.split("\n").map((line, j, arr) => (
              <span key={j}>
                {line}
                {j < arr.length - 1 && <br />}
              </span>
            ))}
          </p>
        ))}
      </div>

      {!expanded && overflows && (
        <div
          style={{
            position: "absolute",
            inset: "auto 0 0 0",
            height: 88,
            background:
              "linear-gradient(to bottom, rgba(13,13,13,0), rgba(13,13,13,0.95) 70%, rgba(13,13,13,1) 100%)",
            pointerEvents: "none",
          }}
        />
      )}

      {overflows && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          style={{
            marginTop: 16,
            padding: "9px 18px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.26)",
            background: "rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.92)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            position: "relative",
            zIndex: 1,
            boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
          }}
        >
          {expanded ? "Show less" : "Load more"}
        </button>
      )}
    </div>
  );
}
