"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StreamChat } from "stream-chat";

type InquirySession = {
  status?: "open";
  apiKey: string;
  token: string;
  visitorToken: string;
  thread: {
    id: string;
    visitorName: string | null;
    visitorEmail: string | null;
    channelId: string;
  };
  streamUser: {
    id: string;
    name: string;
  };
  owner: {
    profileId: string;
    displayName: string;
  };
};

type InquiryHandoff = {
  status: "converted";
  thread: {
    id: string;
    visitorName: string | null;
    visitorEmail: string | null;
    channelId: string;
  };
  handoff: {
    bookingId: string;
    accessUrl: string;
    ctaLabel: string;
    ownerDisplayName: string;
  };
};

type StreamMessage = {
  id: string;
  text: string;
  userName: string;
  userId: string;
  createdAt: string;
};

type StreamMessagePayload = {
  id?: string;
  text?: string;
  created_at?: string;
  user?: {
    id?: string;
    name?: string;
  };
};

type StreamChannelLike = {
  state: {
    messages: StreamMessagePayload[];
  };
  watch: () => Promise<void>;
  on: (eventType: string, listener: () => void) => { unsubscribe?: () => void };
  sendMessage: (message: { text: string }) => Promise<unknown>;
};

function mapMessages(messages: StreamMessagePayload[]) {
  return messages.map((message) => ({
    id: String(message.id ?? crypto.randomUUID()),
    text: String(message.text ?? ""),
    userName: String(message.user?.name ?? "Visitor"),
    userId: String(message.user?.id ?? ""),
    createdAt: String(message.created_at ?? new Date().toISOString()),
  }));
}

function timeLabel(value: string) {
  return new Date(value).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ProfileInquiryBubble({
  profileId,
  ownerName,
  enabled,
}: {
  profileId: string;
  ownerName: string;
  enabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [draft, setDraft] = useState("");
  const [session, setSession] = useState<InquirySession | null>(null);
  const [handoff, setHandoff] = useState<InquiryHandoff["handoff"] | null>(null);
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [sending, setSending] = useState(false);
  const clientRef = useRef<StreamChat | null>(null);
  const channelRef = useRef<StreamChannelLike | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const storageKey = useMemo(() => `sqrz_inquiry_${profileId}`, [profileId]);

  const resetInquiryState = useCallback((options?: { close?: boolean }) => {
    localStorage.removeItem(storageKey);
    setSession(null);
    setHandoff(null);
    setMessages([]);
    setError(null);
    setDraft("");
    channelRef.current = null;
    if (options?.close) {
      setOpen(false);
    }
  }, [storageKey]);

  async function ensureConnectedChannel(activeSession: InquirySession) {
    if (channelRef.current && clientRef.current?.userID === activeSession.streamUser.id) {
      return channelRef.current;
    }

    const client = StreamChat.getInstance(activeSession.apiKey);
    if (client.userID && client.userID !== activeSession.streamUser.id) {
      await client.disconnectUser();
    }
    if (!client.userID) {
      await client.connectUser(activeSession.streamUser, activeSession.token);
    }

    const channel = client.channel("messaging", activeSession.thread.channelId) as unknown as StreamChannelLike;
    await channel.watch();

    clientRef.current = client;
    channelRef.current = channel;
    setMessages(mapMessages(channel.state.messages));

    return channel;
  }

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function bootstrap() {
      const visitorToken = localStorage.getItem(storageKey);
      if (!visitorToken) return;

      try {
        const response = await fetch("/api/inquiries/bootstrap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileId, visitorToken }),
        });
        const payload = await response.json();
        if (!response.ok) {
          if (!cancelled) {
            resetInquiryState({ close: true });
          }
          return;
        }
        if (payload?.status === "converted" && payload?.handoff?.accessUrl) {
          if (!cancelled) {
            setSession(null);
            setMessages([]);
            setDraft("");
            setError(null);
            setHandoff(payload.handoff as InquiryHandoff["handoff"]);
          }
          return;
        }
        if (!payload?.thread?.id) {
          if (!cancelled) {
            resetInquiryState({ close: true });
          }
          return;
        }
        if (cancelled) return;
        setHandoff(null);
        setSession(payload as InquirySession);
        setName((payload.thread.visitorName as string | null) ?? "");
        setEmail((payload.thread.visitorEmail as string | null) ?? "");
      } catch {
        // Silent rejoin failure is fine for v1.
      }
    }

    void bootstrap();
    const intervalId = window.setInterval(() => {
      void bootstrap();
    }, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [enabled, profileId, resetInquiryState, session, storageKey]);

  useEffect(() => {
    if (!session) return;

    let active = true;
    let subscription: { unsubscribe?: () => void } | null = null;
    const activeSession = session;

    async function connect() {
      const channel = await ensureConnectedChannel(activeSession);
      if (!active) return;
      subscription = channel.on("message.new", () => {
        setMessages(mapMessages(channel.state.messages));
      });
    }

    void connect().catch((err) => {
      if (active) setError(err instanceof Error ? err.message : "Failed to connect chat");
    });

    return () => {
      active = false;
      subscription?.unsubscribe?.();
    };
  }, [session]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    return () => {
      const client = clientRef.current;
      if (client) {
        client.disconnectUser().catch(() => {});
      }
    };
  }, []);

  if (!enabled) return null;

  async function ensureSessionForSend() {
    if (session) return session;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/inquiries/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          visitorToken: localStorage.getItem(storageKey),
          visitorName: name,
          visitorEmail: email,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to start inquiry");
      }

      localStorage.setItem(storageKey, payload.visitorToken);
      setHandoff(null);
      setSession(payload as InquirySession);
      return payload as InquirySession;
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    const text = draft.trim();
    if (!text || sending) return;
    if (!name.trim() || !email.trim()) {
      setError("Please add your name and email first.");
      return;
    }

    setSending(true);
    setError(null);

    try {
      const activeSession = await ensureSessionForSend();
      if (!activeSession) return;
      const channel = await ensureConnectedChannel(activeSession);
      await channel.sendMessage({ text });
      try {
        const notifyResponse = await fetch("/api/inquiries/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            threadId: activeSession.thread.id,
            messageText: text,
          }),
          keepalive: true,
        });

        if (!notifyResponse.ok) {
          const notifyPayload = await notifyResponse.json().catch(() => null);
          console.error("[ProfileInquiryBubble] notify failed", notifyPayload ?? notifyResponse.status);
        }
      } catch (notifyError) {
        console.error("[ProfileInquiryBubble] notify request failed", notifyError);
      }
      setMessages(mapMessages(channel.state.messages));
      setDraft("");
      setOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {open && (
        <div
          style={{
            position: "fixed",
            right: 20,
            bottom: 92,
            width: "min(360px, calc(100vw - 32px))",
            height: 480,
            background: "#111111",
            border: "1px solid rgba(243,177,48,0.28)",
            borderRadius: 20,
            boxShadow: "0 24px 80px rgba(0,0,0,0.42)",
            overflow: "hidden",
            zIndex: 90,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "linear-gradient(180deg, rgba(243,177,48,0.12), rgba(243,177,48,0.04))",
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Live with {ownerName}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Beta inquiry chat</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.6)",
                fontSize: 18,
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>

          {!session && !handoff && (
            <div style={{ padding: 16, display: "grid", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  color: "#fff",
                  padding: "10px 12px",
                  fontSize: 14,
                }}
              />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Your email"
                type="email"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  color: "#fff",
                  padding: "10px 12px",
                  fontSize: 14,
                }}
              />
            </div>
          )}

          <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
            {handoff ? (
              <div
                style={{
                  margin: "auto 0",
                  display: "grid",
                  gap: 12,
                  padding: 16,
                  background: "rgba(243,177,48,0.08)",
                  border: "1px solid rgba(243,177,48,0.18)",
                  borderRadius: 16,
                }}
              >
                <div style={{ color: "#fff", fontSize: 15, fontWeight: 700 }}>Your proposal is ready</div>
                <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 13, lineHeight: 1.6 }}>
                  {handoff.ownerDisplayName} has created your booking. Continue in the booking view to review the proposal and keep chatting there.
                </div>
                <a
                  href={handoff.accessUrl}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#F3B130",
                    color: "#111",
                    borderRadius: 12,
                    padding: "12px 16px",
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  {handoff.ctaLabel}
                </a>
              </div>
            ) : messages.length === 0 ? (
              <div style={{ margin: "auto 0", color: "rgba(255,255,255,0.55)", fontSize: 13, lineHeight: 1.6 }}>
                Send a message and {ownerName} can reply here in real time.
              </div>
            ) : (
              messages.map((message) => {
                const isVisitor = message.userId === session?.streamUser.id;
                return (
                  <div
                    key={message.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isVisitor ? "flex-end" : "flex-start",
                      gap: 4,
                    }}
                  >
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>
                      {isVisitor ? "You" : ownerName}
                    </div>
                    <div
                      style={{
                        maxWidth: "82%",
                        padding: "10px 12px",
                        borderRadius: isVisitor ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        background: isVisitor ? "#F3B130" : "rgba(255,255,255,0.08)",
                        color: isVisitor ? "#111" : "#fff",
                        fontSize: 13,
                        lineHeight: 1.5,
                      }}
                    >
                      {message.text}
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                      {timeLabel(message.createdAt)}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: 12, display: "grid", gap: 8 }}>
            {error && <div style={{ color: "#fca5a5", fontSize: 12 }}>{error}</div>}
            {!handoff && (
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder={session ? `Message ${ownerName}…` : "Start the conversation…"}
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  color: "#fff",
                  padding: "12px 14px",
                  fontSize: 14,
                }}
              />
              <button
                onClick={() => void handleSend()}
                disabled={sending || loading || !draft.trim()}
                style={{
                  background: "#F3B130",
                  color: "#111",
                  border: "none",
                  borderRadius: 12,
                  padding: "0 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  opacity: sending || loading || !draft.trim() ? 0.55 : 1,
                  cursor: sending || loading || !draft.trim() ? "default" : "pointer",
                }}
              >
                Send
              </button>
            </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((value) => !value)}
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          width: 58,
          height: 58,
          borderRadius: "50%",
          border: "1px solid rgba(243,177,48,0.35)",
          background: "linear-gradient(180deg, #F3B130, #D89516)",
          color: "#111",
          fontSize: 22,
          fontWeight: 800,
          boxShadow: "0 18px 40px rgba(0,0,0,0.32)",
          cursor: "pointer",
          zIndex: 90,
        }}
        aria-label="Open inquiry chat"
      >
        💬
      </button>
    </>
  );
}
