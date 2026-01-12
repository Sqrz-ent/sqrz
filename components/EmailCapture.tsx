"use client";

import { useState } from "react";

export default function LeadCapture({
  profileId,
  headline,
  subline,
}: {
  profileId: string;
  headline?: string;
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
    <div className="sqrz-lead-box">
      <h3>{headline || "Get availability"}</h3>
      <p>{subline || "Enter your contact to receive a payment discount."}</p>

      {status === "success" ? (
        <p>Thanks — you’ll hear from us soon.</p>
      ) : (
        <div className="sqrz-lead-form">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button onClick={submit} disabled={status === "loading"}>
            {status === "loading" ? "Sending…" : "Get details"}
          </button>
        </div>
      )}
    </div>
  );
}
