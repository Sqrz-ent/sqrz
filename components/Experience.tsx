type Employment = {
  company?: string;
  role?: string;
  from?: string;
  to?: string | null;
};

export default function Experience({
  jobs,
}: {
  jobs: Employment[];
}) {
  if (!jobs || jobs.length === 0) return null;

  return (
    <section style={{ marginTop: 40 }}>
      <h3 style={titleStyle}>Experience</h3>

      <div style={listStyle}>
        {jobs.map((job, i) => (
          <div key={i} style={cardStyle}>
            <div style={companyStyle}>
              {job.company}
            </div>

            {job.role && (
              <div style={roleStyle}>
                {job.role}
              </div>
            )}

            {(job.from || job.to) && (
              <div style={dateStyle}>
                {job.from || "—"} – {job.to || "Present"}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* styles */

const titleStyle = {
  color: "#f3b130",
  marginBottom: 12,
  fontSize: 18,
};

const listStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 16,
};

const cardStyle = {
  background: "#111",
  border: "1px solid #222",
  borderRadius: 14,
  padding: 16,
};

const companyStyle = {
  fontSize: 16,
  fontWeight: 600,
  color: "#fff",
};

const roleStyle = {
  fontSize: 14,
  color: "#ccc",
  marginTop: 4,
};

const dateStyle = {
  fontSize: 12,
  color: "#888",
  marginTop: 6,
};
