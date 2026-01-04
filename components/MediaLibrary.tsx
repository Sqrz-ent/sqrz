"use client";

import {
  FileText,
  Image as ImageIcon,
  Music,
  Video,
  Download,
  Archive,
} from "lucide-react";

type MediaItem = {
  id: number;
  title: string;
  type: string;
  file_url: string;
};

export default function MediaLibrary({
  items,
}: {
  items: MediaItem[];
}) {
  if (!items || items.length === 0) return null;

  return (
    <div style={containerStyle}>
      <h3 style={titleStyle}>Media & Downloads</h3>

      <div style={gridStyle}>
        {items.map((item) => (
          <div key={item.id} style={cardStyle}>
            <MediaPreview item={item} />

            <div style={{ marginTop: 8 }}>
              <div style={itemTitleStyle}>{item.title}</div>

              <a
                href={item.file_url}
                target="_blank"
                rel="noopener noreferrer"
                style={downloadStyle}
              >
                <Download size={14} />
                Download
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */

function MediaPreview({ item }: { item: MediaItem }) {
  switch (item.type) {
    case "image":
      return (
        <img
          src={item.file_url}
          alt={item.title}
          style={{ width: "100%", borderRadius: 8 }}
        />
      );

    case "audio":
      return (
        <audio controls style={{ width: "100%" }}>
          <source src={item.file_url} />
        </audio>
      );

    case "video":
      return (
        <video controls style={{ width: "100%", borderRadius: 8 }}>
          <source src={item.file_url} />
        </video>
      );

    case "pdf":
      return <FileText size={32} color="#f3b130" />;

    case "zip":
      return <Archive size={32} color="#f3b130" />;

    default:
      return <FileText size={32} color="#f3b130" />;
  }
}

/* ---------- Styles ---------- */

const containerStyle = {
  marginTop: 32,
};

const titleStyle = {
  marginBottom: 16,
  color: "#f3b130",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 16,
};

const cardStyle = {
  background: "#111",
  padding: 16,
  borderRadius: 12,
  textAlign: "left" as const,
};

const itemTitleStyle = {
  fontSize: 14,
  marginBottom: 6,
  color: "#fff",
};

const downloadStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontSize: 13,
  color: "#f3b130",
  textDecoration: "none",
};
