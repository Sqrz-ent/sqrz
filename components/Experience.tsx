"use client";

import { useState } from "react";

type ExperienceItem = {
  id: string;
  company: string;
  date_start: string;
  date_end: string | null;
  role: string;
  deleted?: boolean;
};

const INITIAL_COUNT = 4;

export default function Experience({ jobs }: { jobs: ExperienceItem[] }) {
  const [showAll, setShowAll] = useState(false);

  if (!Array.isArray(jobs) || jobs.length === 0) return null;

  const visibleJobs = jobs
    .filter((job) => !job.deleted)
    .sort((a, b) => {
      // null end_date means "Present" — always sort first
      if (!a.date_end && !b.date_end) {
        return new Date(b.date_start || 0).getTime() - new Date(a.date_start || 0).getTime();
      }
      if (!a.date_end) return -1;
      if (!b.date_end) return 1;
      const diff = new Date(b.date_end).getTime() - new Date(a.date_end).getTime();
      if (diff !== 0) return diff;
      return new Date(b.date_start || 0).getTime() - new Date(a.date_start || 0).getTime();
    });

  if (visibleJobs.length === 0) return null;

  const hasMore = visibleJobs.length > INITIAL_COUNT;
  const displayed = showAll ? visibleJobs : visibleJobs.slice(0, INITIAL_COUNT);
  const hidden = visibleJobs.slice(INITIAL_COUNT);

  return (
    <section style={{ textAlign: "left" }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.38)",
          marginBottom: 8,
        }}
      >
        Background
      </div>
      <h3
        style={{
          fontSize: 24,
          lineHeight: 1.15,
          fontWeight: 700,
          marginBottom: 16,
          marginTop: 0,
          color: "var(--accent-color, #F3B130)",
        }}
      >
        Experience
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {displayed.map((job, i) => (
          <JobCard key={job.id} job={job} animate={showAll && i >= INITIAL_COUNT} />
        ))}

        {hasMore && !showAll && hidden.length > 0 && (
          <button
            onClick={() => setShowAll(true)}
            style={{
              alignSelf: "center",
              marginTop: 4,
              padding: "8px 20px",
              background: "none",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 20,
              color: "rgba(255,255,255,0.55)",
              fontSize: 13,
              cursor: "pointer",
              letterSpacing: "0.02em",
              transition: "border-color 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)";
              e.currentTarget.style.color = "rgba(255,255,255,0.8)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
              e.currentTarget.style.color = "rgba(255,255,255,0.55)";
            }}
          >
            Show {hidden.length} more
          </button>
        )}
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .exp-card-reveal {
          animation: fadeSlideIn 0.2s ease both;
        }
      `}</style>
    </section>
  );
}

function JobCard({ job, animate }: { job: ExperienceItem; animate?: boolean }) {
  return (
    <div
      className={animate ? "exp-card-reveal" : undefined}
      style={{
        background: "rgba(255,255,255,0.04)",
        borderRadius: 12,
        padding: 16,
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
        {job.company}
      </div>
      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
        {formatDateRange(job.date_start, job.date_end)}
      </div>
      {job.role && (
        <p style={{ fontSize: 14, lineHeight: 1.5, opacity: 0.9, margin: 0 }}>
          {job.role}
        </p>
      )}
    </div>
  );
}

/* =========================
   Helpers
========================= */

function formatDate(date?: string | null) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  if (d.getFullYear() === 1970) return null;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short" });
}

function formatDateRange(dateStart?: string | null, dateEnd?: string | null) {
  const start = formatDate(dateStart);
  const end = dateEnd ? formatDate(dateEnd) : "Present";
  if (!start) return end === "Present" ? "" : (end ?? "");
  return `${start} – ${end}`;
}
