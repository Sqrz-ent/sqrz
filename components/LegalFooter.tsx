"use client";

import { useState, useEffect } from "react";

type Props = {
  privacyHref: string;
  profileName: string | null;
  companyName: string | null;
  legalForm: string | null;
  companyAddress: string | null;
  companyTaxId: string | null;
  vatId: string | null;
  tradeRegisterCourt: string | null;
  tradeRegisterNumber: string | null;
  regulatoryBody: string | null;
  dpoEmail: string | null;
  externalPrivacyUrl: string | null;
  responsiblePerson: string | null;
};

export default function LegalFooter({
  privacyHref,
  profileName,
  companyName,
  legalForm,
  companyAddress,
  companyTaxId,
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

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  useEffect(() => {
    function onHashChange() {
      if (window.location.hash === "#legal") {
        setOpen(true);
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const displayName = companyName || profileName || "";
  const year = new Date().getFullYear();

  // Section 2: Business Details
  const hasBusinessDetails = !!(vatId || tradeRegisterCourt || tradeRegisterNumber || regulatoryBody || responsiblePerson || companyTaxId);
  const tradeRegister = [tradeRegisterCourt, tradeRegisterNumber].filter(Boolean).join(" · ");

  // Section 3: Data Protection — always show (privacy page link is always available)
  const hasDataProtection = true;

  // Section 1: Identity
  const hasIdentity = !!(displayName || legalForm || companyAddress);

  return (
    <>
      {/* Footer bar */}
      <div style={{
        textAlign: "center",
        padding: "0.5rem 0 1rem",
        opacity: 0.45,
      }}>
        <span style={{ fontSize: 12, color: "inherit", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
          © {year} {displayName || profileName}
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
              maxHeight: "80vh",
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

            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#999", margin: "0 0 20px" }}>
              Legal Information
            </p>

            {/* Section 1: Identity */}
            {hasIdentity && (
              <section style={{ marginBottom: 20 }}>
                {displayName && <p style={nameStyle}>{displayName}</p>}
                {legalForm && <p style={lineStyle}>{legalForm}</p>}
                {companyAddress && <p style={lineStyle}>{companyAddress}</p>}
              </section>
            )}

            {/* Section 2: Business Details */}
            {hasBusinessDetails && (
              <>
                <div style={divider} />
                <section style={{ marginTop: 16, marginBottom: 20 }}>
                  <p style={sectionLabel}>Business Information</p>
                  {vatId && <p style={lineStyle}>VAT ID: {vatId}</p>}
                  {tradeRegister && <p style={lineStyle}>Trade Register: {tradeRegister}</p>}
                  {companyTaxId && <p style={lineStyle}>Tax Number: {companyTaxId}</p>}
                  {regulatoryBody && <p style={lineStyle}>Regulatory Body: {regulatoryBody}</p>}
                  {responsiblePerson && <p style={lineStyle}>Responsible Person: {responsiblePerson}</p>}
                </section>
              </>
            )}

            {/* Section 3: Data & Privacy */}
            {hasDataProtection && (
              <>
                <div style={divider} />
                <section style={{ marginTop: 16, marginBottom: 20 }}>
                  <p style={sectionLabel}>Data &amp; Privacy</p>
                  {dpoEmail && (
                    <p style={lineStyle}>
                      Data Protection Officer:{" "}
                      <a href={`mailto:${dpoEmail}`} style={linkStyle}>{dpoEmail}</a>
                    </p>
                  )}
                  <p style={lineStyle}>
                    Privacy Policy:{" "}
                    <a href={privacyHref} style={linkStyle}>
                      View Privacy Policy →
                    </a>
                  </p>
                </section>
              </>
            )}

            {/* Tracking disclosure */}
            {(hasIdentity || hasBusinessDetails || hasDataProtection) && (
              <div style={{ ...lineStyle, fontSize: 12, color: "#aaa", lineHeight: 1.6, marginBottom: 20 }}>
                This page may use analytics and tracking technologies. See{" "}
                <a href="https://sqrz.com/privacy" target="_blank" rel="noopener noreferrer" style={linkStyle}>
                  SQRZ Privacy Policy
                </a>{" "}
                for details.
              </div>
            )}

            {/* Section 4: Powered by SQRZ — always shown */}
            <div style={divider} />
            <p style={{ fontSize: 12, color: "#bbb", margin: "16px 0 0", lineHeight: 1.6 }}>
              Powered by{" "}
              <a href="https://sqrz.com" target="_blank" rel="noopener noreferrer" style={linkStyle}>
                SQRZ
              </a>
              {" · "}
              <a href="https://sqrz.com/privacy" target="_blank" rel="noopener noreferrer" style={linkStyle}>
                sqrz.com/privacy
              </a>
            </p>
          </div>
        </>
      )}
    </>
  );
}

const nameStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: "#111",
  margin: "0 0 4px",
  lineHeight: 1.4,
};

const lineStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#444",
  margin: "0 0 4px",
  lineHeight: 1.6,
};

const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "#999",
  margin: "0 0 10px",
};

const divider: React.CSSProperties = {
  borderTop: "1px solid #f0f0f0",
};

const linkStyle: React.CSSProperties = {
  color: "#F3B130",
  textDecoration: "none",
};
