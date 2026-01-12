"use client";

import { useState } from "react";

export default function LeadCapture({
  profileId,
  title = "Get discount now",
  subline = "Enter your email to receive a special offer.",
}: {
  profileId: string;
  title?: string;
  subline?: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function submit() {
    if (!email || !email.includes("@")) return;

    setStatus("loading");

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          profile_id: profileId,
        }),
      });

      setStatus("success");
    } catch (e) {
      setStatus("error");
    }
  }

  return (
    <div
      style={{
        background: "#f3b130",
        borderRadius: "16px",
        padding: "24px",
        maxWidth: "480px",
        margin: "32px auto",
        color: "#000",
        boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
      }}
    >
      <h3 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>
        {title}
      </h3>

      <p style={{ fontSize: "14px", marginBottom: "16px", opacity: 0.8 }}>
        {subline}
      </p>

      {status === "success" ? (
        <div style={{ fontSize: "16px", fontWeight: 600 }}>
          Thanks — check your inbox shortly.
        </div>
      ) : (
        <>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 16px",
              fontSize: "16px",
              borderRadius: "10px",
              border: "none",
              marginBottom: "12px",
            }}
          />

          <button
            onClick={submit}
            disabled={status === "loading"}
            style={{
              width: "100%",
              padding: "14px",
              fontSize: "16px",
              fontWeight: 600,
              borderRadius: "10px",
              border: "none",
              background: "#000",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            {status === "loading" ? "Sending…" : "Get offer"}
          </button>
        </>
      )}
    </div>
  );
}
