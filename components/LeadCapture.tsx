"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LeadCapture({
  profileId,
  username,
  title,
  subline,
}: {
  profileId: string;
  username: string;
  title?: string;
  subline?: string;
}) {

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function submit() {
    if (!email || !email.includes("@")) return;

    setStatus("loading");

    try {
      const { error } = await supabase.from("booking_requests").insert({
        to_profile_id: profileId,
        from_profile_id: null,
        message: email,
        source: "lead_capture",
        status: "new",
      });

      if (error) throw error;
      setStatus("success");
    } catch (e) {
      setStatus("error");
    }
  }

  return (
    <div
      style={{
        background: "#dedede19",
        borderRadius: "16px",
        padding: "24px",
        width: "100%",
        maxWidth: "520px",
        margin: "24px auto",
        color: "#ffffff",
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
              border: "solid",
              marginBottom: "12px",
              borderColor: " rgba(255, 255, 255, 0.16)"
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
              background: "var(--accent-color)",
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
