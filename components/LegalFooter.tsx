"use client";

import { useState, useEffect } from "react";

type Props = {
  profileName: string | null;
  companyAddress: string | null;
  vatId: string | null;
  tradeRegisterCourt: string | null;
  tradeRegisterNumber: string | null;
  regulatoryBody: string | null;
  dpoEmail: string | null;
  externalPrivacyUrl: string | null;
  responsiblePerson: string | null;
};

export default function LegalFooter({
  profileName,
  companyAddress,
  vatId,
  tradeRegisterCourt,
  tradeRegisterNumber,
  regulatoryBody,
  dpoEmail,
  externalPrivacyUrl,
  responsiblePerson,
}: Props) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  // Animate in/out
  useEffect(() => {
    if (open) {
      // Mount then slide up
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  // Close on hash link click
  useEffect(() => {
    function onHashChange() {
      if (window.location.hash === "#legal") {
        setOpen(true);
        // Clear hash without scroll
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const hasLegalFields = !!(responsiblePerson || vatId);
  const displayName = responsiblePerson || profileName || "";
  const privacyUrl = externalPrivacyUrl || "https://sqrz.com/privacy";
  const year = new Date().getFullYear();

  return (
    <>
      {/* Footer bar */}
      <div style={{
        textAlign: "center",
        padding: "0.5rem 0 1rem",
        opacity: 0.45,
      }}>
        <span style={{ fontSize: 12, color: "inherit", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
          © {year} {profileName}
          {" · "}
          <button
            onClick={() => setOpen(true)}
            style={{
              background: "none",
              border: "none",
              color: "inherit",
              fontSize: 12,
              cursor: "pointer",
              padding: 0,
              textDecoration: "underline",
              fontFamily: "inherit",
            }}
          >
            Legal
          </button>
        </span>
      </div>

      {/* Bottom sheet */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              zIndex: 900,
              opacity: visible ? 1 : 0,
              transition: "opacity 0.25s ease",
            }}
          />

          {/* Sheet */}
          <div
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 901,
              background: "#fff",
              color: "#111",
              borderRadius: "16px 16px 0 0",
              padding: "24px 24px 40px",
              maxHeight: "75vh",
              overflowY: "auto",
              transform: visible ? "translateY(0)" : "translateY(100%)",
              transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
              fontFamily: "ui-sans-serif, system-ui, sans-serif",
            }}
          >
            {/* Handle + close */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "#ddd", margin: "0 auto" }} />
              <button
                onClick={() => setOpen(false)}
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  background: "none",
                  border: "none",
                  fontSize: 18,
                  cursor: "pointer",
                  color: "#999",
                  lineHeight: 1,
                  padding: 4,
                }}
              >
                ✕
              </button>
            </div>

            {hasLegalFields ? (
              <>
                {/* User Impressum */}
                <section style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", margin: "0 0 12px" }}>
                    Impressum
                  </p>
                  {displayName && (
                    <p style={lineStyle}>{displayName}</p>
                  )}
                  {companyAddress && (
                    <p style={lineStyle}>{companyAddress}</p>
                  )}
                  {vatId && (
                    <p style={lineStyle}>VAT ID: {vatId}</p>
                  )}
                  {(tradeRegisterCourt || tradeRegisterNumber) && (
                    <p style={lineStyle}>
                      Trade Register: {[tradeRegisterCourt, tradeRegisterNumber].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {regulatoryBody && (
                    <p style={lineStyle}>Regulatory Body: {regulatoryBody}</p>
                  )}
                  {dpoEmail && (
                    <p style={lineStyle}>
                      DPO: <a href={`mailto:${dpoEmail}`} style={linkStyle}>{dpoEmail}</a>
                    </p>
                  )}
                  <p style={{ ...lineStyle, marginTop: 8 }}>
                    <a href={privacyUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                      Privacy Policy ↗
                    </a>
                  </p>
                </section>

                <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 16 }}>
                  <p style={{ fontSize: 12, color: "#999", margin: 0, lineHeight: 1.6 }}>
                    This site uses tracking technologies.{" "}
                    <a href="https://sqrz.com/privacy" target="_blank" rel="noopener noreferrer" style={linkStyle}>
                      SQRZ Privacy Policy
                    </a>
                  </p>
                </div>
              </>
            ) : (
              <>
                <p style={{ fontSize: 13, color: "#555", margin: "0 0 12px" }}>
                  Powered by{" "}
                  <a href="https://sqrz.com" target="_blank" rel="noopener noreferrer" style={linkStyle}>
                    SQRZ
                  </a>
                  {" · "}
                  <a href="https://sqrz.com/privacy" target="_blank" rel="noopener noreferrer" style={linkStyle}>
                    Privacy Policy
                  </a>
                </p>
                <p style={{ fontSize: 12, color: "#999", margin: 0, lineHeight: 1.6 }}>
                  This site uses tracking technologies to improve your experience.
                </p>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}

const lineStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#444",
  margin: "0 0 4px",
  lineHeight: 1.6,
};

const linkStyle: React.CSSProperties = {
  color: "#F3B130",
  textDecoration: "none",
};
