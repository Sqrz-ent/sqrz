type ExperienceItem = {
  id: string;
  employer: string;
  date_start: string;
  date_end: string | null;
  responsibilities: string;
  deleted?: boolean;
};

export default function Experience({ jobs }: { jobs: ExperienceItem[] }) {
  if (!Array.isArray(jobs) || jobs.length === 0) return null;

  const visibleJobs = jobs.filter(job => !job.deleted);

  if (visibleJobs.length === 0) return null;

  return (
    <section style={{ marginTop: 40, textAlign: "left" }}>
      <h3
        style={{
          fontSize: 18,
          fontWeight: 600,
          marginBottom: 16,
          opacity: 0.85,
        }}
      >
        Experience
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {visibleJobs.map(job => (
          <div
            key={job.id}
            style={{
              background: "rgba(255,255,255,0.04)",
              borderRadius: 12,
              padding: 16,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {/* Employer */}
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              {job.employer}
            </div>

            {/* Dates */}
            <div
              style={{
                fontSize: 12,
                opacity: 0.7,
                marginBottom: 8,
              }}
            >
              {formatDate(job.date_start)} –{" "}
              {job.date_end ? formatDate(job.date_end) : "Present"}
            </div>

            {/* Responsibilities */}
            {job.responsibilities && (
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.5,
                  opacity: 0.9,
                  margin: 0,
                }}
              >
                {job.responsibilities}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* =========================
   Helpers
========================= */

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
  });
}
